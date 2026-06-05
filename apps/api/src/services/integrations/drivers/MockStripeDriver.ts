import { PaymentProvider, PaymentResult } from '../interfaces';

export class MockStripeDriver implements PaymentProvider {
  private secretKey: string;

  constructor(config: { secretKey: string; webhookSecret?: string }) {
    this.secretKey = config.secretKey;

    if (!config.secretKey) {
      throw new Error('Invalid Stripe configuration parameters');
    }
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<PaymentResult> {
    console.log(`[MockStripe] Creating payment intent of ${amount} ${currency.toUpperCase()}`);
    return {
      success: true,
      transactionId: `ch_${Math.random().toString(36).substring(2, 11)}`,
      clientSecret: `pi_${Math.random().toString(36).substring(2, 11)}_secret_${Math.random().toString(36).substring(2, 6)}`,
    };
  }
}
