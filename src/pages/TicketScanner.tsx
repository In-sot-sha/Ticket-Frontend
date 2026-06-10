import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle,
  AlertTriangle,
  ScanLine,
  Search,
  ArrowLeft,
  Camera,
  XCircle,
  RefreshCw,
  User,
  CalendarDays,
  Hash,
  Loader2,
  MapPin,
} from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

type ScanStatus = 'idle' | 'scanning' | 'loading' | 'success' | 'error';

const SCANNER_DIV_ID = 'qr-video-region';

const TicketScanner: React.FC = () => {
  const navigate = useNavigate();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [tab, setTab] = useState<'camera' | 'manual'>('camera');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isVerifyingRef = useRef(false);
  const handleVerificationRef = useRef<(code: string) => void>(() => {});

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerification = useCallback(async (code: string) => {
    // Stop camera immediately so the result screen has full focus
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setScanStatus('loading');
    setMessage('');
    setTicketData(null);
    // Scroll to top so result is immediately visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const response = await api.tickets.validate(code);
      setScanStatus('success');
      setMessage(response.data.message || 'Ticket validated — entry approved');
      setTicketData(response.data.ticket);
    } catch (err: any) {
      setScanStatus('error');

      const serverMsg: string = err?.response?.data?.message ?? '';
      const serverStatus: string = err?.response?.data?.status ?? '';
      const httpStatus: number = err?.response?.status ?? 0;

      // Map backend responses to clear gate-staff messages
      let displayMessage: string;

      if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
        displayMessage = 'Network error — check your WiFi or internet connection and try again.';
      } else if (serverStatus === 'USED' || /already.*used|already.*scanned|not valid/i.test(serverMsg)) {
        displayMessage = 'This ticket has already been scanned and used. Entry not permitted.';
      } else if (serverStatus === 'CANCELLED' || /cancel/i.test(serverMsg)) {
        displayMessage = 'This ticket has been cancelled and is no longer valid.';
      } else if (serverStatus === 'EVENT_ENDED' || /ended/i.test(serverMsg)) {
        displayMessage = 'This event has already ended. Ticket cannot be accepted.';
      } else if (serverStatus === 'EVENT_NOT_STARTED' || /not.*started|too early/i.test(serverMsg)) {
        displayMessage = 'This event has not started yet. Please wait until the event begins.';
      } else if (httpStatus === 404 || /invalid.*qr|not found|invalid.*code/i.test(serverMsg)) {
        displayMessage = 'QR code not recognised. This ticket does not exist in the system.';
      } else if (serverMsg) {
        displayMessage = serverMsg;
      } else {
        displayMessage = 'Ticket verification failed. Please try again or contact support.';
      }

      setMessage(displayMessage);
    } finally {
      isVerifyingRef.current = false;
    }
  }, []);

  useEffect(() => {
    handleVerificationRef.current = handleVerification;
  }, [handleVerification]);

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* swallow */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (scannerRef.current?.isScanning) return;
    setCameraError(null);
    isVerifyingRef.current = false;

    try {
      const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false } as any);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (!isVerifyingRef.current) {
            isVerifyingRef.current = true;
            handleVerificationRef.current(decodedText);
          }
        },
        () => { /* per-frame failures are normal */ },
      );

      setScanStatus('scanning');
      setCameraActive(true);
    } catch (err: any) {
      scannerRef.current = null;
      // Show the full raw error message so it's debuggable
      const rawMsg = err?.message ?? String(err) ?? 'unknown';
      const msg = /[Pp]ermission|[Dd]enied/.test(rawMsg)
        ? 'Camera access denied. Tap "Enable Camera" and allow in your browser settings.'
        : /[Nn]ot[Ff]ound|device not found/.test(rawMsg)
        ? 'No camera found on this device.'
        : /[Hh][Tt][Tt][Pp][Ss]|[Ss]ecure|[Ii]nsecure/.test(rawMsg)
        ? 'HTTPS required for camera access. Open this page via https:// or use localhost.'
        : `Could not start camera: ${rawMsg}`;
      setCameraError(msg);
      setScanStatus('idle');
      setCameraActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // React to tab changes
  useEffect(() => {
    if (tab === 'camera' && !['success', 'error', 'loading'].includes(scanStatus)) {
      const t = setTimeout(() => startCamera(), 100);
      return () => clearTimeout(t);
    } else if (tab !== 'camera') {
      stopCamera().then(() => {
        if (!['success', 'error'].includes(scanStatus)) setScanStatus('idle');
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Manual submit ──────────────────────────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code && !isVerifyingRef.current) {
      isVerifyingRef.current = true;
      handleVerification(code);
    }
  };

  // ── Reset — go back to scanner ─────────────────────────────────────────────
  const resetScanner = () => {
    setScanStatus('idle');
    setMessage('');
    setTicketData(null);
    setManualCode('');
    isVerifyingRef.current = false;
    if (tab === 'camera') setTimeout(() => startCamera(), 100);
  };

  // ── Whether to show the result screen instead of camera/manual ─────────────
  const showResult = scanStatus === 'loading' || scanStatus === 'success' || scanStatus === 'error';

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col pb-0">

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-900 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-1.5">
            <ScanLine className="h-4 w-4 text-rose-500 shrink-0" />
            Gate Scanner
          </h1>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5 truncate">
            Scan QR codes to check in attendees
          </p>
        </div>
      </div>

      {/* Camera error banner — shown at top so it's always visible */}
      {cameraError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/40 px-4 py-3 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-snug break-words">{cameraError}</p>
            {cameraError.includes('HTTPS') && (
              <p className="text-[11px] text-red-600/80 dark:text-red-500/80 mt-1 leading-snug">
                Mobile browsers require HTTPS for camera access. Use the Manual Entry tab instead, or set up HTTPS (ngrok/mkcert).
              </p>
            )}
          </div>
          <button
            onClick={startCamera}
            className="shrink-0 text-[11px] font-bold text-red-600 dark:text-red-400 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── RESULT SCREEN — replaces everything when a scan fires ── */}
      {showResult && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 pb-28">
          {scanStatus === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
              </div>
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Verifying ticket…</p>
            </div>
          )}

          {scanStatus === 'success' && ticketData && (
            <div className="w-full max-w-sm">
              {/* Success icon */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">Access Granted</h2>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-1">{message}</p>
              </div>

              {/* Ticket details card */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm mb-5">
                <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Attendee Details</p>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">Name</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {ticketData.user?.firstName} {ticketData.user?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">Event</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">
                        {ticketData.event?.title}
                      </p>
                    </div>
                  </div>

                  {ticketData.event?.location && (
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">Location</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {ticketData.event.location}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                      <Hash className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">Ticket ID</p>
                      <p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                        #{ticketData.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={resetScanner}
                className="w-full py-4 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Scan Next Ticket
              </button>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="w-full max-w-sm flex flex-col items-center">
              {/* Icon colour changes based on error type */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                /already been scanned|already.*used/i.test(message)
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : /cancelled/i.test(message)
                  ? 'bg-neutral-100 dark:bg-neutral-800'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <AlertTriangle
                  className={`h-12 w-12 ${
                    /already been scanned|already.*used/i.test(message)
                      ? 'text-amber-500'
                      : /cancelled/i.test(message)
                      ? 'text-neutral-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                  strokeWidth={1.75}
                />
              </div>

              <h2 className={`text-2xl font-extrabold mb-2 ${
                /already been scanned|already.*used/i.test(message)
                  ? 'text-amber-600 dark:text-amber-400'
                  : /cancelled/i.test(message)
                  ? 'text-neutral-500'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {/already been scanned|already.*used/i.test(message)
                  ? 'Already Used'
                  : /cancelled/i.test(message)
                  ? 'Ticket Cancelled'
                  : /not recognised|does not exist/i.test(message)
                  ? 'Not Found'
                  : /ended/i.test(message)
                  ? 'Event Ended'
                  : /not.*started|too early/i.test(message)
                  ? 'Event Not Started'
                  : 'Access Denied'}
              </h2>

              <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center mb-1 leading-snug font-medium">
                {message}
              </p>

              <button
                onClick={resetScanner}
                className="mt-8 w-full py-4 rounded-2xl text-sm font-extrabold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Scan Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CAMERA + MANUAL TABS (hidden while result is showing) ── */}
      {!showResult && (
        <>
          {/* Tab bar */}
          <div className="flex bg-white dark:bg-gray-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            {(['camera', 'manual'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-colors ${
                  tab === t
                    ? 'border-rose-500 text-rose-500'
                    : 'border-transparent text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {t === 'camera' ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Camera Scan
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Search className="h-3.5 w-3.5" /> Manual Entry
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Camera tab
               The viewfinder div MUST stay in the DOM while scanner is running.
               Use display:none visibility rather than conditional rendering. ── */}
          <div className={tab === 'camera' ? 'flex flex-col flex-1' : 'hidden'}>
            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-4 pb-24 gap-4">

              {/* Viewfinder */}
              <div className="bg-black rounded-3xl overflow-hidden shadow-lg relative">
                {/* Fixed square viewfinder — takes up most of the screen height */}
                <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                  <div className="absolute inset-0">
                    {/* html5-qrcode injects <video> here */}
                    <div id={SCANNER_DIV_ID} className="w-full h-full" />

                    {/* Scanning overlay with cutout */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div
                          className="absolute inset-0 bg-black/50"
                          style={{
                            clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,' +
                              'calc(50% - 110px) calc(50% - 110px),' +
                              'calc(50% - 110px) calc(50% + 110px),' +
                              'calc(50% + 110px) calc(50% + 110px),' +
                              'calc(50% + 110px) calc(50% - 110px),' +
                              'calc(50% - 110px) calc(50% - 110px))',
                          }}
                        />
                        {/* Corner brackets */}
                        <div className="relative" style={{ width: 220, height: 220 }}>
                          <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-rose-500 rounded-tl-xl" />
                          <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-rose-500 rounded-tr-xl" />
                          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-rose-500 rounded-bl-xl" />
                          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-rose-500 rounded-br-xl" />
                          <span className="absolute left-3 right-3 h-0.5 bg-rose-400/80 rounded-full scanline" />
                        </div>
                      </div>
                    )}

                    {/* Camera error */}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/98 text-white text-center px-6 gap-4">
                        <XCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
                        <p className="text-sm font-medium leading-snug">{cameraError}</p>
                        <button
                          onClick={startCamera}
                          className="flex items-center gap-2 bg-rose-500 text-white rounded-full px-5 py-2.5 text-xs font-bold"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Try again
                        </button>
                      </div>
                    )}

                    {/* Pre-start */}
                    {!cameraActive && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white gap-5">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                          <Camera className="h-10 w-10 text-neutral-400" strokeWidth={1.5} />
                        </div>
                        <div className="text-center px-6">
                          <p className="text-sm font-bold mb-1">Camera not started</p>
                          <p className="text-xs text-neutral-400">Tap below to enable your camera</p>
                        </div>
                        <button
                          onClick={startCamera}
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6 py-3 text-sm font-bold shadow-xl"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption */}
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-neutral-400">
                    {cameraActive ? 'Hold QR code inside the frame' : 'Tap to start'}
                  </p>
                </div>
              </div>

              {/* Active indicator */}
              {cameraActive && (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Scanner active — waiting for QR code
                </div>
              )}
            </div>
          </div>

          {/* Manual entry tab */}
          <div className={tab === 'manual' ? 'flex flex-col flex-1' : 'hidden'}>
            <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-24 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-1">Enter Ticket Code</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Type the ticket ID shown below the QR code on the pass.
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. TKT-105-31"
                      className="w-full pl-10 pr-4 py-4 bg-neutral-50 dark:bg-gray-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full py-4 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-md disabled:opacity-40 transition-all active:scale-[0.98]"
                  >
                    Verify Ticket
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .scanline {
          top: 10%;
          animation: scanline 2s ease-in-out infinite;
        }
        @keyframes scanline {
          0%   { top: 8%;  }
          50%  { top: 86%; }
          100% { top: 8%;  }
        }
        /* Strip html5-qrcode's injected chrome */
        #${SCANNER_DIV_ID} > img,
        #${SCANNER_DIV_ID} button,
        #${SCANNER_DIV_ID} select,
        #${SCANNER_DIV_ID} span[id*="status"],
        #${SCANNER_DIV_ID} div[id*="header"],
        #${SCANNER_DIV_ID} div[id*="dashboard"],
        #${SCANNER_DIV_ID} div[id*="anchor"] {
          display: none !important;
        }
        #${SCANNER_DIV_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
};

export default TicketScanner;
