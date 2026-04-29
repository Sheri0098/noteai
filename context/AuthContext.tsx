import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (mounted) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const authListener =
      supabase?.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (sessionStorage.getItem('is_password_reset') === 'true') return;
        if (_event === 'PASSWORD_RECOVERY') return;
        if (!session?.user) {
          setUser(null);
          return;
        }
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        // Ensure a subscription row exists for OAuth users (Google sign-in bypasses signup flow)
        if (_event === 'SIGNED_IN') {
          await supabase
            ?.from('subscriptions')
            .upsert(
              {
                user_id: session.user.id,
                plan: 'Free',
                used_minutes: 0,
                limit_minutes: 120,
              },
              { onConflict: 'user_id', ignoreDuplicates: true }
            );
        }
      }) || null;

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        try {
          const nextUser = await authService.login(email, password);
          setUser(nextUser);
        } catch (error) {
          throw error;
        }
      },
      async signup(email, password) {
        const result = await authService.signup(email, password);
        if (!result.needsConfirmation) {
          setUser(result.user);
        }
        return { needsConfirmation: result.needsConfirmation };
      },
      async signInWithGoogle() {
        await authService.signInWithGoogle();
      },
      async forgotPassword(email) {
        await authService.forgotPassword(email);
      },
      async resetPassword(newPassword) {
        await authService.resetPassword(newPassword);
      },
      async logout() {
        setUser(null);
        await authService.logout();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
