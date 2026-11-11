'use client';

import React from 'react';
import { CircleCheckBig, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SyncStatusBadge() {
  const isOnline = useOnlineStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
              isOnline ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" : "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
            )}
          >
            {isOnline ? (
              <CircleCheckBig className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isOnline ? 'Cloud Synced' : 'Offline'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] font-medium bg-white dark:bg-navy-900 text-slate-900 dark:text-white border shadow-xl">
          {isOnline 
            ? 'Your database is fully synchronized with Supabase Cloud.' 
            : 'Working offline. Changes will connect once network is restored.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
