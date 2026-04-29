import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const LOGIN_ATTEMPTS_KEY = 'noteai_login_attempts';
const LOGIN_LOCKOUT_KEY = 'noteai_login_lockout_until';
const FORGOT_RESEND_SECONDS = 60;
const CONFIRM_RESEND_SECONDS = 60;
const emailFormatRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const formatCountdown = (seconds: number): string => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeForm, setShakeForm] = useState(false);
  const [showForgotPanel, setShowForgotPanel] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [confirmCooldown, setConfirmCooldown] = useState(0);
  const [isResendingConfirm, setIsResendingConfirm] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => Number(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || 0));
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => Number(localStorage.getItem(LOGIN_LOCKOUT_KEY) || 0));
  const [now, setNow] = useState(Date.now());

  const normalizedEmail = email.trim().toLowerCase();
  const isLockedOut = lockoutUntil > now;
  const lockoutSeconds = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
  const canSubmit = !isLoading && !isLockedOut;
  const isUnconfirmedMessage = useMemo(
    () => errorMessage === 'Please confirm your email first. Check your inbox for the confirmation link.',
    [errorMessage]
  );

  useEffect(() => {
    if (!isLockedOut && failedAttempts >= MAX_ATTEMPTS) {
      setFailedAttempts(0);
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
      localStorage.removeItem(LOGIN_LOCKOUT_KEY);
    }
  }, [failedAttempts, isLockedOut]);

  useEffect(() => {
    if (!isLockedOut) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLockedOut]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = window.setInterval(() => setForgotCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [forgotCooldown]);

  useEffect(() => {
    if (confirmCooldown <= 0) return;
    const timer = window.setInterval(() => setConfirmCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [confirmCooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMessage('');
    setShakeForm(false);
    setIsLoading(true);

    try {
      await login(normalizedEmail, password);
      setFailedAttempts(0);
      setLockoutUntil(0);
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
      localStorage.removeItem(LOGIN_LOCKOUT_KEY);
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Incorrect email or password.';
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(nextAttempts));

      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockoutUntil(until);
        setNow(Date.now());
        localStorage.setItem(LOGIN_LOCKOUT_KEY, String(until));
      }

      setErrorMessage(message);
      setShakeForm(true);
      window.setTimeout(() => setShakeForm(false), 420);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed.';
      setErrorMessage(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    setForgotMessage('');
    setForgotError('');
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!emailFormatRegex.test(targetEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    if (forgotCooldown > 0) return;

    setIsSendingReset(true);
    try {
      await authService.forgotPassword(targetEmail);
      setForgotMessage('Reset link sent! Check your inbox and spam folder.');
      setForgotCooldown(FORGOT_RESEND_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset link. Please try again.';
      setForgotError(message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (confirmCooldown > 0 || !emailFormatRegex.test(normalizedEmail)) return;
    setIsResendingConfirm(true);
    try {
      await authService.resendConfirmationEmail(normalizedEmail);
      setConfirmCooldown(CONFIRM_RESEND_SECONDS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to resend confirmation email. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsResendingConfirm(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-cyan-50 dark:from-primary/20 dark:to-cyan-900/20 flex items-center justify-center relative overflow-hidden">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm text-primary">
            <span className="material-symbols-outlined text-4xl">graphic_eq</span>
          </div>
        </div>

        <div className="px-8 pb-10 pt-6 flex flex-col">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-text-main dark:text-white text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-text-muted text-sm">AI-powered meeting notes from your audio recordings.</p>
          </div>

          {showForgotPanel ? (
            <div className="rounded-lg border border-border-light bg-background-light/80 p-3 dark:border-white/10 dark:bg-background-dark/50">
              <p className="text-sm text-text-main dark:text-white">Reset your password</p>
              <input
                className="mt-2 w-full rounded-lg bg-white dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 px-3"
                placeholder="name@work-email.com"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              {forgotError ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">{forgotError}</p> : null}
              {forgotMessage ? <p className="mt-1 text-xs text-green-700 dark:text-green-300">{forgotMessage}</p> : null}
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={isSendingReset || forgotCooldown > 0}
                className="mt-3 w-full rounded-lg h-10 bg-primary text-white text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSendingReset ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Sending...
                  </span>
                ) : forgotCooldown > 0 ? (
                  `Resend in ${forgotCooldown}s`
                ) : (
                  'Send reset link'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPanel(false)}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={`flex flex-col gap-5 ${shakeForm ? 'auth-shake' : ''}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-main dark:text-white text-sm font-medium">Email address</label>
                <input
                  name="email"
                  className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4"
                  placeholder="name@work-email.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-text-main dark:text-white text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPanel(true)}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  name="password"
                  className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4"
                  placeholder="Enter your password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  <p>{errorMessage}</p>
                  {isUnconfirmedMessage ? (
                    <button
                      type="button"
                      disabled={confirmCooldown > 0 || isResendingConfirm || !emailFormatRegex.test(normalizedEmail)}
                      onClick={handleResendConfirmation}
                      className="mt-1 text-xs font-semibold underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-70"
                    >
                      {confirmCooldown > 0
                        ? `Resend available in ${confirmCooldown}s`
                        : isResendingConfirm
                          ? 'Sending...'
                          : 'Resend confirmation email'}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isLockedOut ? (
                <p className="text-sm text-red-600 dark:text-red-300">
                  Too many attempts. Try again in {formatCountdown(lockoutSeconds)}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 w-full h-12 bg-primary hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  'Log in'
                )}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-surface-dark px-2 text-sm text-text-muted">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-light dark:border-white/10 h-12 bg-white dark:bg-transparent text-text-main dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-sm">
            <span className="text-text-muted">Don't have an account?</span>
            <button onClick={() => navigate('/signup')} className="font-medium text-primary hover:underline">
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;