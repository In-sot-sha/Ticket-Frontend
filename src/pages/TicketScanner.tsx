import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, AlertTriangle, Scan, Search, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TicketScanner = () => {
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const navigate = useNavigate();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize Scanner when component mounts
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const onScanSuccess = (decodedText: string) => {
    if (status !== 'loading') {
      handleVerification(decodedText);
      // Pause scanner briefly to prevent multiple rapid scans
      if (scannerRef.current) {
         scannerRef.current.pause(true);
         setTimeout(() => {
            if (scannerRef.current) scannerRef.current.resume();
         }, 3000);
      }
    }
  };

  const onScanFailure = (error: any) => {
    // Usually silent errors like "no QR code found" - we don't need to alert on every frame
    // console.warn(error);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleVerification(manualCode.trim());
    }
  };

  const handleVerification = async (code: string) => {
    setStatus('loading');
    setMessage('');
    setTicketData(null);

    try {
      // Call the existing backend validate endpoint
      const response = await api.tickets.validate(code);
      setStatus('success');
      setMessage(response.data.message || 'Ticket Validated & Checked-in');
      setTicketData(response.data.ticket);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Invalid Ticket');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm hover:shadow-md transition-shadow text-neutral-600 dark:text-neutral-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <Scan className="h-6 w-6 text-rose-500" />
              Ticket Scanner
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Scan QR codes at the gate or manually enter ticket IDs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Camera Scan</h2>
              
              {/* This div is where html5-qrcode will render the camera UI */}
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-gray-800"></div>
              
              <p className="text-xs text-neutral-500 text-center mt-3">
                Hold the QR code steady within the frame.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Manual Entry</h2>
              <form onSubmit={handleManualSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter Ticket ID..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-gray-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading' || !manualCode.trim()}
                  className="w-full mt-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {status === 'loading' ? 'Verifying...' : 'Verify Ticket'}
                </button>
              </form>
            </div>
          </div>

          {/* Result Section */}
          <div>
            <div className={`p-6 rounded-3xl border-2 transition-all duration-300 h-full flex flex-col items-center justify-center text-center ${
              status === 'success' 
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50' 
                : status === 'error'
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
                  : 'bg-white border-neutral-200 dark:bg-gray-900 dark:border-neutral-800'
            }`}>
              
              {status === 'idle' && (
                <div className="text-neutral-400 dark:text-neutral-600 flex flex-col items-center">
                  <Scan className="h-16 w-16 mb-4 opacity-50" />
                  <p className="font-medium">Waiting for scan...</p>
                </div>
              )}

              {status === 'loading' && (
                <div className="text-neutral-600 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent mb-4"></div>
                  <p className="font-bold">Verifying Ticket...</p>
                </div>
              )}

              {status === 'success' && ticketData && (
                <div className="text-emerald-700 dark:text-emerald-400 flex flex-col items-center w-full">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-1">Access Granted</h3>
                  <p className="text-sm font-medium mb-6 opacity-80">{message}</p>
                  
                  <div className="w-full bg-white/60 dark:bg-black/20 rounded-2xl p-4 text-left border border-emerald-100/50 dark:border-emerald-900/30">
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Attendee</p>
                    <p className="font-bold text-neutral-900 dark:text-white mb-3">
                      {ticketData.user?.firstName} {ticketData.user?.lastName}
                    </p>
                    
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Event</p>
                    <p className="font-bold text-neutral-900 dark:text-white mb-3">
                      {ticketData.event?.title}
                    </p>
                    
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Ticket ID</p>
                    <p className="font-mono text-sm text-neutral-900 dark:text-white">
                      #{ticketData.id}
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="text-red-700 dark:text-red-400 flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-1">Access Denied</h3>
                  <p className="font-bold">{message}</p>
                  <p className="text-xs mt-2 opacity-80">Please check the code and try again.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketScanner;
