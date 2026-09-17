import PaystackPop from '@paystack/inline-js';

type PaystackSession = {
  popup: PaystackPop;
  unbind: () => void;
};

let session: PaystackSession | null = null;

function paystackIframes(): HTMLIFrameElement[] {
  return Array.from(
    document.querySelectorAll<HTMLIFrameElement>(
      'iframe[id^="inline-background-"], iframe[id^="inline-checkout-"]'
    )
  );
}

function stylePaystackIframes() {
  for (const frame of paystackIframes()) {
    frame.style.colorScheme = 'light';
    if (frame.id.startsWith('inline-checkout-')) {
      frame.style.background = 'transparent';
    } else {
      frame.style.background = 'rgba(15, 23, 42, 0.58)';
      frame.style.backdropFilter = 'blur(14px)';
      (frame.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
        'blur(14px)';
    }
  }
}

function removePaystackIframes() {
  paystackIframes().forEach((frame) => frame.remove());
}

function endSession() {
  session?.unbind();
  session = null;
}

function closePaystackPopup() {
  try {
    session?.popup.cancelTransaction();
  } catch {
    /* ignore */
  }
  removePaystackIframes();
  endSession();
}

function bindCancelControls(popup: PaystackPop, onCancel?: () => void) {
  const finishCancel = () => {
    closePaystackPopup();
    onCancel?.();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    finishCancel();
  };

  window.addEventListener('keydown', onKey);

  const bindBackdrop = () => {
    const bg = document.querySelector<HTMLIFrameElement>('iframe[id^="inline-background-"]');
    const doc = bg?.contentDocument;
    if (!doc) return;
    doc.addEventListener(
      'click',
      () => {
        finishCancel();
      },
      { once: true }
    );
  };

  window.setTimeout(bindBackdrop, 80);
  window.setTimeout(bindBackdrop, 400);

  return () => {
    window.removeEventListener('keydown', onKey);
  };
}

export function openPaystackCheckout(opts: {
  accessCode?: string;
  publicKey?: string | null;
  email: string;
  amountKobo: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
}) {
  closePaystackPopup();

  const popup = new PaystackPop();
  let settled = false;

  const notifyCancel = () => {
    if (settled) return;
    settled = true;
    closePaystackPopup();
    opts.onCancel?.();
  };

  const unbind = bindCancelControls(popup, notifyCancel);
  session = { popup, unbind };

  const callbacks = {
    onSuccess: (transaction: { reference?: string }) => {
      if (settled) return;
      settled = true;
      endSession();
      opts.onSuccess(transaction?.reference || opts.reference);
    },
    onCancel: () => notifyCancel(),
    onError: (error: { message?: string }) => {
      if (settled) return;
      settled = true;
      closePaystackPopup();
      opts.onError?.(error?.message || 'Paystack checkout failed to load');
    },
    onLoad: () => {
      stylePaystackIframes();
    },
  };

  if (opts.accessCode) {
    popup.resumeTransaction(opts.accessCode, callbacks);
  } else {
    const key =
      opts.publicKey ||
      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
      'pk_test_d3000676b7db0bc43f07a4a2fa44a8ad8d1b6ee8';

    popup.newTransaction({
      key,
      email: opts.email,
      amount: opts.amountKobo,
      currency: 'NGN',
      ref: opts.reference,
      ...callbacks,
    });
  }

  window.setTimeout(stylePaystackIframes, 0);
  window.setTimeout(stylePaystackIframes, 250);
}
