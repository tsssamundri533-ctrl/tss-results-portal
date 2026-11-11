
'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineStore } from '@/store/offlineStore';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount } = useOfflineStore();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white py-2.5 px-4 shadow-lg"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5" />
              <p className="text-xs sm:text-sm font-semibold">You are offline — changes will sync automatically</p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                {pendingCount} Changes Queued
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
