'use client';

import { useEffect } from 'react';
import { useSchoolStore } from '@/store/use-school-store';

/**
 * Dynamic Favicon Injector.
 * Synchronizes the browser's tab icon and PWA touch icons with the school's uploaded assets.
 */
export function DynamicFavicon() {
  const settings = useSchoolStore((state) => state.settings);
  const faviconUrl = settings?.profile?.faviconURL || settings?.profile?.logoURL;

  useEffect(() => {
    if (faviconUrl) {
      // 1. Standard Favicon
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;

      // 2. Apple Touch Icon (iOS PWA)
      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
      }
      appleLink.href = faviconUrl;
      
      // 3. Manifest Shortcut Icon
      let shortcutLink: HTMLLinkElement | null = document.querySelector("link[rel='shortcut icon']");
      if (shortcutLink) {
        shortcutLink.href = faviconUrl;
      }
    }
  }, [faviconUrl]);

  return null;
}