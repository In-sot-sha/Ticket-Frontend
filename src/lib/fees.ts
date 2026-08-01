/** PartyStorm platform fee: 6% per ticket/booth, min ₦100, max ₦2,000. */
export const PLATFORM_FEE_RATE = 0.06;
export const PLATFORM_FEE_MIN = 100;
export const PLATFORM_FEE_MAX = 2000;

/** Paystack local: 1.5% + ₦100 (flat waived under ₦2,500), capped at ₦2,000. */
export const PAYSTACK_RATE = 0.015;
export const PAYSTACK_FLAT = 100;
export const PAYSTACK_FLAT_WAIVE_BELOW = 2500;
export const PAYSTACK_LOCAL_CAP = 2000;

export function platformFeeForUnit(price: number): number {
  if (price <= 0) return 0;
  return Math.min(
    PLATFORM_FEE_MAX,
    Math.max(PLATFORM_FEE_MIN, Math.round(price * PLATFORM_FEE_RATE)),
  );
}

export function paystackLocalFee(amountNgn: number): number {
  if (amountNgn <= 0) return 0;
  const flat = amountNgn < PAYSTACK_FLAT_WAIVE_BELOW ? 0 : PAYSTACK_FLAT;
  return Math.min(amountNgn * PAYSTACK_RATE + flat, PAYSTACK_LOCAL_CAP);
}

export type CheckoutFees = {
  platformFee: number;
  processingFee: number;
  /** Amount shown as "Fee" to the buyer (0 when organizer absorbs). */
  fee: number;
  total: number;
};

/**
 * Buyer checkout totals.
 * Pass-through: Fee = PartyStorm + Paystack (bundled); buyer pays subtotal + Fee.
 * Absorb: Fee = 0; buyer pays subtotal only (organizer bears both fees later).
 */
export function calculateBuyerCheckout(
  subtotal: number,
  platformFee: number,
  absorbFee: boolean,
): CheckoutFees {
  if (subtotal <= 0) {
    return { platformFee: 0, processingFee: 0, fee: 0, total: 0 };
  }

  if (absorbFee) {
    return {
      platformFee,
      processingFee: Math.round(paystackLocalFee(subtotal)),
      fee: 0,
      total: Math.round(subtotal),
    };
  }

  const base = subtotal + platformFee;
  let total = base;
  for (let i = 0; i < 5; i++) {
    total = base + paystackLocalFee(total);
  }
  total = Math.round(total);
  const fee = total - Math.round(subtotal);
  const processingFee = total - Math.round(base);

  return {
    platformFee: Math.round(platformFee),
    processingFee: Math.max(0, Math.round(processingFee)),
    fee,
    total,
  };
}
