'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, FIXED_SCHOOL_ID } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';

/**
 * Institutional Authentication Hook (100% Supabase Auth Powered).
 * Manages secure login, role verification, and session termination.
 */
export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();
  const [error, setSearchError] = useState<string | null>(null);

  const login = async (email: string, pass: string) => {
    setSearchError(null);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass.trim(),
      });

      if (authError || !data?.user) {
        setSearchError('Invalid email or password. Please verify credentials.');
        return;
      }

      const user = data.user;

      // PRIORITY: Primary Admin Access
      if (cleanEmail === 'admin@tss.com') {
        setAuth(user, 'admin', FIXED_SCHOOL_ID, {
          name: user.user_metadata?.name || 'Administrator',
          photoURL: user.user_metadata?.photoURL || null
        });
        router.push('/admin/dashboard');
        return;
      }

      // Query staff registry in Supabase
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      const userRole = (profile?.role as any) || user.user_metadata?.role || 'teacher';
      const userName = profile?.name || user.user_metadata?.name || cleanEmail.split('@')[0];
      const photoURL = profile?.photo_url || user.user_metadata?.photoURL || null;

      setAuth(user, userRole, FIXED_SCHOOL_ID, {
        name: userName,
        photoURL
      });

      router.push(userRole === 'admin' ? '/admin/dashboard' : '/teacher/dashboard');
    } catch (err: any) {
      console.error('Supabase Login error:', err);
      setSearchError('A connection error occurred. Please try again.');
    }
  };

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAuth();
      router.push('/login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [clearAuth, router]);

  return { login, logout, error };
}
