import prisma from '../lib/prisma';
import { resolveDriver } from './integrations/registry';
import { trackEvent } from './analytics';

// ─────────────────────────────────────────────────────────────
// PRODUCT CATEGORIES CRUD
// ─────────────────────────────────────────────────────────────

export async function createProductCategory(
  tenantId: string,
  data: {
    name: string;
    description?: string;
  }
): Promise<any> {
  return await prisma.productCategory.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description || null,
    },
  });
}

export async function listProductCategories(tenantId: string): Promise<any[]> {
  return await prisma.productCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS CRUD
// ─────────────────────────────────────────────────────────────

export async function createProduct(
  tenantId: string,
  data: {
    title: string;
    slug: string;
    description?: string;
    price: number;
    currency?: string;
    type: 'physical' | 'digital';
    digitalFileUrl?: string;
    inventory?: number;
    coverImageUrl?: string;
    categoryId?: string;
    campaignId?: string;
  }
): Promise<any> {
  // Validate unique slug within tenant
  const existing = await prisma.product.findFirst({
    where: { tenantId, slug: data.slug },
  });
  if (existing) {
    throw new Error('Product slug already exists');
  }

  // Validate category if provided
  if (data.categoryId) {
    const cat = await prisma.productCategory.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!cat) {
      throw new Error('Category not found');
    }
  }

  // Validate campaign if provided
  if (data.campaignId) {
    const camp = await prisma.campaign.findFirst({
      where: { id: data.campaignId, tenantId },
    });
    if (!camp) {
      throw new Error('Campaign not found');
    }
  }

  return await prisma.product.create({
    data: {
      tenantId,
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      currency: data.currency || 'USD',
      type: data.type,
      digitalFileUrl: data.digitalFileUrl || null,
      inventory: data.inventory || 0,
      coverImageUrl: data.coverImageUrl || null,
      categoryId: data.categoryId || null,
      campaignId: data.campaignId || null,
      isActive: true,
    },
  });
}

export async function getProduct(idOrSlug: string, tenantId: string): Promise<any> {
  const product = await prisma.product.findFirst({
    where: {
      tenantId,
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug },
      ],
    },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }
  return product;
}

export async function listProducts(
  tenantId: string,
  filters: {
    categoryId?: string;
    search?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ products: any[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    tenantId,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search } },
            { description: { contains: filters.search } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function updateProduct(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    description?: string;
    price?: number;
    inventory?: number;
    coverImageUrl?: string;
    isActive?: boolean;
    categoryId?: string | null;
    campaignId?: string | null;
  }
): Promise<any> {
  await getProduct(id, tenantId);

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.inventory !== undefined) updateData.inventory = data.inventory;
  if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.campaignId !== undefined) updateData.campaignId = data.campaignId;

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: { variants: true },
  });
}

// ─────────────────────────────────────────────────────────────
// PRODUCT VARIANTS
// ─────────────────────────────────────────────────────────────

export async function createProductVariant(
  tenantId: string,
  productId: string,
  data: {
    name: string;
    priceOverride?: number;
    inventory?: number;
  }
): Promise<any> {
  // Validate product belongs to tenant
  await getProduct(productId, tenantId);

  return await prisma.productVariant.create({
    data: {
      tenantId,
      productId,
      name: data.name,
      priceOverride: data.priceOverride !== undefined ? data.priceOverride : null,
      inventory: data.inventory || 0,
    },
  });
}

export async function deleteProductVariant(id: string, tenantId: string): Promise<any> {
  const variant = await prisma.productVariant.findFirst({
    where: { id, tenantId },
  });
  if (!variant) {
    throw new Error('Product variant not found');
  }

  return await prisma.productVariant.delete({
    where: { id },
  });
}

// ─────────────────────────────────────────────────────────────
// STORE COUPONS CRUD
// ─────────────────────────────────────────────────────────────

export async function createCoupon(
  tenantId: string,
  data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  }
): Promise<any> {
  const cleanCode = data.code.toUpperCase().trim();
  const existing = await prisma.storeCoupon.findFirst({
    where: { tenantId, code: cleanCode },
  });
  if (existing) {
    throw new Error('Coupon code already exists');
  }

  return await prisma.storeCoupon.create({
    data: {
      tenantId,
      code: cleanCode,
      discountType: data.discountType,
      discountValue: data.discountValue,
      isActive: true,
    },
  });
}

export async function validateCoupon(tenantId: string, code: string): Promise<any> {
  const cleanCode = code.toUpperCase().trim();
  const coupon = await prisma.storeCoupon.findFirst({
    where: { tenantId, code: cleanCode, isActive: true },
  });
  if (!coupon) {
    throw new Error('Invalid or expired coupon code');
  }
  return coupon;
}

// ─────────────────────────────────────────────────────────────
// CART VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────

export async function validateCart(
  tenantId: string,
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[],
  couponCode?: string,
  fulfillmentType: 'shipping' | 'pickup' = 'pickup',
  shippingAddress?: string
): Promise<{
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  validatedItems: any[];
}> {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  let subtotal = 0;
  let hasPhysical = false;
  const validatedItems: any[] = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId, isActive: true },
    });
    if (!product) {
      throw new Error(`Product ${item.productId} not found or inactive`);
    }

    let variant: any = null;
    let unitPrice = product.price;
    let availableInventory = product.inventory;

    if (item.variantId) {
      variant = await prisma.productVariant.findFirst({
        where: { id: item.variantId, productId: product.id, tenantId },
      });
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found on product ${product.title}`);
      }
      if (variant.priceOverride !== null) {
        unitPrice = variant.priceOverride;
      }
      availableInventory = variant.inventory;
    }

    // Verify stock availability
    if (availableInventory < item.quantity) {
      throw new Error(`Insufficient inventory for item: ${product.title}${variant ? ` (${variant.name})` : ''}`);
    }

    if (product.type === 'physical') {
      hasPhysical = true;
    }

    subtotal += unitPrice * item.quantity;
    validatedItems.push({
      product,
      variant,
      quantity: item.quantity,
      unitPrice,
    });
  }

  // Calculate discounts
  let discount = 0;
  if (couponCode) {
    try {
      const coupon = await validateCoupon(tenantId, couponCode);
      if (coupon.discountType === 'percentage') {
        discount = subtotal * (coupon.discountValue / 100);
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, subtotal); // Discount cannot exceed subtotal
    } catch (err) {
      // If code supplied but invalid/expired, throw error
      throw err;
    }
  }

  // Calculate shipping (flat rate 10.00 for physical items requiring shipping, otherwise 0.00)
  let shipping = 0;
  if (hasPhysical && fulfillmentType === 'shipping') {
    shipping = 10.0;
  }

  const total = Math.max(0, subtotal - discount + shipping);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    validatedItems,
  };
}

// ─────────────────────────────────────────────────────────────
// SECURE STRIPE CHECKOUT
// ─────────────────────────────────────────────────────────────

export async function initiateCheckout(
  tenantId: string,
  data: {
    items: { productId: string; variantId?: string; quantity: number }[];
    couponCode?: string;
    fulfillmentType?: 'shipping' | 'pickup';
    shippingAddress?: string;
    customerName: string;
    customerEmail: string;
    customerId?: string;
  }
): Promise<any> {
  const fulfillmentType = data.fulfillmentType || 'pickup';

  // 1. Run precise cart calculations
  const cart = await validateCart(
    tenantId,
    data.items,
    data.couponCode,
    fulfillmentType,
    data.shippingAddress
  );

  // 2. Validate linked campaigns: if any product is linked to a campaign, record the campaign linkage
  // For simplicity, we link the entire order to the first campaignId found in products.
  let linkedCampaignId: string | null = null;
  for (const vItem of cart.validatedItems) {
    if (vItem.product.campaignId) {
      linkedCampaignId = vItem.product.campaignId;
      break;
    }
  }

  // 3. Resolve active payment driver
  const driver = await resolveDriver(tenantId, 'payment', 'giving-donations');

  // 4. Trigger Stripe mock payment intent
  const paymentResult = await driver.createPaymentIntent(cart.total, 'USD', {
    email: data.customerEmail,
    type: 'commerce',
  });

  if (!paymentResult.success) {
    throw new Error(paymentResult.error || 'Payment gateway failed to initialize checkout');
  }

  // Resolve active coupon id if applied
  let couponId: string | null = null;
  if (data.couponCode) {
    const couponRecord = await validateCoupon(tenantId, data.couponCode);
    couponId = couponRecord.id;
  }

  // 5. Create pending StoreOrder inside a database transaction (recommended)
  const order = await prisma.storeOrder.create({
    data: {
      tenantId,
      customerId: data.customerId || null,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      amount: cart.total,
      currency: 'USD',
      status: 'pending',
      fulfillmentType,
      shippingAddress: data.shippingAddress || null,
      shippingCost: cart.shipping,
      couponId,
      discountAmount: cart.discount,
      transactionId: paymentResult.transactionId || null,
      clientSecret: paymentResult.clientSecret || null,
      campaignId: linkedCampaignId,
      orderItems: {
        create: cart.validatedItems.map((vi) => ({
          tenantId,
          productId: vi.product.id,
          variantId: vi.variant ? vi.variant.id : null,
          quantity: vi.quantity,
          price: vi.unitPrice,
        })),
      },
    },
    include: {
      orderItems: true,
    },
  });

  return {
    order,
    clientSecret: paymentResult.clientSecret,
    transactionId: paymentResult.transactionId,
  };
}

export async function handleOrderSuccess(tenantId: string, transactionId: string): Promise<any> {
  const order = await prisma.storeOrder.findFirst({
    where: { transactionId, tenantId },
    include: { orderItems: true },
  });

  if (!order) {
    throw new Error('Order transaction not found');
  }

  // Prevent duplicate callbacks
  if (order.status === 'processing' || order.status === 'completed' || order.status === 'shipped') {
    return order;
  }

  // 1. Process database transaction to toggle order status and decrement inventories
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // A. Decrement inventory for each ordered item
    for (const item of order.orderItems) {
      if (item.variantId) {
        // Decrement variant stock
        const variant = await tx.productVariant.findFirst({ where: { id: item.variantId } });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { inventory: Math.max(0, variant.inventory - item.quantity) },
          });
        }
      } else {
        // Decrement general product stock
        const product = await tx.product.findFirst({ where: { id: item.productId } });
        if (product) {
          await tx.product.update({
            where: { id: product.id },
            data: { inventory: Math.max(0, product.inventory - item.quantity) },
          });
        }
      }
    }

    // B. Set order to processing
    return await tx.storeOrder.update({
      where: { id: order.id },
      data: { status: 'processing' },
      include: { orderItems: true },
    });
  });

  // 2. If the order was linked to a campaign, increment the campaign totals automatically
  if (updatedOrder.campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: updatedOrder.campaignId, tenantId },
    });
    if (campaign) {
      const current = campaign.currentAmount || 0;
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { currentAmount: current + updatedOrder.amount },
      });
    }
  }

  // 3. Dispatch analytics telemetry event
  await trackEvent(tenantId, {
    category: 'giving',
    name: 'donate',
    entityId: updatedOrder.id,
    value: updatedOrder.amount,
    metadata: {
      type: 'commerce',
      orderId: updatedOrder.id,
      campaignId: updatedOrder.campaignId,
    },
  });

  return updatedOrder;
}

export async function handleOrderFailure(tenantId: string, transactionId: string): Promise<any> {
  const order = await prisma.storeOrder.findFirst({
    where: { transactionId, tenantId },
  });
  if (!order) {
    throw new Error('Order transaction not found');
  }

  return await prisma.storeOrder.update({
    where: { id: order.id },
    data: { status: 'failed' },
  });
}

// ─────────────────────────────────────────────────────────────
// ORDER FULFILLMENT & HISTORY
// ─────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  tenantId: string,
  status: 'processing' | 'shipped' | 'completed' | 'failed'
): Promise<any> {
  const order = await prisma.storeOrder.findFirst({
    where: { id, tenantId },
  });
  if (!order) {
    throw new Error('Order not found');
  }

  return await prisma.storeOrder.update({
    where: { id },
    data: { status },
    include: { orderItems: true },
  });
}

export async function listOrders(tenantId: string, status?: string): Promise<any[]> {
  return await prisma.storeOrder.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    include: {
      orderItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCustomerOrderHistory(tenantId: string, email: string): Promise<any[]> {
  return await prisma.storeOrder.findMany({
    where: {
      tenantId,
      customerEmail: email,
    },
    include: {
      orderItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
