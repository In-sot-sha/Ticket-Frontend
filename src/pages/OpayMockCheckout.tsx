import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

const OpayMockCheckout = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || `OPAY_MOCK_${Date.now()}`;
  const amount = searchParams.get('amount') || '0';
  const email = searchParams.get('email') || 'guest@example.com';
  const name = searchParams.get('name') || 'Guest User';

  const handleSuccess = () => {
    // Redirect back to return url with success params
    window.location.href = `/booking/success?orderId=${orderId}&status=success`;
  };

  const handleCancel = () => {
    // Redirect back with failure/cancel
    window.location.href = `/booking/success?orderId=${orderId}&status=cancel`;
  };

  return (
    <div className="min-h-screen bg-gray-105 dark:bg-neutral-950 flex flex-col justify-between font-sans">
      
      {/* OPay Styled Header */}
      <header className="bg-[#00c25a] text-white py-4 px-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl tracking-tighter italic">OPay</span>
          <span className="border-l border-white/30 pl-2 text-xs font-semibold tracking-wide uppercase">Cashier Sandbox</span>
        </div>
        <button 
          onClick={handleCancel}
          className="text-white hover:text-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Main cashier card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-lg p-6 space-y-6">
          
          {/* Order Details Header */}
          <div className="text-center pb-4 border-b border-gray-100 dark:border-neutral-800">
            <p className="text-xs text-gray-400">Paying Merchant</p>
            <h2 className="font-extrabold text-base text-neutral-800 dark:text-neutral-200">Eventify Platform</h2>
            <div className="mt-4 text-3xl font-black text-[#00c25a]">
              ₦{Number(amount).toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-mono">Reference: {orderId}</p>
          </div>

          {/* Customer info */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Customer</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{email}</span>
            </div>
          </div>

          {/* Payment simulation options */}
          <div className="border border-[#00c25a]/20 bg-[#00c25a]/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#00c25a]">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-bold">OPay Safe Payment Simulator</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              This is a sandbox test portal. Click "Authorize Payment" below to simulate a successful payment flow, or "Decline" to simulate a cancelled transaction.
            </p>
          </div>

          {/* Form CTAs */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSuccess}
              className="w-full h-12 bg-[#00c25a] hover:bg-[#00a94e] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Authorize Sandbox Payment
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="w-full h-12 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-350 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel & Decline Payment
            </button>
          </div>

        </div>
      </main>

      {/* Cashier Footer */}
      <footer className="py-4 text-center text-[10px] text-gray-400 border-t border-gray-150 dark:border-neutral-900 bg-gray-50 dark:bg-neutral-950">
        Secured by OPay Payment Gateway. Sandbox environment.
      </footer>

    </div>
  );
};

export default OpayMockCheckout;
