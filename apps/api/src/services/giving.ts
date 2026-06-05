import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';

// ─────────────────────────────────────────────────────────────
// GIVING CATEGORY CRUD
// ─────────────────────────────────────────────────────────────

export async function createGivingCategory(
  tenantId: string,
  data: {
    name: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<any> {
  return await prisma.givingCategory.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function getGivingCategory(id: string, tenantId: string): Promise<any> {
  const category = await prisma.givingCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    throw new Error('Giving category not found');
  }
  return category;
}

export async function listGivingCategories(tenantId: string, onlyActive = false): Promise<any[]> {
  return await prisma.givingCategory.findMany({
    where: {
      tenantId,
      ...(onlyActive ? { isActive: true } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function updateGivingCategory(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }
): Promise<any> {
  await getGivingCategory(id, tenantId);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.givingCategory.update({
    where: { id },
    data: updateData,
  });
}

// ─────────────────────────────────────────────────────────────
// DONATION / ONE-TIME GIVING FLOW
// ─────────────────────────────────────────────────────────────

export async function initiateDonation(
  tenantId: string,
  data: {
    categoryId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    donorName?: string;
    donorEmail?: string;
    churchServiceId?: string;
    recurringGivingId?: string;
    campaignId?: string;
  }
): Promise<any> {
  // Validate category exists
  await getGivingCategory(data.categoryId, tenantId);

  // Validate linked service exists if supplied
  if (data.churchServiceId) {
    const service = await prisma.churchService.findFirst({
      where: { id: data.churchServiceId, tenantId },
    });
    if (!service) {
      throw new Error('Linked church service not found');
    }
  }

  // Validate linked campaign exists if supplied
  if (data.campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: data.campaignId, tenantId },
    });
    if (!campaign) {
      throw new Error('Linked campaign not found');
    }
  }

  // Resolve active payment provider for tenant (module-specific override checking supported)
  const driver = await resolveDriver(tenantId, 'payment', 'giving-donations');

  // Trigger Mock Payment Gateway
  const currency = data.currency || 'USD';
  const paymentResult = await driver.createPaymentIntent(data.amount, currency, {
    donorEmail: data.donorEmail,
    categoryId: data.categoryId,
  });

  if (!paymentResult.success) {
    throw new Error(paymentResult.error || 'Payment gateway failed to initialize transaction');
  }

  // Save donation in pending state
  const donation = await prisma.donation.create({
    data: {
      tenantId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency,
      status: 'pending',
      paymentMethod: data.paymentMethod || 'card',
      donorName: data.donorName || null,
      donorEmail: data.donorEmail || null,
      churchServiceId: data.churchServiceId || null,
      transactionId: paymentResult.transactionId || null,
      clientSecret: paymentResult.clientSecret || null,
      recurringGivingId: data.recurringGivingId || null,
      campaignId: data.campaignId || null,
    },
  });

  return {
    donation,
    clientSecret: paymentResult.clientSecret,
    transactionId: paymentResult.transactionId,
  };
}

export async function handleDonationSuccess(tenantId: string, transactionId: string): Promise<any> {
  const donation = await prisma.donation.findFirst({
    where: { transactionId, tenantId },
  });

  if (!donation) {
    throw new Error('Donation transaction not found');
  }

  // If already processed, prevent duplicate updates
  if (donation.status === 'succeeded') {
    return donation;
  }

  const updated = await prisma.donation.update({
    where: { id: donation.id },
    data: { status: 'succeeded' },
  });

  // If donation was linked to a specific service, increment the service's total
  if (donation.churchServiceId) {
    const service = await prisma.churchService.findFirst({
      where: { id: donation.churchServiceId, tenantId },
    });
    if (service) {
      const currentTotal = service.givingTotal || 0;
      await prisma.churchService.update({
        where: { id: service.id },
        data: { givingTotal: currentTotal + donation.amount },
      });
    }
  }

  // If donation was linked to a campaign, increment the campaign's currentAmount
  if (donation.campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: donation.campaignId, tenantId },
    });
    if (campaign) {
      const currentAmount = campaign.currentAmount || 0;
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { currentAmount: currentAmount + donation.amount },
      });
    }
  }

  return updated;
}

export async function handleDonationFailure(tenantId: string, transactionId: string): Promise<any> {
  const donation = await prisma.donation.findFirst({
    where: { transactionId, tenantId },
  });

  if (!donation) {
    throw new Error('Donation transaction not found');
  }

  return await prisma.donation.update({
    where: { id: donation.id },
    data: { status: 'failed' },
  });
}

// ─────────────────────────────────────────────────────────────
// RECURRING GIVING MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function createRecurringGiving(
  tenantId: string,
  data: {
    categoryId: string;
    amount: number;
    currency?: string;
    frequency: 'weekly' | 'monthly';
    donorName?: string;
    donorEmail: string;
  }
): Promise<any> {
  // Validate category
  await getGivingCategory(data.categoryId, tenantId);

  // Set initial next draw date (weekly: +7 days, monthly: +1 month)
  const nextDrawDate = new Date();
  if (data.frequency === 'weekly') {
    nextDrawDate.setDate(nextDrawDate.getDate() + 7);
  } else if (data.frequency === 'monthly') {
    nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);
  } else {
    throw new Error('Invalid recurring giving frequency');
  }

  return await prisma.recurringGiving.create({
    data: {
      tenantId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency: data.currency || 'USD',
      frequency: data.frequency,
      status: 'active',
      nextDrawDate,
      donorName: data.donorName || null,
      donorEmail: data.donorEmail,
    },
  });
}

export async function getRecurringGiving(id: string, tenantId: string): Promise<any> {
  const recurring = await prisma.recurringGiving.findFirst({
    where: { id, tenantId },
  });
  if (!recurring) {
    throw new Error('Recurring giving schedule not found');
  }
  return recurring;
}

export async function listRecurringGivings(tenantId: string): Promise<any[]> {
  return await prisma.recurringGiving.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function pauseRecurringGiving(id: string, tenantId: string): Promise<any> {
  await getRecurringGiving(id, tenantId);
  return await prisma.recurringGiving.update({
    where: { id },
    data: { status: 'paused' },
  });
}

export async function resumeRecurringGiving(id: string, tenantId: string): Promise<any> {
  await getRecurringGiving(id, tenantId);
  return await prisma.recurringGiving.update({
    where: { id },
    data: { status: 'active' },
  });
}

export async function cancelRecurringGiving(id: string, tenantId: string): Promise<any> {
  await getRecurringGiving(id, tenantId);
  return await prisma.recurringGiving.update({
    where: { id },
    data: { status: 'ended' },
  });
}

/**
 * Iterates through all active recurring schedules across all tenants,
 * performs mock payment processing, generates succeeded donation records,
 * and advances the schedule draw date.
 */
export async function processRecurringGivings(): Promise<{ processedCount: number }> {
  const now = new Date();

  // Find all active recurring schedules where nextDrawDate <= now
  const schedules = await prisma.recurringGiving.findMany({
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
      // 1. Resolve tenant's payment driver
      const driver = await resolveDriver(schedule.tenantId, 'payment', 'giving-donations');

      // 2. Draw mock payment intent
      const paymentResult = await driver.createPaymentIntent(schedule.amount, schedule.currency, {
        donorEmail: schedule.donorEmail,
        recurringGivingId: schedule.id,
      });

      if (paymentResult.success) {
        // 3. Create a succeeded donation record
        await prisma.donation.create({
          data: {
            tenantId: schedule.tenantId,
            categoryId: schedule.categoryId,
            amount: schedule.amount,
            currency: schedule.currency,
            status: 'succeeded',
            paymentMethod: 'card',
            donorName: schedule.donorName,
            donorEmail: schedule.donorEmail,
            recurringGivingId: schedule.id,
            transactionId: paymentResult.transactionId || null,
            clientSecret: paymentResult.clientSecret || null,
          },
        });

        // 4. Calculate next draw date
        const nextDraw = new Date(schedule.nextDrawDate);
        if (schedule.frequency === 'weekly') {
          nextDraw.setDate(nextDraw.getDate() + 7);
        } else if (schedule.frequency === 'monthly') {
          nextDraw.setMonth(nextDraw.getMonth() + 1);
        }

        // 5. Update recurring giving
        await prisma.recurringGiving.update({
          where: { id: schedule.id },
          data: {
            nextDrawDate: nextDraw,
          },
        });

        processedCount++;
      }
    } catch (err) {
      console.error(`Error processing recurring giving schedule ${schedule.id}:`, err);
    }
  }

  return { processedCount };
}
