import { describe, it, expect } from 'vitest';

// Mirror event type handling logic from stripe-webhook/index.ts
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

function isHandledEvent(eventType: string): boolean {
  return HANDLED_EVENTS.includes(eventType);
}

function extractCheckoutMetadata(session: any): { userId?: string; type?: string; plan?: string } {
  return {
    userId: session?.metadata?.user_id,
    type: session?.metadata?.type,
    plan: session?.metadata?.plan,
  };
}

function isIdempotent(eventId: string, processedEvents: Set<string>): boolean {
  if (processedEvents.has(eventId)) return false; // already processed
  processedEvents.add(eventId);
  return true; // new event, process it
}

describe('Stripe Webhook – Event Handling', () => {
  it('recognizes checkout.session.completed', () => {
    expect(isHandledEvent('checkout.session.completed')).toBe(true);
  });

  it('recognizes invoice.paid', () => {
    expect(isHandledEvent('invoice.paid')).toBe(true);
  });

  it('recognizes subscription events', () => {
    expect(isHandledEvent('customer.subscription.updated')).toBe(true);
    expect(isHandledEvent('customer.subscription.deleted')).toBe(true);
  });

  it('ignores unknown event types', () => {
    expect(isHandledEvent('payment_intent.succeeded')).toBe(false);
    expect(isHandledEvent('charge.refunded')).toBe(false);
  });
});

describe('Stripe Webhook – Metadata Extraction', () => {
  it('extracts user_id and type from session', () => {
    const result = extractCheckoutMetadata({
      metadata: { user_id: 'usr-123', type: 'topup' },
    });
    expect(result.userId).toBe('usr-123');
    expect(result.type).toBe('topup');
  });

  it('extracts plan from subscription session', () => {
    const result = extractCheckoutMetadata({
      metadata: { user_id: 'usr-456', plan: 'professional' },
    });
    expect(result.plan).toBe('professional');
  });

  it('handles missing metadata gracefully', () => {
    const result = extractCheckoutMetadata({});
    expect(result.userId).toBeUndefined();
  });

  it('handles null session gracefully', () => {
    const result = extractCheckoutMetadata(null);
    expect(result.userId).toBeUndefined();
  });
});

describe('Stripe Webhook – Idempotency', () => {
  it('processes new event', () => {
    const processed = new Set<string>();
    expect(isIdempotent('evt_001', processed)).toBe(true);
  });

  it('rejects duplicate event', () => {
    const processed = new Set<string>(['evt_001']);
    expect(isIdempotent('evt_001', processed)).toBe(false);
  });

  it('processes different events independently', () => {
    const processed = new Set<string>();
    expect(isIdempotent('evt_001', processed)).toBe(true);
    expect(isIdempotent('evt_002', processed)).toBe(true);
  });
});
