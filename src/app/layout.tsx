import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ThemeProvider } from '@/components/theme-provider';
import { DynamicFavicon } from '@/components/common/DynamicFavicon';

/**
 * Root Layout Protocol.
 * Implements high-fidelity SEO and PWA metadata for The Spirit School Samundri.
 * Optimized for installation on iOS and Android with custom branding icons.
 */
export const metadata: Metadata = {
  title: 'The Spirit School Samundri | Management Portal',
  description: 'Elite-grade school management system for The Spirit School Samundri.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: 'https://i.postimg.cc/Ss1VdxdT/android-launchericon-192-192.png',
    apple: 'https://i.postimg.cc/dVc64XRY/android-launchericon-512-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TSSS Portal',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1B62DE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-inter antialiased bg-background text-foreground selection:bg-primary-600/20">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <DynamicFavicon />
            <OfflineBanner />
            <div className="min-h-svh flex flex-col overflow-x-hidden">
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
