
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Institutional Theme Toggle.
 * Allows administrators and teachers to select their preferred visual workspace.
 * Uses a mounted state check to prevent Next.js hydration errors.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Defer rendering until after hydration to prevent ID mismatches
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10 rounded-xl bg-surface-50 border border-surface-200 dark:bg-navy-950 dark:border-white/10 opacity-50 cursor-not-allowed"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500/50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-surface-50 border border-surface-200 dark:bg-navy-950 dark:border-white/10 shadow-sm transition-all active:scale-95">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-slate-100 dark:border-white/10 shadow-modal">
        <DropdownMenuItem onClick={() => setTheme('light')} className="font-bold cursor-pointer">
          Light Workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="font-bold cursor-pointer">
          Dark Workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="font-bold cursor-pointer">
          System Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
