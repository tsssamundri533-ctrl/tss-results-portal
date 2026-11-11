
import { MetadataRoute } from 'next';

/**
 * Institutional PWA Manifest Generator.
 * Configures the application for native-like installation on mobile devices.
 * Synchronized with the high-resolution TSSS identity suite.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Spirit School Samundri',
    short_name: 'TSSS Portal',
    description: 'Elite-grade Institutional Management Portal for The Spirit School Samundri.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EEF3FA',
    theme_color: '#1B62DE',
    icons: [
      {
        src: 'https://i.postimg.cc/Ss1VdxdT/android-launchericon-192-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://i.postimg.cc/Ss1VdxdT/android-launchericon-192-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'https://i.postimg.cc/dVc64XRY/android-launchericon-512-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
