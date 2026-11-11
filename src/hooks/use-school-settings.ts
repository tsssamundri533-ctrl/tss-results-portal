'use client';

import { useEffect } from 'react';
import { useSchoolStore } from '@/store/use-school-store';
import { getSchoolSettings } from '@/lib/supabase-service';

/**
 * Accelerated Institutional Configuration Engine (Supabase Powered).
 * Fetches settings, branding, classes, and grading scales from Supabase.
 */
export function useSchoolSettings() {
  const { setSettings, setLoading } = useSchoolStore();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const settings = await getSchoolSettings();
        if (isMounted && settings) {
          setSettings(settings);
        }
      } catch (err) {
        console.error('Failed to load school settings from Supabase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [setSettings, setLoading]);
}
