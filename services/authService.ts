/*
 * SUPABASE DASHBOARD SETUP REQUIRED:
 * 1. Go to Supabase -> Authentication -> URL Configuration
 * 2. Set Site URL to: http://localhost:3000
 * 3. Add to Redirect URLs: http://localhost:3000/#/reset-password
 * 4. Go to Authentication -> Settings -> enable "Confirm email"
 * Without step 3, the reset password link in the email will not work.
 */

import { supabase } from '../lib/supabase';
import { AuthUser, SignupResult } from '../types';
import { createUserProfile } from '../utils/userProfile';
import { isSupabaseConfigured } from '../lib/config';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'spam4.me',
  'trashmail.com',
  'trashmail.at',
  'trashmail.io',
  'trashmail.me',
  'trashmail.net',
  'dispostable.com',
  'mailnull.com',
  'spamgourmet.com',
  'maildrop.cc',
  'discard.email',
  'fakeinbox.com',
  'temp-mail.org',
  'getnada.com',
  'mohmal.com',
  '10minutemail.com',
  '10minutemail.net',
  '10mail.org',
  'minutemail.com',
  'tempinbox.com',
  'throwam.com',
  'spamherelots.com',
  'mailnesia.com',
  'mailscrap.com',
  'spamfree24.org',
]);

const ensureAuthConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
};

const toAuthUser = (id: string, email: string): AuthUser => ({
  id,
  email,
  profile: createUserProfile(email),
});

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isEmailFormatValid = (email: string): boolean => EMAIL_REGEX.test(email);

export const isDisposableEmail = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  const domain = normalized.split('@')[1];
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      profile: createUserProfile(data.user.email || ''),
    };
  },

  async login(email: string, password: string): Promise<AuthUser> {
    ensureAuthConfigured();
    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error || !data.user) {
      const raw = (error?.message || '').toLowerCase();
      if (raw.includes('email not confirmed')) {
        throw new Error('Please confirm your email first. Check your inbox for the confirmation link.');
      }
      throw new Error('Incorrect email or password.');
    }

    return toAuthUser(data.user.id, data.user.email || normalizedEmail);
  },

  async signup(email: string, password: string): Promise<SignupResult> {
    ensureAuthConfigured();
    const normalizedEmail = normalizeEmail(email);

    if (!isEmailFormatValid(normalizedEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (isDisposableEmail(normalizedEmail)) {
      throw new Error(
        'Please use a valid work or personal email address. Disposable email addresses are not allowed.'
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });
    if (error || !data.user) {
      const raw = (error?.message || '').toLowerCase();
      if (raw.includes('already registered') || raw.includes('already exists') || raw.includes('user already')) {
        throw new Error('An account with this email already exists. Please log in instead.');
      }
      throw new Error('Unable to create your account right now. Please try again.');
    }

    await supabase.from('subscriptions').upsert(
      {
        user_id: data.user.id,
        plan: 'Free',
        used_minutes: 0,
        limit_minutes: 120,
      },
      { onConflict: 'user_id' }
    );

    const resolvedEmail = data.user.email || normalizedEmail;
    return {
      user: toAuthUser(data.user.id, resolvedEmail),
      needsConfirmation: !data.session,
    };
  },

  async signInWithGoogle(): Promise<void> {
    ensureAuthConfigured();

    const redirectTo = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      throw new Error('Google sign-in failed. Please try again.');
    }
  },

  async logout(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.auth.signOut();
  },

  async resendConfirmationEmail(email: string): Promise<void> {
    ensureAuthConfigured();
    const normalizedEmail = normalizeEmail(email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });
    if (error) {
      throw new Error('Unable to resend confirmation email. Please try again.');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    ensureAuthConfigured();
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  async resetPassword(newPassword: string): Promise<void> {
    ensureAuthConfigured();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
  },
};
