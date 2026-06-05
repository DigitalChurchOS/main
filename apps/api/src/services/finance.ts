import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

// ─────────────────────────────────────────────────────────────
// FINANCIAL ACCOUNTS CRUD
// ─────────────────────────────────────────────────────────────

export async function createFinancialAccount(
  tenantId: string,
  data: {
    name: string;
    accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    balance?: number;
    currency?: string;
    branchId?: string;
  }
): Promise<any> {
  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, tenantId },
    });
    if (!branch) {
      throw new Error('Branch not found');
    }
  }

  return await prisma.financialAccount.create({
    data: {
      tenantId,
      branchId: data.branchId || null,
      name: data.name,
      accountType: data.accountType,
      balance: data.balance || 0.0,
      currency: data.currency || 'USD',
    },
  });
}

export async function getFinancialAccount(id: string, tenantId: string): Promise<any> {
  const account = await prisma.financialAccount.findFirst({
    where: { id, tenantId },
    include: { branch: true },
  });
  if (!account) {
    throw new Error('Financial account not found');
  }
  return account;
}

export async function listFinancialAccounts(tenantId: string): Promise<any[]> {
  return await prisma.financialAccount.findMany({
    where: { tenantId },
    include: { branch: true },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// DEPARTMENTAL BUDGETS CRUD
// ─────────────────────────────────────────────────────────────

export async function createFinancialBudget(
  tenantId: string,
  data: {
    name: string;
    amountLimit: number;
    startDate: Date;
    endDate: Date;
    category: string;
    branchId?: string;
  }
): Promise<any> {
  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, tenantId },
    });
    if (!branch) {
      throw new Error('Branch not found');
    }
  }

  return await prisma.financialBudget.create({
    data: {
      tenantId,
      branchId: data.branchId || null,
      name: data.name,
      amountLimit: data.amountLimit,
      spentAmount: 0.0,
      startDate: data.startDate,
      endDate: data.endDate,
      category: data.category.toLowerCase().trim(),
    },
  });
}

export async function getBudgetUtilization(id: string, tenantId: string): Promise<any> {
  const budget = await prisma.financialBudget.findFirst({
    where: { id, tenantId },
  });
  if (!budget) {
    throw new Error('Budget not found');
  }

  const utilizationRatio = budget.amountLimit > 0 ? budget.spentAmount / budget.amountLimit : 0;
  return {
    budget,
    utilizationRatio: Math.round(utilizationRatio * 100) / 100,
  };
}

export async function listFinancialBudgets(tenantId: string): Promise<any[]> {
  return await prisma.financialBudget.findMany({
    where: { tenantId },
    include: { branch: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// LEDGER ENTRIES
// ─────────────────────────────────────────────────────────────

export async function recordLedgerTransaction(
  tenantId: string,
  data: {
    accountId: string;
    type: 'debit' | 'credit';
    amount: number;
    category: string;
    reference?: string;
    description: string;
    recordedBy: string;
  }
): Promise<any> {
  // Validate account
  const account = await getFinancialAccount(data.accountId, tenantId);

  return await prisma.$transaction(async (tx) => {
    // 1. Calculate new balance based on asset transaction rules
    // credit increases asset balance, debit decreases asset balance
    const diff = data.type === 'credit' ? data.amount : -data.amount;
    const newBalance = account.balance + diff;

    await tx.financialAccount.update({
      where: { id: account.id },
      data: { balance: newBalance },
    });

    // 2. Create Transaction Ledger entry
    return await tx.financialTransaction.create({
      data: {
        tenantId,
        accountId: account.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        reference: data.reference || null,
        description: data.description,
        recordedBy: data.recordedBy,
      },
    });
  });
}

export async function listLedgerTransactions(tenantId: string, accountId?: string): Promise<any[]> {
  return await prisma.financialTransaction.findMany({
    where: {
      tenantId,
      ...(accountId ? { accountId } : {}),
    },
    include: { account: true },
    orderBy: { recordedAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// EXPENSE OUTFLOWS APPROVAL WORKFLOW
// ─────────────────────────────────────────────────────────────

export async function createExpenseRequest(
  tenantId: string,
  data: {
    accountId: string;
    budgetId?: string;
    requestedBy: string;
    amount: number;
    category: string;
    description: string;
  }
): Promise<any> {
  await getFinancialAccount(data.accountId, tenantId);

  if (data.budgetId) {
    const budget = await prisma.financialBudget.findFirst({
      where: { id: data.budgetId, tenantId },
    });
    if (!budget) {
      throw new Error('Linked budget not found');
    }
  }

  return await prisma.expenseRequest.create({
    data: {
      tenantId,
      accountId: data.accountId,
      budgetId: data.budgetId || null,
      requestedBy: data.requestedBy,
      amount: data.amount,
      category: data.category,
      description: data.description,
      status: 'pending',
    },
  });
}

export async function approveExpenseRequest(id: string, tenantId: string, approvedBy: string): Promise<any> {
  const request = await prisma.expenseRequest.findFirst({
    where: { id, tenantId },
  });
  if (!request) {
    throw new Error('Expense request not found');
  }

  if (request.status !== 'pending') {
    return request;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. If budget is linked, verify limits and increment spent
    if (request.budgetId) {
      const budget = await tx.financialBudget.findUnique({
        where: { id: request.budgetId },
      });
      if (!budget) {
        throw new Error('Linked budget not found');
      }

      if (budget.spentAmount + request.amount > budget.amountLimit) {
        throw new Error('Budget limit exceeded');
      }

      await tx.financialBudget.update({
        where: { id: budget.id },
        data: { spentAmount: budget.spentAmount + request.amount },
      });
    }

    // 2. Fetch and debit account balance
    const account = await tx.financialAccount.findUnique({
      where: { id: request.accountId },
    });
    if (!account) {
      throw new Error('Financial account not found');
    }

    await tx.financialAccount.update({
      where: { id: account.id },
      data: { balance: account.balance - request.amount },
    });

    // 3. Log debit Transaction entry
    await tx.financialTransaction.create({
      data: {
        tenantId,
        accountId: account.id,
        type: 'debit',
        amount: request.amount,
        category: request.category,
        reference: request.id,
        description: `Expense approved: ${request.description}`,
        recordedBy: approvedBy,
      },
    });

    // 4. Set request status to approved
    return await tx.expenseRequest.update({
      where: { id: request.id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  });
}

export async function rejectExpenseRequest(id: string, tenantId: string, rejectedBy: string): Promise<any> {
  const request = await prisma.expenseRequest.findFirst({
    where: { id, tenantId },
  });
  if (!request) {
    throw new Error('Expense request not found');
  }

  if (request.status !== 'pending') {
    return request;
  }

  return await prisma.expenseRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
    },
  });
}

export async function listExpenseRequests(tenantId: string, status?: string): Promise<any[]> {
  return await prisma.expenseRequest.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    include: { account: true, budget: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// REVENUE & DASHBOARD REPORTING AGGREGATES
// ─────────────────────────────────────────────────────────────

export async function getFinancialRevenueSummaries(
  tenantId: string
): Promise<{
  givingTotal: number;
  partnershipTotal: number;
  storeTotal: number;
  overallTotal: number;
}> {
  // A. Sum tithes & offerings succeeded donations
  const donations = await prisma.donation.findMany({
    where: { tenantId, status: 'succeeded' },
    select: { amount: true },
  });
  const givingTotal = donations.reduce((sum, item) => sum + item.amount, 0);

  // B. Sum succeeded partnerships contributions
  const partnerships = await prisma.partnership.findMany({
    where: { tenantId, status: 'succeeded' },
    select: { amount: true },
  });
  const partnershipTotal = partnerships.reduce((sum, item) => sum + item.amount, 0);

  // C. Sum succeeded store orders sales (completed, shipped, processing)
  const storeOrders = await prisma.storeOrder.findMany({
    where: {
      tenantId,
      status: { in: ['processing', 'shipped', 'completed'] },
    },
    select: { amount: true },
  });
  const storeTotal = storeOrders.reduce((sum, item) => sum + item.amount, 0);

  const overallTotal = givingTotal + partnershipTotal + storeTotal;

  return {
    givingTotal: Math.round(givingTotal * 100) / 100,
    partnershipTotal: Math.round(partnershipTotal * 100) / 100,
    storeTotal: Math.round(storeTotal * 100) / 100,
    overallTotal: Math.round(overallTotal * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// BANK RECONCILIATIONS
// ─────────────────────────────────────────────────────────────

export async function reconcileAccount(
  tenantId: string,
  data: {
    accountId: string;
    bankStatementBalance: number;
    reconciledBy: string;
  }
): Promise<any> {
  const account = await getFinancialAccount(data.accountId, tenantId);

  const isMatched = account.balance === data.bankStatementBalance;
  const status = isMatched ? 'matched' : 'discrepancy';

  return await prisma.reconciliationRecord.create({
    data: {
      tenantId,
      accountId: account.id,
      bankStatementBalance: data.bankStatementBalance,
      ledgerBalance: account.balance,
      status,
      reconciledBy: data.reconciledBy,
    },
  });
}

export async function listReconciliationRecords(tenantId: string, accountId?: string): Promise<any[]> {
  return await prisma.reconciliationRecord.findMany({
    where: {
      tenantId,
      ...(accountId ? { accountId } : {}),
    },
    include: { account: true },
    orderBy: { reconciledAt: 'desc' },
  });
}
