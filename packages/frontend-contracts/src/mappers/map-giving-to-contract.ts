import { GivingFormContract } from '../components/giving-form.contract';
import { GivingCategoryCardContract } from '../components/giving-category-card.contract';
import { getStandardCTA } from '../registry/cta-registry';

export function mapGivingCategoryToGivingFormContract(categories: any[], tenantId: string): GivingFormContract {
  const normalizedCategories: GivingCategoryCardContract[] = categories.map(cat => {
    if (cat.tenantId !== tenantId) {
      throw new Error('Tenant isolation violation on giving category');
    }
    return {
      id: cat.id,
      name: cat.name || 'General Fund',
      description: cat.description || null,
      imageUrl: cat.imageUrl || null,
      cta: getStandardCTA('give', { url: `/give/${cat.id}` })
    };
  });

  return {
    categories: normalizedCategories,
    form: {
      formKey: 'online-giving-form',
      displayName: 'Online Giving Form',
      fields: [
        { name: 'amount', label: 'Donation Amount', type: 'number', validation: { required: true, min: 1 } },
        { name: 'categoryId', label: 'Giving Fund / Category', type: 'select', validation: { required: true } }
      ],
      submitUrl: '/api/giving/donate',
      submitMethod: 'POST'
    },
    suggestedAmounts: [10, 20, 50, 100, 250, 500],
    submitCta: getStandardCTA('donate', { url: '/give/submit' })
  };
}
