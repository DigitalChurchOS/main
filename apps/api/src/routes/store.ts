import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createProductCategory,
  listProductCategories,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  createProductVariant,
  deleteProductVariant,
  createCoupon,
  validateCart,
  initiateCheckout,
  handleOrderSuccess,
  handleOrderFailure,
  updateOrderStatus,
  listOrders,
  getCustomerOrderHistory,
} from '../services/store';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC STOREFRONT
// ─────────────────────────────────────────────────────────────

// GET /api/store/categories - List product categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await listProductCategories(req.tenantId!);
    res.json({ data: categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/store/products - List products (filtered)
router.get('/products', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      search: req.query.search as string | undefined,
      type: req.query.type as string | undefined,
      isActive: req.query.isActive !== 'false', // default true
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };

    const result = await listProducts(req.tenantId!, filters);
    res.json({
      data: result.products,
      meta: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/store/products/:idOrSlug - Get single product details
router.get('/products/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const product = await getProduct(req.params.idOrSlug as string, req.tenantId!);
    res.json({ data: product });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/store/cart/validate - Validate pricing and discounts on cart items
router.post('/cart/validate', async (req: Request, res: Response) => {
  try {
    const { items, couponCode, fulfillmentType, shippingAddress } = req.body;
    const result = await validateCart(
      req.tenantId!,
      items,
      couponCode,
      fulfillmentType,
      shippingAddress
    );
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/store/checkout - Initiate checkout order and fetch Stripe credentials
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { items, couponCode, fulfillmentType, shippingAddress, customerName, customerEmail } = req.body;
    if (!customerEmail || !customerName) {
      res.status(400).json({ error: 'customerName and customerEmail are required' });
      return;
    }

    const result = await initiateCheckout(req.tenantId!, {
      items,
      couponCode,
      fulfillmentType,
      shippingAddress,
      customerName,
      customerEmail,
    });
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN CATALOG & SETTINGS (RBAC Required)
// ─────────────────────────────────────────────────────────────

// POST /api/store/categories - Create category
router.post('/categories', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const category = await createProductCategory(req.tenantId!, req.body);
    res.status(201).json({ data: category });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/store/products - Create product
router.post('/products', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const product = await createProduct(req.tenantId!, req.body);
    res.status(201).json({ data: product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/store/products/:id - Update product details
router.patch('/products/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const product = await updateProduct(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: product });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/store/products/:id/variants - Add a variant to product
router.post('/products/:id/variants', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const variant = await createProductVariant(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: variant });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/store/variants/:id - Delete a product variant
router.delete('/variants/:id', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const deleted = await deleteProductVariant(req.params.id as string, req.tenantId!);
    res.json({ data: deleted });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/store/coupons - Create a discount coupon
router.post('/coupons', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const coupon = await createCoupon(req.tenantId!, req.body);
    res.status(201).json({ data: coupon });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/store/orders - List all store orders (Admin Only)
router.get('/orders', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await listOrders(req.tenantId!, status);
    res.json({ data: orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/store/orders/:id/status - Update order fulfillment/payment status (Admin Only)
router.patch('/orders/:id/status', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    const order = await updateOrderStatus(req.params.id as string, req.tenantId!, status);
    res.json({ data: order });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/store/history - List history for currently authenticated member (or via email query)
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    // If admin is searching specific email, allow query. Otherwise, default to logged in user email.
    const email = req.query.email as string || req.user?.email;
    if (!email) {
      res.status(400).json({ error: 'Email parameter or active login session is required' });
      return;
    }
    const history = await getCustomerOrderHistory(req.tenantId!, email);
    res.json({ data: history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// WEBHOOK GATEWAY SIMULATIONS (Admin webhook triggers)
// ─────────────────────────────────────────────────────────────

router.post('/webhook', authMiddleware, requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { transactionId, status } = req.body;
    if (!transactionId || !status) {
      res.status(400).json({ error: 'transactionId and status are required' });
      return;
    }

    let updated;
    if (status === 'succeeded') {
      updated = await handleOrderSuccess(req.tenantId!, transactionId);
    } else if (status === 'failed') {
      updated = await handleOrderFailure(req.tenantId!, transactionId);
    } else {
      res.status(400).json({ error: 'Invalid store order status webhook trigger' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
