import { ProductCardContract } from '../components/product-card.contract';
import { ProductDetailContract } from '../components/product-detail.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapProductToProductCardContract(prod: any, tenantId: string): ProductCardContract {
  if (prod.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on product card mapping');
  }

  return {
    id: prod.id,
    title: prod.title || 'Store Product',
    price: prod.price || 0,
    compareAtPrice: prod.compareAtPrice || null,
    thumbnailUrl: prod.thumbnailUrl || prod.imageUrl || null,
    isDigital: !!prod.isDigital,
    cta: getStandardCTA('view', { url: `/store/${prod.id}` })
  };
}

export function mapProductToProductDetailContract(prod: any, tenantId: string): ProductDetailContract {
  if (prod.tenantId !== tenantId) {
    throw new Error('Tenant isolation violation on product detail mapping');
  }

  return {
    id: prod.id,
    title: prod.title || 'Store Product',
    price: prod.price || 0,
    descriptionHtml: prod.descriptionHtml || prod.description || null,
    images: prod.images || (prod.imageUrl ? [prod.imageUrl] : []),
    isDigital: !!prod.isDigital,
    purchaseForm: {
      formKey: `buy-product-${prod.id}`,
      displayName: 'Purchase Product',
      fields: [
        { name: 'quantity', label: 'Quantity', type: 'number', validation: { required: true, min: 1 } }
      ],
      submitUrl: `/api/store/cart/add/${prod.id}`,
      submitMethod: 'POST'
    },
    seo: {
      title: prod.title,
      description: prod.description || null
    }
  };
}
