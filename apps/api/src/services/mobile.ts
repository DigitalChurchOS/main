import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// ────────────────────────────────────────────────────────────
// 1. CONFIG & CHURCH DIRECTORY
// ────────────────────────────────────────────────────────────

export async function searchChurches(query: string): Promise<any[]> {
  if (!query) return [];
  
  return await prisma.tenant.findMany({
    where: {
      status: 'active',
      OR: [
        { name: { contains: query } },
        { subdomain: { contains: query } },
      ],
    },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
    },
    take: 10,
  });
}

export async function getTenantMobileConfig(subdomainInput: string): Promise<any> {
  const cleanInput = subdomainInput.trim().toLowerCase();

  // Try exact match on subdomain or customDomain
  let tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: cleanInput },
        { customDomain: cleanInput }
      ]
    },
    include: {
      tenantModules: {
        where: { status: 'active' },
        select: { moduleKey: true },
      },
      themes: {
        where: { isCustom: true },
        take: 1,
      },
    },
  });

  // If not found and the input looks like a domain name, try extracting the subdomain segment
  if (!tenant && cleanInput.includes('.')) {
    const parsedSubdomain = cleanInput.split('.')[0];
    tenant = await prisma.tenant.findFirst({
      where: { subdomain: parsedSubdomain },
      include: {
        tenantModules: {
          where: { status: 'active' },
          select: { moduleKey: true },
        },
        themes: {
          where: { isCustom: true },
          take: 1,
        },
      },
    });
  }

  if (!tenant) {
    throw new Error('Church workspace not found');
  }

  // Parse theme settings if available
  let themeSettings = null;
  if (tenant.themes[0]) {
    try {
      themeSettings = JSON.parse(tenant.themes[0].settings);
    } catch {
      themeSettings = tenant.themes[0].settings;
    }
  }

  return {
    tenantId: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    customDomain: tenant.customDomain,
    activeModules: tenant.tenantModules.map((m) => m.moduleKey),
    theme: themeSettings,
  };
}

// ────────────────────────────────────────────────────────────
// 2. MOBILE AUTHENTICATION
// ────────────────────────────────────────────────────────────

export async function mobileLogin(
  tenantId: string,
  data: {
    emailOrPhone: string;
    password?: string;
  }
): Promise<any> {
  const input = data.emailOrPhone.trim();

  // A. Email & Password authentication path
  if (data.password) {
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        email: { equals: input },
      },
    });

    if (!user || user.status !== 'active') {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const member = await prisma.member.findFirst({
      where: { userId: user.id, tenantId },
    });

    const token = jwt.sign(
      { userId: user.id, tenantId, email: user.email },
      JWT_SECRET
    );

    return { token, user: { id: user.id, email: user.email, status: user.status }, member };
  }

  // B. Passwordless Phone direct Member authentication path
  // (Convenience lookup check for mobile layouts)
  const member = await prisma.member.findFirst({
    where: {
      tenantId,
      phone: input,
    },
  });

  if (!member) {
    throw new Error('No member profile found with this phone number');
  }

  let userId = member.userId;
  let userEmail = member.email || `${member.phone}@mobile.churchos.org`;

  // If no user account is linked to this member profile, auto-create one
  if (!userId) {
    let existingUser = await prisma.user.findFirst({
      where: { tenantId, email: { equals: userEmail } },
    });

    if (!existingUser) {
      const passHash = await bcrypt.hash('random-mobile-pw-' + Math.random(), 12);
      existingUser = await prisma.user.create({
        data: {
          tenantId,
          email: userEmail.toLowerCase().trim(),
          passwordHash: passHash,
          status: 'active',
        },
      });
    }

    userId = existingUser.id;

    // Link member to this user
    await prisma.member.update({
      where: { id: member.id },
      data: { userId },
    });
  }

  const token = jwt.sign(
    { userId, tenantId, email: userEmail },
    JWT_SECRET
  );

  const updatedMember = await prisma.member.findFirst({
    where: { id: member.id },
  });

  return {
    token,
    user: { id: userId, email: userEmail, status: 'active' },
    member: updatedMember,
  };
}

// ────────────────────────────────────────────────────────────
// 3. CONSOLIDATED MOBILE CONTENT FEED
// ────────────────────────────────────────────────────────────

export async function getMobileContentFeed(
  tenantId: string,
  memberId?: string
): Promise<any> {
  // A. Fetch media playlists
  const playlists = await prisma.mediaPlaylist.findMany({
    where: { tenantId },
    take: 5,
  });

  // B. Fetch active/live livestream
  const activeLivestream = await prisma.livestream.findFirst({
    where: {
      tenantId,
      status: { in: ['live', 'scheduled'] },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // C. Fetch upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      tenantId,
      status: 'published',
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: 'asc' },
    take: 5,
  });

  // D. LMS enrolled courses (if memberId provided)
  let enrolledCourses: any[] = [];
  if (memberId) {
    const enrollments = await prisma.lmsEnrollment.findMany({
      where: { memberId, tenantId },
      include: {
        course: true,
      },
      take: 5,
    });
    enrolledCourses = enrollments.map((e) => e.course);
  }

  return {
    playlists,
    activeLivestream,
    upcomingEvents,
    enrolledCourses,
  };
}

// ────────────────────────────────────────────────────────────
// 4. PUSH NOTIFICATIONS
// ────────────────────────────────────────────────────────────

export async function registerPushToken(
  tenantId: string,
  userId: string,
  token: string,
  deviceType: string
): Promise<any> {
  if (!token || !deviceType) {
    throw new Error('Token and deviceType are required');
  }

  if (deviceType !== 'ios' && deviceType !== 'android') {
    throw new Error('deviceType must be ios or android');
  }

  return await prisma.mobilePushToken.upsert({
    where: {
      userId_token: {
        userId,
        token,
      },
    },
    update: {
      deviceType,
    },
    create: {
      tenantId,
      userId,
      token,
      deviceType,
    },
  });
}

export async function sendPushNotification(
  tenantId: string,
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<any> {
  if (!title || !body) {
    throw new Error('Title and body are required');
  }

  const tokens = await prisma.mobilePushToken.findMany({
    where: { tenantId, userId },
  });

  // Log dispatch mock
  console.log(
    `[MobilePushNotification] Dispatched alert to user ${userId} (${tokens.length} devices). Title: "${title}", Body: "${body}", Payload:`,
    JSON.stringify(data || {})
  );

  return {
    success: true,
    dispatchedCount: tokens.length,
    mockStatus: 'sent',
    payload: { title, body, data },
  };
}

// ────────────────────────────────────────────────────────────
// 5. DEEP LINKS
// ────────────────────────────────────────────────────────────

export function generateDeepLink(
  subdomain: string,
  path: string,
  params?: any
): string {
  const queryPart = params ? '?' + new URLSearchParams(params).toString() : '';
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `churchos://${subdomain}${cleanPath}${queryPart}`;
}

export function resolveDeepLink(urlStr: string): any {
  if (!urlStr) {
    throw new Error('URL string is required');
  }

  try {
    let parsed: URL;
    let subdomain = '';
    let path = '';
    let params: any = {};

    if (urlStr.startsWith('churchos://')) {
      // e.g. churchos://grace/events/123?promo=true
      const tempUrl = urlStr.replace('churchos://', 'http://');
      parsed = new URL(tempUrl);
      subdomain = parsed.hostname;
      path = parsed.pathname;
    } else {
      // Universal link: e.g. https://grace.churchos.org/deeplink?path=/events/123&promo=true
      parsed = new URL(urlStr);
      subdomain = parsed.hostname.split('.')[0] || '';
      
      const queryPath = parsed.searchParams.get('path') || '';
      path = queryPath.startsWith('/') ? queryPath : '/' + queryPath;
    }

    parsed.searchParams.forEach((val, key) => {
      if (key !== 'path') {
        params[key] = val;
      }
    });

    // Extract route details
    // e.g. /events/123 -> route: 'events', id: '123'
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] || 'home';
    const id = segments[1] || null;

    return {
      subdomain,
      route,
      id,
      params,
      rawUrl: urlStr,
    };
  } catch (err: any) {
    throw new Error('Failed to parse deep link URL: ' + err.message);
  }
}
