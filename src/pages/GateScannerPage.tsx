import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle,
  AlertTriangle,
  Search,
  Camera,
  XCircle,
  RefreshCw,
  User,
  CalendarDays,
  Hash,
  Loader2,
  MapPin,
  LogOut,
  ShieldCheck,
  Ticket,
  Clock,
  Delete,
} from 'lucide-react';
import { api } from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScanStatus = 'idle' | 'scanning' | 'loading' | 'success' | 'error';
type PageState  = 'pin-entry' | 'scanner';

const SCANNER_DIV_ID = 'gate-qr-region';
const SESSION_KEY    = 'gate_active_session';

// ── Pin Entry screen ──────────────────────────────────────────────────────────

const PinEntry: React.FC<{ onUnlock: (name: string) => void }> = ({ onUnlock }) => {
  const [digits,    setDigits]    = useState<string[]>(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');
  const inputRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const hasSubmitted = useRef(false); // prevent re-fire after error clears digits

  const pin    = digits.join('');
  const filled = digits.filter(Boolean).length;

  // ── Handle single digit input ──────────────────────────────────────────────
  const handleDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    setError('');
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  };

  // ── Handle paste — distribute digits across boxes ─────────────────────────
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    // Focus the box after the last pasted digit (or last box)
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 10);
  };

  // ── Backspace navigation ───────────────────────────────────────────────────
  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = '';
      setDigits(next);
      inputRefs.current[i - 1]?.focus();
    }
  };

  const clearAll = () => {
    setDigits(['', '', '', '', '', '']);
    setError('');
    hasSubmitted.current = false;
    inputRefs.current[0]?.focus();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async (pinValue: string) => {
    if (pinValue.length !== 6 || verifying) return;
    hasSubmitted.current = true;
    setVerifying(true); setError('');
    try {
      const res = await api.gatePins.verify(pinValue);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ pin: pinValue, name: res.data.staffName }));
      onUnlock(res.data.staffName);
    } catch (e: any) {
      // Show error WITHOUT clearing digits so the user can see and edit what they typed
      setError(e?.response?.data?.message ?? 'Invalid PIN. Check the code and try again.');
      hasSubmitted.current = false; // allow retry after editing
    } finally {
      setVerifying(false);
    }
  }, [verifying, onUnlock]);

  // Auto-submit only when all 6 are filled AND we haven't already tried this exact pin
  useEffect(() => {
    if (pin.length === 6 && !verifying && !hasSubmitted.current) {
      submit(pin);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Focus first input on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  return (
    <div className="h-[calc(100svh-100px)] bg-white dark:bg-neutral-950 flex flex-col">
      {/* Top brand bar */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center">
            <Ticket className="h-4 w-4 text-white" />
          </div>
          <span className="text-rose-500 font-extrabold text-lg tracking-tight">partystorm</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-xs">
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mb-5 shadow-sm">
              <Ticket className="h-10 w-10 text-rose-500" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white text-center">Gate Access</h1>
            <p className="text-sm text-neutral-500 mt-1.5 text-center leading-snug">
              Enter the 6-digit PIN given to you by the event organiser
            </p>
          </div>

          {/* 6-box PIN input — paste on any box distributes all 6 digits */}
          <div className="flex justify-center gap-3 mb-5">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={e => e.target.select()}
                className={`w-12 h-14 text-center text-2xl font-extrabold rounded-2xl border-2 transition-all focus:outline-none ${
                  error && filled > 0
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                    : d
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:border-rose-400'
                }`}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {digits.map((d, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${d ? 'w-6 bg-rose-500' : 'w-3 bg-neutral-200 dark:bg-neutral-700'}`} />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-4 py-3 rounded-2xl mb-4">
              <XCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={clearAll}
              disabled={filled === 0 || verifying}
              className="flex-1 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-500 disabled:opacity-30 flex items-center justify-center gap-2 transition-colors hover:border-rose-300 hover:text-rose-500"
            >
              <Delete className="h-4 w-4" /> Clear
            </button>
            <button
              onClick={() => submit(pin)}
              disabled={filled < 6 || verifying}
              className="flex-1 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
            >
              {verifying
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                : <><ShieldCheck className="h-4 w-4" /> Unlock</>}
            </button>
          </div>

          <p className="text-center text-[11px] text-neutral-400 mt-6">
            This page is only for authorised gate staff.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Gate scanner UI ───────────────────────────────────────────────────────────

const GateScanner: React.FC<{ staffName: string; onLogout: () => void }> = ({
  staffName,
  onLogout,
}) => {
  const [scanStatus,   setScanStatus]   = useState<ScanStatus>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState<string | null>(null);
  const [message,      setMessage]      = useState('');
  const [ticketData,   setTicketData]   = useState<any>(null);
  const [manualCode,   setManualCode]   = useState('');
  const [tab,          setTab]          = useState<'camera' | 'manual'>('camera');
  const [scanCount,    setScanCount]    = useState(0);

  const scannerRef     = useRef<Html5Qrcode | null>(null);
  const isVerifyingRef = useRef(false);
  const handleVerifRef = useRef<(code: string) => void>(() => {});

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerification = useCallback(async (code: string) => {
    if (scannerRef.current) {
      try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* swallow */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setScanStatus('loading');
    setMessage('');
    setTicketData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await api.tickets.validate(code);
      setScanStatus('success');
      setMessage(res.data.message || 'Ticket validated — entry approved');
      setTicketData(res.data.ticket);
      setScanCount(c => c + 1);
    } catch (err: any) {
      setScanStatus('error');
      const serverMsg:    string = err?.response?.data?.message ?? '';
      const serverStatus: string = err?.response?.data?.status  ?? '';
      const httpStatus:   number = err?.response?.status        ?? 0;

      let displayMessage: string;
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
        displayMessage = 'Network error — check WiFi and try again.';
      } else if (serverStatus === 'USED' || /already.*used|already.*scanned|not valid/i.test(serverMsg)) {
        displayMessage = 'This ticket has already been scanned. Entry not permitted.';
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
        displayMessage = 'Verification failed. Try again or contact the organiser.';
      }
      setMessage(displayMessage);
    } finally { isVerifyingRef.current = false; }
  }, []);

  useEffect(() => { handleVerifRef.current = handleVerification; }, [handleVerification]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* swallow */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

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
        (decoded) => { if (!isVerifyingRef.current) { isVerifyingRef.current = true; handleVerifRef.current(decoded); } },
        () => { /* per-frame failures are normal */ },
      );
      setScanStatus('scanning');
      setCameraActive(true);
    } catch (err: any) {
      scannerRef.current = null;
      const raw = err?.message ?? '';
      setCameraError(
        /[Pp]ermission|[Dd]enied/.test(raw) ? 'Camera access denied. Allow it in browser settings.' :
        /[Nn]ot[Ff]ound|device not found/.test(raw) ? 'No camera found on this device.' :
        /[Hh][Tt][Tt][Pp][Ss]|[Ss]ecure/.test(raw) ? 'HTTPS required for camera. Open this page over https://.' :
        `Could not start camera: ${raw}`
      );
      setScanStatus('idle'); setCameraActive(false);
    }
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (tab === 'camera' && !['success','error','loading'].includes(scanStatus)) {
      const t = setTimeout(() => startCamera(), 100);
      return () => clearTimeout(t);
    } else if (tab !== 'camera') {
      stopCamera().then(() => { if (!['success','error'].includes(scanStatus)) setScanStatus('idle'); });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const resetScanner = () => {
    setScanStatus('idle'); setMessage(''); setTicketData(null); setManualCode('');
    isVerifyingRef.current = false;
    if (tab === 'camera') setTimeout(() => startCamera(), 100);
  };

  // Derive title/colour for error screen
  const errorMeta = (() => {
    if (/already.*scanned|already.*used/i.test(message))  return { title: 'Already Used',      bg: 'bg-amber-100 dark:bg-amber-900/30',   icon: 'text-amber-500',             heading: 'text-amber-600 dark:text-amber-400' };
    if (/cancel/i.test(message))                           return { title: 'Ticket Cancelled',   bg: 'bg-neutral-100 dark:bg-neutral-800',  icon: 'text-neutral-400',           heading: 'text-neutral-500' };
    if (/not started|too early/i.test(message))            return { title: 'Event Not Started',  bg: 'bg-blue-100 dark:bg-blue-900/30',     icon: 'text-blue-500',              heading: 'text-blue-600 dark:text-blue-400' };
    if (/ended/i.test(message))                            return { title: 'Event Ended',        bg: 'bg-neutral-100 dark:bg-neutral-800',  icon: 'text-neutral-400',           heading: 'text-neutral-500' };
    if (/not recognised|does not exist/i.test(message))    return { title: 'Not Found',          bg: 'bg-red-100 dark:bg-red-900/30',       icon: 'text-red-500 dark:text-red-400', heading: 'text-red-700 dark:text-red-400' };
    return                                                         { title: 'Access Denied',     bg: 'bg-red-100 dark:bg-red-900/30',       icon: 'text-red-500 dark:text-red-400', heading: 'text-red-700 dark:text-red-400' };
  })();

  const showResult = scanStatus === 'loading' || scanStatus === 'success' || scanStatus === 'error';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-neutral-100 dark:border-neutral-900 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-rose-500 flex items-center justify-center">
              <Ticket className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-rose-500 font-extrabold text-sm tracking-tight hidden sm:block">partystorm</span>
          </div>
          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-neutral-900 dark:text-white truncate leading-none">{staffName}</p>
              <p className="text-[10px] text-neutral-500 leading-none mt-0.5">{scanCount} scanned</p>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-red-500 transition-colors shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" /> Exit
        </button>
      </div>

      {/* Camera error banner */}
      {cameraError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/40 px-4 py-3 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="flex-1 text-xs font-bold text-red-700 dark:text-red-400 break-words">{cameraError}</p>
          <button onClick={startCamera} className="shrink-0 text-[11px] font-bold text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Result screen */}
      {showResult && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 pb-12">
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
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">Access Granted</h2>
                <p className="text-xs text-emerald-600/80 mt-1">{message}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm mb-5 divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  { icon: <User className="h-4 w-4 text-rose-500" />,        label: 'Name',      value: `${ticketData.user?.firstName ?? ''} ${ticketData.user?.lastName ?? ''}`.trim() || '—' },
                  { icon: <CalendarDays className="h-4 w-4 text-rose-500" />, label: 'Event',     value: ticketData.event?.title ?? '—' },
                  ...(ticketData.event?.location ? [{ icon: <MapPin className="h-4 w-4 text-rose-500" />,  label: 'Location', value: ticketData.event.location }] : []),
                  { icon: <Hash className="h-4 w-4 text-rose-500" />,         label: 'Ticket ID', value: `#${ticketData.id}` },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">{row.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">{row.label}</p>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={resetScanner} className="w-full py-4 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" /> Scan Next Ticket
              </button>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="w-full max-w-sm flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${errorMeta.bg}`}>
                {/not started|too early/i.test(message)
                  ? <Clock className={`h-12 w-12 ${errorMeta.icon}`} strokeWidth={1.75} />
                  : <AlertTriangle className={`h-12 w-12 ${errorMeta.icon}`} strokeWidth={1.75} />}
              </div>
              <h2 className={`text-2xl font-extrabold mb-2 ${errorMeta.heading}`}>{errorMeta.title}</h2>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 text-center mb-1 leading-snug font-medium">{message}</p>
              <button onClick={resetScanner} className="mt-8 w-full py-4 rounded-2xl text-sm font-extrabold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" /> Scan Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera + Manual tabs */}
      {!showResult && (
        <>
          <div className="flex bg-white dark:bg-gray-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
            {(['camera', 'manual'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-colors ${tab === t ? 'border-rose-500 text-rose-500' : 'border-transparent text-neutral-400'}`}
              >
                {t === 'camera'
                  ? <span className="flex items-center justify-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Camera</span>
                  : <span className="flex items-center justify-center gap-1.5"><Search className="h-3.5 w-3.5" /> Manual</span>}
              </button>
            ))}
          </div>

          {/* Camera — MUST stay in DOM */}
          <div className={tab === 'camera' ? 'flex flex-col flex-1' : 'hidden'}>
            <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-4 pb-12 gap-4">
              <div className="bg-black rounded-3xl overflow-hidden shadow-lg relative">
                <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                  <div className="absolute inset-0">
                    <div id={SCANNER_DIV_ID} className="w-full h-full" />
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50" style={{ clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,calc(50% - 110px) calc(50% - 110px),calc(50% - 110px) calc(50% + 110px),calc(50% + 110px) calc(50% + 110px),calc(50% + 110px) calc(50% - 110px),calc(50% - 110px) calc(50% - 110px))' }} />
                        <div className="relative" style={{ width: 220, height: 220 }}>
                          <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-rose-500 rounded-tl-xl" />
                          <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-rose-500 rounded-tr-xl" />
                          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-rose-500 rounded-bl-xl" />
                          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-rose-500 rounded-br-xl" />
                          <span className="absolute left-3 right-3 h-0.5 bg-rose-400/80 rounded-full gate-scanline" />
                        </div>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/98 text-white text-center px-6 gap-4">
                        <XCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
                        <p className="text-sm font-medium leading-snug">{cameraError}</p>
                        <button onClick={startCamera} className="flex items-center gap-2 bg-rose-500 text-white rounded-full px-5 py-2.5 text-xs font-bold"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
                      </div>
                    )}
                    {!cameraActive && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white gap-5">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                          <Camera className="h-10 w-10 text-neutral-400" strokeWidth={1.5} />
                        </div>
                        <button onClick={startCamera} className="bg-rose-500 text-white rounded-full px-6 py-3 text-sm font-bold shadow-xl">Enable Camera</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-neutral-400">{cameraActive ? 'Hold QR code inside the frame' : 'Tap to start'}</p>
                </div>
              </div>
              {cameraActive && (
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Scanner active
                </div>
              )}
            </div>
          </div>

          {/* Manual */}
          <div className={tab === 'manual' ? 'flex flex-col flex-1' : 'hidden'}>
            <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-12 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-1">Enter Ticket Code</h3>
                <p className="text-xs text-neutral-500 mb-4">Type the ticket ID shown below the QR code.</p>
                <form onSubmit={e => { e.preventDefault(); const code = manualCode.trim(); if (code && !isVerifyingRef.current) { isVerifyingRef.current = true; handleVerification(code); }}} className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input type="text" value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. TKT-105-31"
                      className="w-full pl-10 pr-4 py-4 bg-neutral-50 dark:bg-gray-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      autoCapitalize="characters" autoCorrect="off" spellCheck={false} />
                  </div>
                  <button type="submit" disabled={!manualCode.trim()} className="w-full py-4 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-md disabled:opacity-40 transition-all active:scale-[0.98]">
                    Verify Ticket
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .gate-scanline { top: 10%; animation: gscan 2s ease-in-out infinite; }
        @keyframes gscan { 0% { top: 8%; } 50% { top: 86%; } 100% { top: 8%; } }
        #${SCANNER_DIV_ID} > img, #${SCANNER_DIV_ID} button, #${SCANNER_DIV_ID} select,
        #${SCANNER_DIV_ID} span[id*="status"], #${SCANNER_DIV_ID} div[id*="header"],
        #${SCANNER_DIV_ID} div[id*="dashboard"], #${SCANNER_DIV_ID} div[id*="anchor"] { display: none !important; }
        #${SCANNER_DIV_ID} video { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
      `}</style>
    </div>
  );
};

// ── Page wrapper ──────────────────────────────────────────────────────────────

const GateScannerPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? 'scanner' : 'pin-entry';
  });
  const [staffName, setStaffName] = useState<string>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}').name ?? ''; } catch { return ''; }
  });

  const handleUnlock = (name: string) => { setStaffName(name); setPageState('scanner'); };
  const handleLogout = () => { sessionStorage.removeItem(SESSION_KEY); setPageState('pin-entry'); setStaffName(''); };

  if (pageState === 'pin-entry') return <PinEntry onUnlock={handleUnlock} />;
  return <GateScanner staffName={staffName} onLogout={handleLogout} />;
};

export default GateScannerPage;
