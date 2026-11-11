'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth as useAuthHook } from '@/hooks/use-auth';

/**
 * Root Authentication & Security Provider (100% Supabase Auth Powered).
 * Monitors Supabase session state and enforces institutional security protocols,
 * including a 10-minute inactivity guard and role-based routing.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setAuth, clearAuth, isLoading, setLoading, user, role } = useAuthStore();
  const { logout } = useAuthHook();

  // 1. Core Supabase Auth State Listener
  useEffect(() => {
    let isMounted = true;

    async function syncSession(session: any) {
      if (!isMounted) return;
      if (session?.user) {
        const email = session.user.email?.toLowerCase();
        
        // Priority: Admin check
        if (email === 'admin@tss.com') {
          setAuth(session.user, 'admin', FIXED_SCHOOL_ID, {
            name: session.user.user_metadata?.name || 'Administrator',
            photoURL: session.user.user_metadata?.photoURL || null
          });
          setLoading(false);
          return;
        }

        // Query user role & profile directly from Supabase users table
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (profile) {
            setAuth(session.user, (profile.role as any) || 'teacher', FIXED_SCHOOL_ID, {
              name: profile.name,
              photoURL: profile.photo_url
            });
          } else {
            const fallbackRole = session.user.user_metadata?.role || 'teacher';
            setAuth(session.user, fallbackRole as any, FIXED_SCHOOL_ID, {
              name: session.user.user_metadata?.name,
              photoURL: session.user.user_metadata?.photoURL
            });
          }
        } catch (err) {
          console.warn('Profile fetch warning in Supabase AuthProvider:', err);
          setAuth(session.user, 'teacher', FIXED_SCHOOL_ID);
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    // Realtime auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, setLoading]);

  // 2. 10-Minute Inactivity Logout Guard
  useEffect(() => {
    if (!user) return;

    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        console.log("Inactivity detected. Terminating session for security.");
        logout();
      }, 10 * 60 * 1000);
    };

    const activityEvents = [
      'mousedown', 
      'mousemove', 
      'keydown', 
      'scroll', 
      'touchstart', 
      'click'
    ];

    resetInactivityTimer();
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user, logout]);

  // 3. Institutional Access Control Matrix (Role-based Routing)
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/login', '/results'];
    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }

    if (user && isPublicRoute && pathname === '/login') {
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'teacher' || role === 'coordinator') router.push('/teacher/dashboard');
    }

    if (user && role === 'teacher' && pathname?.startsWith('/admin')) {
      router.push('/teacher/dashboard');
    }
  }, [user, role, isLoading, pathname, router]);

  return <>{children}</>;
}
