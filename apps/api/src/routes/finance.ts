import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createFinancialAccount,
  getFinancialAccount,
  listFinancialAccounts,
  createFinancialBudget,
  listFinancialBudgets,
  getBudgetUtilization,
  recordLedgerTransaction,
  listLedgerTransactions,
  createExpenseRequest,
  approveExpenseRequest,
  rejectExpenseRequest,
  listExpenseRequests,
  getFinancialRevenueSummaries,
  reconcileAccount,
  listReconciliationRecords,
} from '../services/finance';

const router = Router();

// Secure all finance routes under auth middleware
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// ACCOUNTS & BUDGETS
// ─────────────────────────────────────────────────────────────

// GET /api/finance/accounts - List financial accounts
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await listFinancialAccounts(req.tenantId!);
    res.json({ data: accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/accounts - Create financial account (Admin Only)
router.post('/accounts', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const account = await createFinancialAccount(req.tenantId!, req.body);
    res.status(201).json({ data: account });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/budgets - List budgets
router.get('/budgets', async (req: Request, res: Response) => {
  try {
    const budgets = await listFinancialBudgets(req.tenantId!);
    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const util = await getBudgetUtilization(b.id, req.tenantId!);
        return {
          ...b,
          utilizationRatio: util.utilizationRatio,
        };
      })
    );
    res.json({ data: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/budgets - Create departmental budget (Admin Only)
router.post('/budgets', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, amountLimit, startDate, endDate, category, branchId } = req.body;
    if (!name || !amountLimit || !startDate || !endDate || !category) {
      res.status(400).json({ error: 'name, amountLimit, startDate, endDate, and category are required' });
      return;
    }

    const budget = await createFinancialBudget(req.tenantId!, {
      name,
      amountLimit: parseFloat(amountLimit),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      category,
      branchId,
    });
    res.status(201).json({ data: budget });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// EXPENSES APPROVAL WORKFLOW
// ─────────────────────────────────────────────────────────────

// GET /api/finance/expenses - List expense requests
router.get('/expenses', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const requests = await listExpenseRequests(req.tenantId!, status);
    res.json({ data: requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/expenses - Create expense request (Staff/Admin)
router.post('/expenses', async (req: Request, res: Response) => {
  try {
    const { accountId, budgetId, amount, category, description } = req.body;
    if (!accountId || !amount || !category || !description) {
      res.status(400).json({ error: 'accountId, amount, category, and description are required' });
      return;
    }

    const requestOutflow = await createExpenseRequest(req.tenantId!, {
      accountId,
      budgetId,
      requestedBy: req.user!.userId,
      amount: parseFloat(amount),
      category,
      description,
    });
    res.status(201).json({ data: requestOutflow });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/finance/expenses/:id/approve - Approve expense request (Admin Only)
router.post('/expenses/:id/approve', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updated = await approveExpenseRequest(req.params.id as string, req.tenantId!, req.user!.userId);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/finance/expenses/:id/reject - Reject expense request (Admin Only)
router.post('/expenses/:id/reject', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const updated = await rejectExpenseRequest(req.params.id as string, req.tenantId!, req.user!.userId);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// LEDGER TRANSACTIONS & RECONCILIATIONS
// ─────────────────────────────────────────────────────────────

// GET /api/finance/transactions - List ledger transactions
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const list = await listLedgerTransactions(req.tenantId!, accountId);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/transactions - Manually record ledger transaction (Admin Only)
router.post('/transactions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { accountId, type, amount, category, reference, description } = req.body;
    if (!accountId || !type || !amount || !category || !description) {
      res.status(400).json({ error: 'accountId, type, amount, category, and description are required' });
      return;
    }

    const transaction = await recordLedgerTransaction(req.tenantId!, {
      accountId,
      type,
      amount: parseFloat(amount),
      category,
      reference,
      description,
      recordedBy: req.user!.userId,
    });
    res.status(201).json({ data: transaction });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/reconciliation - List reconciliation history
router.get('/reconciliation', async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string | undefined;
    const records = await listReconciliationRecords(req.tenantId!, accountId);
    res.json({ data: records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/reconcile - Run reconciliation validation (Admin Only)
router.post('/reconcile', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { accountId, bankStatementBalance } = req.body;
    if (!accountId || bankStatementBalance === undefined) {
      res.status(400).json({ error: 'accountId and bankStatementBalance are required' });
      return;
    }

    const record = await reconcileAccount(req.tenantId!, {
      accountId,
      bankStatementBalance: parseFloat(bankStatementBalance),
      reconciledBy: req.user!.userId,
    });
    res.status(201).json({ data: record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DASHBOARD REPORTING & CSV EXPORT
// ─────────────────────────────────────────────────────────────

// GET /api/finance/reports/revenue - Aggregate dynamic giving, partnerships, and e-commerce total revenues
router.get('/reports/revenue', async (req: Request, res: Response) => {
  try {
    const summaries = await getFinancialRevenueSummaries(req.tenantId!);
    res.json({ data: summaries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/reports/export - Streams downloadable CSV report (Admin Only)
router.get('/reports/export', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const budgets = await listFinancialBudgets(req.tenantId!);
    const accounts = await listFinancialAccounts(req.tenantId!);

    let csvContent = '--- FINANCIAL BUDGETS UTILIZATION REPORT ---\n';
    csvContent += 'Budget Name,Limit,Spent,Utilization Ratio,Category\n';
    for (const b of budgets) {
      const util = await getBudgetUtilization(b.id, req.tenantId!);
      csvContent += `"${b.name}",${b.amountLimit},${b.spentAmount},${util.utilizationRatio},"${b.category}"\n`;
    }

    csvContent += '\n--- FINANCIAL ACCOUNTS STATEMENT BALANCES ---\n';
    csvContent += 'Account Name,Account Type,Ledger Balance,Currency\n';
    for (const a of accounts) {
      csvContent += `"${a.name}","${a.accountType}",${a.balance},"${a.currency}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.attachment('financial_report.csv');
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
