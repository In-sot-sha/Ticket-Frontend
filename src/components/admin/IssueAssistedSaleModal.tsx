import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { formatNaira } from '../../lib/eventOrganizer';
import { platformFeeForUnit } from '../../lib/fees';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Ticket } from 'lucide-react';

interface IssueAssistedSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const IssueAssistedSaleModal: React.FC<IssueAssistedSaleModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Form State
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'POS' | 'CASH'>('TRANSFER');
  const [customFeeActive, setCustomFeeActive] = useState(false);
  const [customFee, setCustomFee] = useState<string>('');
  const [checkInNow, setCheckInNow] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    gross: number;
    fee: number;
    net: number;
    count: number;
  } | null>(null);

  // Load events when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessResult(null);
      setLoadingEvents(true);
      api.admin
        .getEvents()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : data?.events || [];
          setEvents(list);
          if (list.length > 0 && !selectedEventId) {
            setSelectedEventId(String(list[0].id));
          }
        })
        .catch((err) => {
          setError(err?.response?.data?.message || 'Failed to load events');
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [open]);

  // Active selected event
  const currentEvent = useMemo(() => {
    return events.find((e) => String(e.id) === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Available ticket types for the selected event
  const ticketTypes = useMemo(() => {
    return currentEvent?.ticketTypes || [];
  }, [currentEvent]);

  // Auto-select first ticket type when event changes
  useEffect(() => {
    if (ticketTypes.length > 0) {
      const exists = ticketTypes.some((tt: any) => String(tt.id) === selectedTicketTypeId);
      if (!exists) {
        setSelectedTicketTypeId(String(ticketTypes[0].id));
      }
    } else {
      setSelectedTicketTypeId('');
    }
  }, [ticketTypes]);

  // Selected ticket type object
  const currentTicketType = useMemo(() => {
    return ticketTypes.find((tt: any) => String(tt.id) === selectedTicketTypeId) || null;
  }, [ticketTypes, selectedTicketTypeId]);

  // Calculations
  const unitPrice = Number(currentTicketType?.price) || 0;
  const grossSubtotal = unitPrice * quantity;

  const defaultUnitFee = platformFeeForUnit(unitPrice, currentTicketType?.platformFeeNaira);
  const defaultTotalFee = defaultUnitFee * quantity;

  const finalFee = customFeeActive
    ? Math.max(0, Math.round(Number(customFee) || 0))
    : defaultTotalFee;

  const organizerNet = Math.max(0, grossSubtotal - finalFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedTicketTypeId) {
      setError('Please select an event and ticket tier.');
      return;
    }
    if (!buyerName.trim()) {
      setError('Buyer name is required.');
      return;
    }
    if (!buyerEmail.trim() && !buyerPhone.trim()) {
      setError('Please provide either an email or phone number to deliver the tickets.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.admin.issueAssistedSale({
        eventId: Number(selectedEventId),
        ticketTypeId: Number(selectedTicketTypeId),
        quantity,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        paymentMethod,
        platformFee: customFeeActive ? finalFee : undefined,
        checkInNow,
      });

      const data = res.data;
      setSuccessResult({
        reference: data?.order?.paymentReference || 'CONFIRMED',
        gross: data?.breakdown?.gross ?? grossSubtotal,
        fee: data?.breakdown?.platformFee ?? finalFee,
        net: data?.breakdown?.netAmount ?? organizerNet,
        count: data?.ticketsCount || quantity,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to record assisted sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessResult(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setQuantity(1);
    setCustomFeeActive(false);
    setCustomFee('');
    setCheckInNow(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Ticket className="h-5 w-5 text-rose-500" />
            Issue Assisted Pre-Event Sale
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            For buyers assisted offline before the event. Sets PartyStorm's cut and generates official tickets with QR codes.
          </DialogDescription>
        </DialogHeader>

        {successResult ? (
          <div className="py-4 space-y-4">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {successResult.count} Ticket{successResult.count > 1 ? 's' : ''} Issued Successfully!
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 font-mono">
                Order Ref: {successResult.reference}
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Gross Box Office Collected:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {formatNaira(successResult.gross)}
                </span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>PartyStorm Cut:</span>
                <span className="font-bold">-{formatNaira(successResult.fee)}</span>
              </div>
              <div className="flex justify-between text-neutral-900 dark:text-white pt-2 border-t border-neutral-100 dark:border-neutral-800 font-bold">
                <span>Organizer Net Earnings:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatNaira(successResult.net)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 text-center">
              Official ticket credentials have been dispatched to the buyer's contact. The organizer's finance dashboard has been updated.
            </p>

            <DialogFooter className="pt-2">
              <Button onClick={handleResetAndClose} className="w-full">
                Done & Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Event Selection */}
            <div>
              <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                Select Event <span className="text-rose-500">*</span>
              </label>
              {loadingEvents ? (
                <div className="h-9 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.organization?.name ? `(${ev.organization.name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Ticket Tier & Quantity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Ticket Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTicketTypeId}
                  onChange={(e) => setSelectedTicketTypeId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                  disabled={ticketTypes.length === 0}
                >
                  {ticketTypes.map((tt: any) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.name} — {formatNaira(tt.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none tabular-nums"
                  required
                />
              </div>
            </div>

            {/* Buyer Contact Details */}
            <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Buyer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fatima Ibrahim"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="buyer@example.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Sends PDF ticket stub</p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                    WhatsApp Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Sends WhatsApp QR</p>
                </div>
              </div>
            </div>

            {/* Payment Method & Cut Setting */}
            <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="block font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                  Payment Method Received
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TRANSFER', 'POS', 'CASH'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        paymentMethod === method
                          ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {method === 'TRANSFER' ? 'Bank Transfer' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee / Cut Override */}
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      PartyStorm Cut
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customFeeActive}
                      onChange={(e) => {
                        setCustomFeeActive(e.target.checked);
                        if (e.target.checked && !customFee) {
                          setCustomFee(String(defaultTotalFee));
                        }
                      }}
                      className="rounded text-rose-500 focus:ring-rose-400"
                    />
                    <span>Custom Cut</span>
                  </label>
                </div>

                {customFeeActive ? (
                  <div>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2 text-xs text-neutral-400">₦</span>
                      <input
                        type="number"
                        min={0}
                        value={customFee}
                        onChange={(e) => setCustomFee(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full pl-7 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold tabular-nums focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Overrides the default formula for this sale.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500">
                    Standard PartyStorm Take: <strong className="text-neutral-900 dark:text-white">{formatNaira(defaultTotalFee)}</strong> (7.5% + ₦100 per unit)
                  </p>
                )}
              </div>
            </div>

            {/* Financial Ledger Summary Box */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-900 text-white p-3.5 space-y-1.5">
              <div className="flex justify-between text-neutral-400 text-[11px]">
                <span>Gross Box Office ({quantity} × {formatNaira(unitPrice)}):</span>
                <span className="font-mono text-white font-semibold">{formatNaira(grossSubtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-400 text-[11px]">
                <span>PartyStorm Cut:</span>
                <span className="font-mono font-semibold">-{formatNaira(finalFee)}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline font-bold text-xs">
                <span className="text-emerald-400">Organizer Net Share:</span>
                <span className="font-mono text-base text-emerald-400">{formatNaira(organizerNet)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !buyerName.trim() || (!buyerEmail.trim() && !buyerPhone.trim())}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Issuing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Issue Tickets</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IssueAssistedSaleModal;
