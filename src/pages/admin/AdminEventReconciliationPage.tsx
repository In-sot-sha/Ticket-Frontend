import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatNaira } from '../../lib/eventOrganizer';

export const AdminEventReconciliationPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    api.admin
      .getEventFinancialReport(eventId)
      .then((res: any) => setData(res.data))
      .catch((err: any) => {
        console.error('Failed to load event financial report:', err);
        setError(err.response?.data?.message || 'Failed to load financial reconciliation report.');
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('reconciliation-document');
    if (!element || downloading) return;

    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { PDFDocument } = await import('pdf-lib');

      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#000000' : '#ffffff';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfDoc = await PDFDocument.create();

      const pngImage = await pdfDoc.embedPng(imgData);
      const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pngImage.width,
        height: pngImage.height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const sanitizedTitle = (data?.event?.title || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      link.href = url;
      link.download = `reconciliation-${sanitizedTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF, falling back to window.print:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-5xl space-y-4">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Report Unavailable</h2>
          <p className="text-xs text-neutral-500">{error || 'Event not found.'}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/events')}
            className="rounded-xl border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const { event, summary, reconciliation, channels, settlement, generatedAt } = data;

  // Strictly resolve the event's official ticket tiers
  const officialTicketTypes: any[] = data?.event?.ticketTypes || [];

  const tiers = (() => {
    // 1. If backend explicitly returned tiers:
    if (Array.isArray(data?.tiers) && data.tiers.length > 0) {
      const valid = data.tiers.filter((t: any) => {
        const name = (t.name || '').trim();
        return name && !name.includes(',') && name.toLowerCase() !== 'ticket' && !name.toLowerCase().startsWith('stall');
      });
      if (valid.length > 0) return valid;
    }

    // 2. If event has ticketTypes defined (e.g. 3 tiers in production):
    if (officialTicketTypes.length > 0) {
      const counts: Record<string, number> = {};
      for (const tt of officialTicketTypes) {
        counts[tt.name] = 0;
      }

      for (const tx of (data?.transactions || [])) {
        if (tx.channelType === 'VENDOR') continue;
        const txTier = (tx.tierName || '').trim();
        const qty = tx.ticketsCount || 1;

        if (counts[txTier] !== undefined) {
          counts[txTier] += qty;
        } else if (txTier.includes(',')) {
          // Multi-tier order, e.g. "Early Birds, Children Only"
          const parts = txTier.split(',').map((p: string) => p.trim()).filter((p: string) => counts[p] !== undefined);
          if (parts.length > 0) {
            const perPart = Math.floor(qty / parts.length);
            const remainder = qty % parts.length;
            parts.forEach((p: string, idx: number) => {
              counts[p] += perPart + (idx < remainder ? 1 : 0);
            });
          }
        }
      }

      return officialTicketTypes.map((tt) => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        soldCount: counts[tt.name] || 0,
      }));
    }

    // 3. Fallback: filter out compound and phantom tiers
    const map = new Map<string, { id: string; name: string; soldCount: number }>();
    for (const tx of (data?.transactions || [])) {
      if (tx.channelType === 'VENDOR') continue;
      const name = (tx.tierName || '').trim();
      if (!name || name.toLowerCase() === 'ticket' || name.toLowerCase().startsWith('stall') || name.includes(',')) {
        continue;
      }
      if (!map.has(name)) {
        map.set(name, { id: name, name, soldCount: 0 });
      }
      map.get(name)!.soldCount += (tx.ticketsCount || 1);
    }
    return Array.from(map.values());
  })();

  const onlineTickets = channels?.online?.ticketsCount || 0;
  const onlineGross = channels?.online?.gross || 0;
  const onlineNet = channels?.online?.net || 0;

  // Gate is part of assisted
  const gateTickets = channels?.gate?.ticketsCount || 0;
  const gateGross = channels?.gate?.grossCollected || 0;
  const gateNet = channels?.gate?.net || 0;

  const assistedTickets = (channels?.assisted?.ticketsCount || 0) + gateTickets;
  const assistedGross = (channels?.assisted?.grossCollected || 0) + gateGross;
  const assistedNet = (channels?.assisted?.net || 0) + gateNet;

  const totalTickets = onlineTickets + assistedTickets + (channels?.vendor?.stallsCount || 0);
  const totalGross = onlineGross + assistedGross + (channels?.vendor?.gross || 0);
  const totalNet = onlineNet + assistedNet + (channels?.vendor?.net || 0);

  const paystackSettlement = settlement?.paystack?.netPayable ?? onlineNet;
  const directSettlement = (settlement?.directTransfer?.netPayable ?? channels?.assisted?.net ?? 0) + gateNet;
  const totalSettlement = summary?.netOrganizerProceeds ?? (paystackSettlement + directSettlement);

  const formattedDate = new Date(generatedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-100/70 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-6 px-3 sm:px-6">
      {/* ── TOP ACTION BAR (Hidden in Print) ── */}
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/events')}
          className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Events</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={downloading}
            onClick={handleDownloadPdf}
            className="rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-bold gap-1.5 h-8 px-4 shadow-sm cursor-pointer disabled:opacity-70"
          >
            {downloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating PDF…</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── FORMAL DOCUMENT SHEET (Wider format max-w-5xl) ── */}
      <div
        id="reconciliation-document"
        className="max-w-5xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-black p-6 sm:p-12 shadow-xl space-y-8 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:text-black"
      >
        {/* Document Header */}
        <div className="text-center space-y-2 pb-2">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            PartyStorm
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-wide uppercase">
            {event.title}
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Event Financial & Operational Reconciliation
          </p>
          <div className="pt-1">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border ${
                event.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : event.status === 'LIVE'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
              }`}
            >
              Event {event.status}
            </span>
          </div>
        </div>

        {/* ── TOP KPI SUMMARY BLOCK (Total tickets sold & Net organizer proceeds) ── */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="grid grid-cols-2 gap-6 sm:gap-12">
            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Total tickets sold
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white font-mono">
                {summary.totalTicketsSold}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Net organizer proceeds
              </p>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white font-mono">
                {formatNaira(summary.netOrganizerProceeds)}
              </p>
            </div>
          </div>
        </div>

        {/* ── SALES BY CHANNEL TABLE (ONLINE & ASSISTED TICKETS ONLY - NO MONEY) ── */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Sales by channel
            </h2>
            <span className="text-[11px] text-neutral-400 font-medium">Tickets Breakdown</span>
          </div>

          <div className="w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-2.5 px-0 font-semibold">Channel</th>
                  <th className="py-2.5 px-0 text-right font-semibold">Tickets Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                {/* 1. Online Sales */}
                <tr>
                  <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                    Online Sales
                  </td>
                  <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                    {onlineTickets}
                  </td>
                </tr>

                {/* 2. Direct / Assisted Sales (Gate Included) */}
                <tr>
                  <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                    Direct / Assisted Sales
                  </td>
                  <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                    {assistedTickets}
                  </td>
                </tr>

                {/* Vendor Stalls (if any) */}
                {channels?.vendor?.stallsCount > 0 && (
                  <tr>
                    <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                      Vendor Stalls
                    </td>
                    <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                      {channels.vendor.stallsCount}
                    </td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700">
                  <td className="py-3.5 px-0 text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    Total tickets sold
                  </td>
                  <td className="py-3.5 px-0 text-right text-sm sm:text-base font-mono font-bold text-neutral-900 dark:text-white">
                    {totalTickets}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TICKET TIERS TABLE (HOW MANY ARE SOLD BY EACH TIER) ── */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Ticket tiers
            </h2>
            <span className="text-[11px] text-neutral-400 font-medium">Sold by Tier</span>
          </div>

          <div className="w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-2.5 px-0 font-semibold">Ticket Tier</th>
                  <th className="py-2.5 px-0 text-right font-semibold">Tickets Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                {tiers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-3 px-0 text-neutral-500">
                      No ticket tiers found.
                    </td>
                  </tr>
                ) : (
                  tiers.map((t: any) => (
                    <tr key={t.id || t.name}>
                      <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                        {t.name}
                      </td>
                      <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                        {t.soldCount || 0}
                      </td>
                    </tr>
                  ))
                )}

                {/* Total Row */}
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700">
                  <td className="py-3.5 px-0 text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    Total tickets sold
                  </td>
                  <td className="py-3.5 px-0 text-right text-sm sm:text-base font-mono font-bold text-neutral-900 dark:text-white">
                    {tiers.reduce((sum: number, t: any) => sum + (t.soldCount || 0), 0) || totalTickets}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SETTLEMENT STATUS TABLE (TOTAL ON PAYSTACK & TOTAL ON DIRECT) ── */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
              Settlement status
            </h2>
            <span className="text-[11px] text-neutral-400 font-medium">Paystack & Direct Settlement Totals</span>
          </div>

          <div className="w-full">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-2.5 px-0 font-semibold">Description</th>
                  <th className="py-2.5 px-0 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                {/* 1. Total on Paystack */}
                <tr>
                  <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                    Paystack (Online Sales)
                  </td>
                  <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                    {formatNaira(paystackSettlement)}
                  </td>
                </tr>

                {/* 2. Total on Direct (incl. Gate) */}
                <tr>
                  <td className="py-3 px-0 font-medium text-neutral-900 dark:text-white">
                    Direct Transfer (Assisted Sales)
                  </td>
                  <td className="py-3 px-0 text-right font-mono font-bold text-neutral-900 dark:text-white">
                    {formatNaira(directSettlement)}
                  </td>
                </tr>

                {/* Total Settlement Row */}
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700">
                  <td className="py-3.5 px-0 text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    Total settlement paid
                  </td>
                  <td className="py-3.5 px-0 text-right text-sm sm:text-base font-mono font-bold text-neutral-900 dark:text-white">
                    {formatNaira(totalSettlement)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── DOCUMENT FOOTER (Clean formal statement footer) ── */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 pb-2 text-center text-xs text-neutral-500 font-medium">
          Prepared by PartyStorm · Financial Reconciliation Statement · Prepared on {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default AdminEventReconciliationPage;
