import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineBadge component
 * Shows a visual indicator at the top of the app when PWA is offline
 * Automatically detected via navigator.onLine
 */
const OfflineBadge: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOffline(!navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-xs sm:text-sm font-semibold">You are offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBadge;
