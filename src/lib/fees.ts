/**
 * PartyStorm checkout fee (published): 7.5% + ₦100 per paid ticket/booth unit.
 * Free / RSVP (₦0) is never charged.
 * Paystack (≈1.5% + ₦100) is settled from this take — not added again for the buyer.
 */
export const PLATFORM_FEE_RATE = 0.075;
export const PLATFORM_FEE_FLAT = 100;

/** @deprecated Default formula no longer uses min/max. */
export const PLATFORM_FEE_MIN = PLATFORM_FEE_FLAT;
export const PLATFORM_FEE_MAX = 2_000_000;

/** Paystack local (internal cost): 1.5% + ₦100 (flat waived under ₦2,500), capped at ₦2,000. */
export const PAYSTACK_RATE = 0.015;
export const PAYSTACK_FLAT = 100;
export const PAYSTACK_FLAT_WAIVE_BELOW = 2500;
export const PAYSTACK_LOCAL_CAP = 2000;

/** What the buyer pays for one ticket. Face price when the host absorbs the fee. */
export function buyerPaysForTicket(
  facePrice: number,
  absorbFee = false,
  platformFeeNaira?: number | null,
): number {
  const face = Math.round(Number(facePrice) || 0);
  if (face <= 0) return 0;
  if (absorbFee) return face;
  return calculateBuyerCheckout(face, platformFeeForUnit(face, platformFeeNaira), false).total;
}

/**
 * PartyStorm take / buyer checkout fee per unit.
 * Pass `platformFeeNaira` (admin override) to skip the default 7.5% + ₦100 formula.
 */
export function platformFeeForUnit(
  price: number,
  platformFeeNaira?: number | null,
): number {
  if (price <= 0) return 0;
  if (platformFeeNaira != null && Number.isFinite(Number(platformFeeNaira))) {
    return Math.max(0, Math.round(Number(platformFeeNaira)));
  }
  return Math.round(price * PLATFORM_FEE_RATE) + PLATFORM_FEE_FLAT;
}

export function paystackLocalFee(amountNgn: number): number {
  if (amountNgn <= 0) return 0;
  const flat = amountNgn < PAYSTACK_FLAT_WAIVE_BELOW ? 0 : PAYSTACK_FLAT;
  return Math.min(amountNgn * PAYSTACK_RATE + flat, PAYSTACK_LOCAL_CAP);
}

export type CheckoutFees = {
  platformFee: number;
  /** Estimated Paystack cost (internal; not added again for the buyer). */
  processingFee: number;
  /** Amount shown as "Fee" to the buyer (0 when organizer absorbs). */
  fee: number;
  total: number;
};

/**
 * Buyer checkout totals.
 * Pass-through: Fee = unified 7.5% + ₦100; buyer pays subtotal + Fee.
 * Absorb: Fee = 0; buyer pays listed ticket/booth price only.
 * Paystack is settled from PartyStorm’s take (not stacked on the buyer).
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

  const total = safeSubtotal + safePlatform;
  return {
    platformFee: safePlatform,
    processingFee: Math.round(paystackLocalFee(total)),
    fee: safePlatform,
    total,
  };
}
