import 'server-only';

/**
 * Payment provider abstraction.
 *
 * Depth Study is integration-ready but does NOT fake successful payments.
 * - When neither RAZORPAY nor STRIPE keys are configured, the Noop provider is
 *   used: the app stays fully usable (invoices are generated and persisted, and
 *   payments are recorded only via the status they actually have) but live
 *   charges/subscriptions cannot be created.
 * - Provider-specific implementation stays isolated behind PaymentProvider.
 *
 * Required environment variables to activate a real provider:
 *   Razorpay: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (+ WEBHOOK_SECRET)
 *   Stripe:   STRIPE_SECRET_KEY (+ STRIPE_WEBHOOK_SECRET)
 */

export type PaymentProviderName = 'none' | 'razorpay' | 'stripe';

export type CreateSubscriptionInput = {
  customerId: string;
  amountInCents: number;
  currency: string;
  interval: 'month' | 'year';
  metadata?: Record<string, unknown>;
};

export type CreateSubscriptionResult = {
  providerSubscriptionId: string;
};

export type ChargeInput = {
  customerId: string;
  amountInCents: number;
  currency: string;
  description?: string;
  idempotencyKey?: string;
};

export type ChargeResult = {
  providerPaymentId: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  /** Create a recurring subscription at the payment provider. */
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  /** Charge a one-off amount (e.g. settle an invoice). */
  charge(input: ChargeInput): Promise<ChargeResult>;
  /**
   * Parse a provider webhook payload. Returns the normalized provider event id,
   * event type, and typed resource id(s). Throws if signature is invalid.
   */
  parseWebhook(payload: unknown, rawBody: string, signature: string | null): {
    providerEventId: string;
    eventType: string;
    invoiceId?: string | null;
    paymentId?: string | null;
    subscriptionId?: string | null;
  };
}

export class NoopPaymentProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'none';

  async createSubscription(): Promise<CreateSubscriptionResult> {
    throw new Error(
      'No payment provider is configured. Set RAZORPAY_KEY_ID/STRIPE_SECRET_KEY to activate billing.',
    );
  }

  async charge(): Promise<ChargeResult> {
    throw new Error(
      'No payment provider is configured. Cannot process a live charge.',
    );
  }

  parseWebhook(): never {
    throw new Error('No payment provider is configured; webhooks are not processed.');
  }
}

class RazorpayProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'razorpay';
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    throw new Error('Razorpay createSubscription is not implemented in this build. Wire the Razorpay SDK behind this method.');
  }
  async charge(): Promise<ChargeResult> {
    throw new Error('Razorpay charge is not implemented in this build. Wire the Razorpay SDK behind this method.');
  }
  parseWebhook(): { providerEventId: string; eventType: string; invoiceId?: string | null; paymentId?: string | null; subscriptionId?: string | null } {
    throw new Error('Razorpay webhook parsing is not implemented in this build.');
  }
}

class StripeProvider implements PaymentProvider {
  readonly name: PaymentProviderName = 'stripe';
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    throw new Error('Stripe createSubscription is not implemented in this build. Wire the Stripe SDK behind this method.');
  }
  async charge(): Promise<ChargeResult> {
    throw new Error('Stripe charge is not implemented in this build. Wire the Stripe SDK behind this method.');
  }
  parseWebhook(): { providerEventId: string; eventType: string; invoiceId?: string | null; paymentId?: string | null; subscriptionId?: string | null } {
    throw new Error('Stripe webhook parsing is not implemented in this build.');
  }
}

/**
 * Resolve the configured provider. Reads server-only env vars. Returns Noop
 * when none are configured so the app remains usable for demo/internal billing.
 */
export function getPaymentProvider(): PaymentProvider {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new RazorpayProvider();
  }
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripeProvider();
  }
  return new NoopPaymentProvider();
}
