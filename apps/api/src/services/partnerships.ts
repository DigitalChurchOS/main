import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { trackEvent } from './analytics';

// ─────────────────────────────────────────────────────────────
// PARTNERSHIP CATEGORY CRUD
// ─────────────────────────────────────────────────────────────

export async function createPartnershipCategory(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<any> {
  return await prisma.partnershipCategory.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function getPartnershipCategory(id: string, tenantId: string): Promise<any> {
  const category = await prisma.partnershipCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    throw new Error('Partnership category not found');
  }
  return category;
}

export async function listPartnershipCategories(tenantId: string, onlyActive = false): Promise<any[]> {
  return await prisma.partnershipCategory.findMany({
    where: {
      tenantId,
      ...(onlyActive ? { isActive: true } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function updatePartnershipCategory(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<any> {
  await getPartnershipCategory(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.partnershipCategory.update({
    where: { id },
    data: updateData,
  });
}

// ─────────────────────────────────────────────────────────────
// PARTNERSHIPS / ONE-TIME FLOW
// ─────────────────────────────────────────────────────────────

export async function initiatePartnership(
  tenantId: string,
  data: {
    categoryId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    partnerName?: string;
    partnerEmail?: string;
    campaignId?: string;
    recurringPartnershipId?: string;
  }
): Promise<any> {
  // Validate category
  await getPartnershipCategory(data.categoryId, tenantId);

  // Resolve active payment gateway
  const driver = await resolveDriver(tenantId, 'payment', 'giving-donations');

  // Trigger payment gateway intent
  const currency = data.currency || 'USD';
  const paymentResult = await driver.createPaymentIntent(data.amount, currency, {
    partnerEmail: data.partnerEmail,
    categoryId: data.categoryId,
  });

  if (!paymentResult.success) {
    throw new Error(paymentResult.error || 'Payment gateway failed to initialize transaction');
  }

  // Save partnership in pending state
  const partnership = await prisma.partnership.create({
    data: {
      tenantId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency,
      status: 'pending',
      paymentMethod: data.paymentMethod || 'card',
      partnerName: data.partnerName || null,
      partnerEmail: data.partnerEmail || null,
      transactionId: paymentResult.transactionId || null,
      clientSecret: paymentResult.clientSecret || null,
      recurringPartnershipId: data.recurringPartnershipId || null,
      campaignId: data.campaignId || null,
    },
  });

  return {
    partnership,
    clientSecret: paymentResult.clientSecret,
    transactionId: paymentResult.transactionId,
  };
}

export async function handlePartnershipSuccess(tenantId: string, transactionId: string): Promise<any> {
  const partnership = await prisma.partnership.findFirst({
    where: { transactionId, tenantId },
  });

  if (!partnership) {
    throw new Error('Partnership transaction not found');
  }

  if (partnership.status === 'succeeded') {
    return partnership;
  }

  const updated = await prisma.partnership.update({
    where: { id: partnership.id },
    data: { status: 'succeeded' },
  });

  // If partnership was linked to a campaign, increment the campaign's currentAmount
  if (partnership.campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: partnership.campaignId, tenantId },
    });
    if (campaign) {
      const currentAmount = campaign.currentAmount || 0;
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { currentAmount: currentAmount + partnership.amount },
      });
    }
  }

  // Track event in the Analytics engine for consolidated total giving summaries
  await trackEvent(tenantId, {
    category: 'giving',
    name: 'donate',
    entityId: partnership.id,
    value: partnership.amount,
    metadata: {
      type: 'partnership',
      categoryId: partnership.categoryId,
    },
  });

  return updated;
}

export async function handlePartnershipFailure(tenantId: string, transactionId: string): Promise<any> {
  const partnership = await prisma.partnership.findFirst({
    where: { transactionId, tenantId },
  });

  if (!partnership) {
    throw new Error('Partnership transaction not found');
  }

  return await prisma.partnership.update({
    where: { id: partnership.id },
    data: { status: 'failed' },
  });
}

// ─────────────────────────────────────────────────────────────
// RECURRING PARTNERSHIPS
// ─────────────────────────────────────────────────────────────

export async function createRecurringPartnership(
  tenantId: string,
  data: {
    categoryId: string;
    amount: number;
    currency?: string;
    frequency: 'weekly' | 'monthly';
    partnerName?: string;
    partnerEmail: string;
  }
): Promise<any> {
  // Validate category
  await getPartnershipCategory(data.categoryId, tenantId);

  // Set initial draw date
  const nextDrawDate = new Date();
  if (data.frequency === 'weekly') {
    nextDrawDate.setDate(nextDrawDate.getDate() + 7);
  } else if (data.frequency === 'monthly') {
    nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);
  } else {
    throw new Error('Invalid recurring partnership frequency');
  }

  return await prisma.recurringPartnership.create({
    data: {
      tenantId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency: data.currency || 'USD',
      frequency: data.frequency,
      status: 'active',
      nextDrawDate,
      partnerName: data.partnerName || null,
      partnerEmail: data.partnerEmail,
    },
  });
}

export async function getRecurringPartnership(id: string, tenantId: string): Promise<any> {
  const recurring = await prisma.recurringPartnership.findFirst({
    where: { id, tenantId },
  });
  if (!recurring) {
    throw new Error('Recurring partnership schedule not found');
  }
  return recurring;
}

export async function listRecurringPartnerships(tenantId: string): Promise<any[]> {
  return await prisma.recurringPartnership.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function pauseRecurringPartnership(id: string, tenantId: string): Promise<any> {
  await getRecurringPartnership(id, tenantId);
  return await prisma.recurringPartnership.update({
    where: { id },
    data: { status: 'paused' },
  });
}

export async function resumeRecurringPartnership(id: string, tenantId: string): Promise<any> {
  await getRecurringPartnership(id, tenantId);
  return await prisma.recurringPartnership.update({
    where: { id },
    data: { status: 'active' },
  });
}

export async function cancelRecurringPartnership(id: string, tenantId: string): Promise<any> {
  await getRecurringPartnership(id, tenantId);
  return await prisma.recurringPartnership.update({
    where: { id },
    data: { status: 'ended' },
  });
}

/**
 * Draws active recurring partnership dues, logs succeeded checkout instances,
 * fires telemetry logs, and advances scheduling dates.
 */
export async function processRecurringPartnerships(): Promise<{ processedCount: number }> {
  const now = new Date();

  // Find active overdue schedules
  const schedules = await prisma.recurringPartnership.findMany({
    where: {
      status: 'active',
      nextDrawDate: {
        lte: now,
      },
    },
  });

  let processedCount = 0;

  for (const schedule of schedules) {
    try {
      // 1. Resolve payment driver
      const driver = await resolveDriver(schedule.tenantId, 'payment', 'giving-donations');

      // 2. Trigger mock charge
      const paymentResult = await driver.createPaymentIntent(schedule.amount, schedule.currency, {
        partnerEmail: schedule.partnerEmail,
        recurringPartnershipId: schedule.id,
      });

      if (paymentResult.success) {
        // 3. Register succeeded partnership history
        const partnerRecord = await prisma.partnership.create({
          data: {
            tenantId: schedule.tenantId,
            categoryId: schedule.categoryId,
            amount: schedule.amount,
            currency: schedule.currency,
            status: 'succeeded',
            paymentMethod: 'card',
            partnerName: schedule.partnerName,
            partnerEmail: schedule.partnerEmail,
            recurringPartnershipId: schedule.id,
            transactionId: paymentResult.transactionId || null,
            clientSecret: paymentResult.clientSecret || null,
          },
        });

        // 4. Dispatch telemetry analytics audit
        await trackEvent(schedule.tenantId, {
          category: 'giving',
          name: 'donate',
          entityId: partnerRecord.id,
          value: schedule.amount,
          metadata: {
            type: 'partnership',
            categoryId: schedule.categoryId,
          },
        });

        // 5. Advance scheduling dates
        const nextDraw = new Date(schedule.nextDrawDate);
        if (schedule.frequency === 'weekly') {
          nextDraw.setDate(nextDraw.getDate() + 7);
        } else if (schedule.frequency === 'monthly') {
          nextDraw.setMonth(nextDraw.getMonth() + 1);
        }

        // 6. Update database record
        await prisma.recurringPartnership.update({
          where: { id: schedule.id },
          data: {
            nextDrawDate: nextDraw,
          },
        });

        processedCount++;
      }
    } catch (err) {
      console.error(`Error processing recurring partnership ${schedule.id}:`, err);
    }
  }

  return { processedCount };
}
