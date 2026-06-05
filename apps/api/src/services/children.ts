import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { SMSProvider } from './integrations/interfaces';

export interface ChildProfileCreateData {
  firstName: string;
  lastName: string;
  birthday: string; // ISO String
  allergies?: string;
  medicalNotes?: string;
  consentWaiverSigned?: boolean;
  primaryGuardianId: string;
  relationship: string;
}

export interface ChildrenClassCreateData {
  name: string;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  roomNumber?: string;
  capacityLimit?: number;
}

export interface ClassResourceUploadData {
  classId: string;
  title: string;
  description?: string;
  fileUrl: string;
  publishDate: string; // ISO String
}

/**
 * 1. Child Profile & Guardian Setup
 */
export async function createChildProfile(tenantId: string, data: ChildProfileCreateData) {
  return await prisma.$transaction(async (tx) => {
    // A child profile must link to a Member record. Create the child Member record.
    const childMember = await tx.member.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        birthday: new Date(data.birthday),
        familyRole: 'child',
        membershipStatus: 'visitor',
      }
    });

    // Create the child profile linked to this member
    const profile = await tx.childProfile.create({
      data: {
        tenantId,
        memberId: childMember.id,
        allergies: data.allergies || null,
        medicalNotes: data.medicalNotes || null,
        consentWaiverSigned: data.consentWaiverSigned ?? false,
        consentWaiverSignedAt: data.consentWaiverSigned ? new Date() : null,
      }
    });

    // Register primary guardian link
    await tx.childGuardian.create({
      data: {
        tenantId,
        childProfileId: profile.id,
        guardianMemberId: data.primaryGuardianId,
        relationship: data.relationship,
        isPrimary: true,
        isAuthorizedPickup: true,
      }
    });

    return {
      ...profile,
      member: childMember
    };
  });
}

export async function getChildProfile(tenantId: string, childProfileId: string) {
  const profile = await prisma.childProfile.findFirst({
    where: { id: childProfileId, tenantId },
    include: {
      member: true,
      guardians: {
        include: { guardianMember: true }
      },
      pickupAuthorizations: true,
      classEnrollments: {
        include: { class: true }
      },
      checkIns: {
        orderBy: { checkInTime: 'desc' }
      }
    }
  });

  if (!profile) {
    throw new Error('Child profile not found');
  }

  return profile;
}

export async function listChildProfiles(tenantId: string, filters: { search?: string; classId?: string } = {}) {
  const whereClause: any = { tenantId };

  if (filters.classId) {
    whereClause.classEnrollments = {
      some: { classId: filters.classId }
    };
  }

  if (filters.search) {
    whereClause.member = {
      OR: [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } }
      ]
    };
  }

  return await prisma.childProfile.findMany({
    where: whereClause,
    include: {
      member: true,
      classEnrollments: {
        include: { class: true }
      }
    }
  });
}

/**
 * 2. Guardians & Pickup Authorizations
 */
export async function addChildGuardian(
  tenantId: string,
  data: {
    childProfileId: string;
    guardianMemberId: string;
    relationship: string;
    isPrimary?: boolean;
    isAuthorizedPickup?: boolean;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // If setting to primary, unset previous primary guardians
    if (data.isPrimary) {
      await tx.childGuardian.updateMany({
        where: { childProfileId: data.childProfileId, tenantId },
        data: { isPrimary: false }
      });
    }

    return await tx.childGuardian.create({
      data: {
        tenantId,
        childProfileId: data.childProfileId,
        guardianMemberId: data.guardianMemberId,
        relationship: data.relationship,
        isPrimary: data.isPrimary ?? false,
        isAuthorizedPickup: data.isAuthorizedPickup ?? true,
      }
    });
  });
}

export async function addPickupAuthorization(
  tenantId: string,
  data: {
    childProfileId: string;
    authorizedPersonName: string;
    authorizedPersonPhone: string;
    relationship: string;
    notes?: string;
  }
) {
  return await prisma.pickupAuthorization.create({
    data: {
      tenantId,
      childProfileId: data.childProfileId,
      authorizedPersonName: data.authorizedPersonName,
      authorizedPersonPhone: data.authorizedPersonPhone,
      relationship: data.relationship,
      notes: data.notes || null,
      isActive: true,
    }
  });
}

export async function revokePickupAuthorization(tenantId: string, authId: string) {
  const auth = await prisma.pickupAuthorization.findFirst({
    where: { id: authId, tenantId }
  });

  if (!auth) {
    throw new Error('Pickup authorization not found');
  }

  return await prisma.pickupAuthorization.update({
    where: { id: authId },
    data: { isActive: false }
  });
}

/**
 * 3. Class Management
 */
export async function createChildrenClass(tenantId: string, data: ChildrenClassCreateData) {
  return await prisma.childrenClass.create({
    data: {
      tenantId,
      name: data.name,
      minAgeMonths: data.minAgeMonths ?? 0,
      maxAgeMonths: data.maxAgeMonths ?? 180,
      roomNumber: data.roomNumber || null,
      capacityLimit: data.capacityLimit ?? 20,
    }
  });
}

export async function enrollChildInClass(tenantId: string, childProfileId: string, classId: string) {
  const child = await prisma.childProfile.findFirst({ where: { id: childProfileId, tenantId } });
  if (!child) throw new Error('Child profile not found');

  const classroom = await prisma.childrenClass.findFirst({ where: { id: classId, tenantId } });
  if (!classroom) throw new Error('Children class not found');

  return await prisma.childrenClassEnrollment.create({
    data: {
      tenantId,
      classId,
      childProfileId,
    }
  });
}

export async function listChildrenClasses(tenantId: string) {
  return await prisma.childrenClass.findMany({
    where: { tenantId }
  });
}

export async function uploadClassResource(tenantId: string, data: ClassResourceUploadData) {
  const classroom = await prisma.childrenClass.findFirst({ where: { id: data.classId, tenantId } });
  if (!classroom) throw new Error('Children class not found');

  return await prisma.childrenClassResource.create({
    data: {
      tenantId,
      classId: data.classId,
      title: data.title,
      description: data.description || null,
      fileUrl: data.fileUrl,
      publishDate: new Date(data.publishDate),
    }
  });
}

export async function getClassResources(tenantId: string, classId: string) {
  return await prisma.childrenClassResource.findMany({
    where: { classId, tenantId },
    orderBy: { publishDate: 'desc' }
  });
}

/**
 * 4. Secure Check-In / Check-Out & Alerts
 */
export async function checkInChild(
  tenantId: string,
  childProfileId: string,
  classId: string,
  checkedInByMemberId: string,
  notes?: string
) {
  // Check class capacity
  const classroom = await prisma.childrenClass.findFirst({
    where: { id: classId, tenantId },
  });

  if (!classroom) {
    throw new Error('Children class not found');
  }

  const activeCheckIns = await prisma.childrenCheckIn.count({
    where: { classId, tenantId, status: 'checked_in' }
  });

  if (activeCheckIns >= classroom.capacityLimit) {
    throw new Error('Class capacity limit reached');
  }

  // Verify checking-in adult is an authorized guardian
  const isGuardian = await prisma.childGuardian.findFirst({
    where: {
      childProfileId,
      guardianMemberId: checkedInByMemberId,
      tenantId,
      isAuthorizedPickup: true
    }
  });

  if (!isGuardian) {
    throw new Error('Adult is not authorized to check in this child');
  }

  // Generate security code
  const securityCode = `KIDS-${Math.floor(1000 + Math.random() * 9000)}`;

  return await prisma.childrenCheckIn.create({
    data: {
      tenantId,
      childProfileId,
      classId,
      securityCode,
      checkedInByMemberId,
      status: 'checked_in',
      notes: notes || null,
    }
  });
}

export async function checkOutChild(
  tenantId: string,
  checkInId: string,
  checkingOutAdultId: string,
  securityCode: string
) {
  const checkIn = await prisma.childrenCheckIn.findFirst({
    where: { id: checkInId, tenantId, status: 'checked_in' }
  });

  if (!checkIn) {
    throw new Error('Active check-in record not found');
  }

  // Match security code
  if (checkIn.securityCode !== securityCode) {
    throw new Error('Invalid security code');
  }

  // Verify adult is authorized
  const isGuardian = await prisma.childGuardian.findFirst({
    where: {
      childProfileId: checkIn.childProfileId,
      guardianMemberId: checkingOutAdultId,
      tenantId,
      isAuthorizedPickup: true,
    }
  });

  let isCustomPickup = false;
  if (!isGuardian) {
    const customPickup = await prisma.pickupAuthorization.findFirst({
      where: {
        childProfileId: checkIn.childProfileId,
        tenantId,
        isActive: true,
        // Match checkingOutAdultId to an authorized pickup person -
        // Wait, since PickupAuthorization holds a raw string name/phone, we can check if there's any active pickup authorization
        // or check if checkingOutAdultId matches any Member phone/email or just allow check-out.
        // Wait, if checkingOutAdultId is a Member, we can match their phone to PickupAuthorization's authorizedPersonPhone!
      }
    });

    if (customPickup) {
      const adultMember = await prisma.member.findUnique({ where: { id: checkingOutAdultId } });
      if (adultMember && adultMember.phone && adultMember.phone === customPickup.authorizedPersonPhone) {
        isCustomPickup = true;
      }
    }
  }

  if (!isGuardian && !isCustomPickup) {
    throw new Error('Adult is not authorized to pick up this child');
  }

  return await prisma.childrenCheckIn.update({
    where: { id: checkInId },
    data: {
      status: 'checked_out',
      checkOutTime: new Date(),
      checkedOutByMemberId: checkingOutAdultId,
    }
  });
}

export async function notifyParent(tenantId: string, checkInId: string, message: string) {
  const checkIn = await prisma.childrenCheckIn.findFirst({
    where: { id: checkInId, tenantId },
    include: { childProfile: { include: { member: true } } }
  });

  if (!checkIn) {
    throw new Error('Check-in record not found');
  }

  const primaryGuardian = await prisma.childGuardian.findFirst({
    where: { childProfileId: checkIn.childProfileId, tenantId, isPrimary: true },
    include: { guardianMember: true }
  });

  if (!primaryGuardian || !primaryGuardian.guardianMember.phone) {
    throw new Error('Primary guardian does not have a configured phone number');
  }

  const recipientPhone = primaryGuardian.guardianMember.phone;

  // Resolve driver and send SMS
  const driver: SMSProvider = await resolveDriver(tenantId, 'sms', 'children-family');
  const result = await driver.sendSMS(recipientPhone, message);

  if (!result.success) {
    throw new Error(result.error || 'Failed to dispatch SMS notification');
  }

  return { success: true, recipient: recipientPhone };
}

/**
 * 5. Analytics & Reports
 */
export async function getFamilyMinistryReport(tenantId: string) {
  // Aggregate children check-ins
  const checkInsCount = await prisma.childrenCheckIn.count({
    where: { tenantId }
  });

  const checkInsByClass = await prisma.childrenCheckIn.groupBy({
    by: ['classId'],
    where: { tenantId },
    _count: { id: true }
  });

  // Fetch classes to map names
  const classes = await prisma.childrenClass.findMany({ where: { tenantId } });
  const classesMap = new Map(classes.map((c) => [c.id, c.name]));

  const distribution = checkInsByClass.map((item) => ({
    classId: item.classId,
    className: classesMap.get(item.classId) || 'Unknown Room',
    count: item._count.id
  }));

  // Fetch adult attendance check-ins from MemberCheckIn model to compare
  const adultCheckInsCount = await prisma.memberCheckIn.count({
    where: { tenantId, type: { in: ['service', 'church_service'] } }
  });

  const childrenToAdultRatio = adultCheckInsCount > 0
    ? parseFloat(((checkInsCount / adultCheckInsCount) * 100).toFixed(1))
    : 0.0;

  return {
    totalChildrenCheckIns: checkInsCount,
    classDistribution: distribution,
    comparison: {
      totalAdultCheckIns: adultCheckInsCount,
      ratioPercent: childrenToAdultRatio
    }
  };
}
