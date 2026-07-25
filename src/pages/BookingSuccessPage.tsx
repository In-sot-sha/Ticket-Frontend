import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Home, Ticket } from 'lucide-react';
import api from '../services/api';

type Phase = 'loading' | 'success' | 'error';

const STEPS = ['Confirm payment', 'Issue tickets', 'Open passes'] as const;

const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<Phase>('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [message, setMessage] = useState('Confirming your payment…');

  useEffect(() => {
    const processOpayReturn = async () => {
      const orderId = searchParams.get('orderId');
      const status = searchParams.get('status');

      if (!orderId) {
        setMessage('Missing order reference. Contact support if you were charged.');
        setPhase('error');
        return;
      }

      if (status !== 'success') {
        setMessage('Payment was cancelled or did not complete.');
        setPhase('error');
        return;
      }

      const cachedOrderStr = localStorage.getItem(`opay_order_${orderId}`);
      if (!cachedOrderStr) {
        setMessage(
          'We could not find your booking on this device. Try Recover tickets with your email or phone.'
        );
        setPhase('error');
        return;
      }

      try {
        const cachedOrder = JSON.parse(cachedOrderStr);
        const firstItem = cachedOrder.items?.[0];
        if (!firstItem) throw new Error('No items in cached order');

        setStepIndex(1);
        setMessage('Issuing your tickets…');

        const checkoutRes = await api.post<any>('/tickets/checkout/guest', {
          firstName: cachedOrder.firstName,
          lastName: cachedOrder.lastName,
          email: cachedOrder.email,
          phone: cachedOrder.phone,
          eventId: cachedOrder.eventId,
          ticketTypeId: firstItem.ticketTypeId,
          quantity: firstItem.quantity,
        });

        if (checkoutRes.status !== 201) {
          throw new Error('Server rejected checkout creation.');
        }

        localStorage.removeItem(`opay_order_${orderId}`);

        const firstType = checkoutRes.data.tickets?.[0]?.ticketType;
        const confirmedOrder = {
          eventId: cachedOrder.eventId,
          eventName: cachedOrder.eventName,
          eventSlug: cachedOrder.eventSlug || null,
          eventDate: cachedOrder.eventDate,
          eventTime: cachedOrder.eventTime,
          eventLocation: cachedOrder.eventLocation,
          eventImageUrl: cachedOrder.eventImageUrl,
          ticketType: firstType?.name || 'General Admission',
          ticketStyle: firstType?.ticketStyle,
          accentColor: firstType?.accentColor,
          quantity:
            checkoutRes.data.tickets?.length ||
            cachedOrder.items?.reduce((s: number, i: any) => s + i.quantity, 0) ||
            1,
          totalAmount: cachedOrder.totalAmount,
          currency: 'NGN',
          tickets: checkoutRes.data.tickets,
        };

        setStepIndex(2);
        setPhase('success');
        setMessage('Tickets ready — opening your passes…');
        setTimeout(() => {
          navigate('/ticket-confirmation', { state: confirmedOrder, replace: true });
        }, 700);
      } catch (err: any) {
        console.error('Error completing OPay guest checkout:', err);
        setMessage(
          err.response?.data?.message ||
            err.message ||
            'Payment went through, but we could not issue tickets yet.'
        );
        setPhase('error');
      }
    };

    processOpayReturn();
  }, [searchParams, navigate]);

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.12),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.18),_transparent_50%)]"
      />

      <div className="relative w-full max-w-sm text-center">
        {phase === 'loading' && (
          <div className="space-y-6" role="status" aria-live="polite">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/20">
              <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Almost there
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {message}
              </p>
            </div>
            <ol className="mx-auto flex max-w-[240px] flex-col gap-2 text-left">
              {STEPS.map((label, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 text-xs font-semibold ${
                      active
                        ? 'text-rose-600 dark:text-rose-400'
                        : done
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-rose-500 text-white'
                            : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {phase === 'success' && (
          <div className="space-y-5" role="status" aria-live="polite">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Payment confirmed
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {message}
              </p>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {message}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                to="/recover-ticket"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-rose-500 text-sm font-bold text-white transition-colors hover:bg-rose-600"
              >
                <Ticket className="h-4 w-4" />
                Recover tickets
              </Link>
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white text-sm font-bold text-neutral-800 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <Home className="h-4 w-4" />
                Back home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSuccessPage;
