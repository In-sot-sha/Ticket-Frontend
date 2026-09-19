/** PartyStorm platform fee: 6% per paid ticket/booth, min ₦100, max ₦2,000. */
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
 * Absorb: Fee = 0; buyer pays listed ticket/booth price only (host covers platform + processing).
 * Free / RSVP (₦0 face value) is never charged a platform or processing fee.
 */
export function calculateBuyerCheckout(
  subtotal: number,
  platformFee: number,
  absorbFee: boolean,
): CheckoutFees {
  const safeSubtotal = Math.round(subtotal);
  const safePlatform = Math.round(platformFee);
  if (safeSubtotal <= 0 && safePlatform <= 0) {
    return { platformFee: 0, processingFee: 0, fee: 0, total: 0 };
  }

  if (absorbFee && safeSubtotal > 0) {
    return {
      platformFee: safePlatform,
      processingFee: Math.round(paystackLocalFee(safeSubtotal)),
      fee: 0,
      total: safeSubtotal,
    };
  }

  const base = safeSubtotal + safePlatform;
  let total = base;
  for (let i = 0; i < 5; i++) {
    total = base + paystackLocalFee(total);
  }
  total = Math.round(total);
  const fee = total - safeSubtotal;
  const processingFee = total - base;

  return {
    platformFee: safePlatform,
    processingFee: Math.max(0, Math.round(processingFee)),
    fee,
    total,
  };
}
