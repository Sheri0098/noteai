import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { getPasswordChecks, getPasswordScore, getPasswordStrengthLabel } from '../utils/passwordValidation';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const SIGNUP_ATTEMPTS_KEY = 'noteai_signup_attempts';
const SIGNUP_LOCKOUT_KEY = 'noteai_signup_lockout_until';
const RESEND_SECONDS = 60;
const emailFormatRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const formatCountdown = (seconds: number): string => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
};

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<number>(() => Number(localStorage.getItem(SIGNUP_ATTEMPTS_KEY) || 0));
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => Number(localStorage.getItem(SIGNUP_LOCKOUT_KEY) || 0));
  const [now, setNow] = useState(Date.now());

  const normalizedEmail = email.trim().toLowerCase();
  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const score = useMemo(() => getPasswordScore(checks), [checks]);
  const strength = useMemo(() => getPasswordStrengthLabel(score), [score]);
  const strengthWidth = `${(score / 5) * 100}%`;
  const isPasswordValid = score === 5;
  const isConfirmValid = confirmPassword.length > 0 && password === confirmPassword;
  const isLockedOut = lockoutUntil > now;
  const lockoutSeconds = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
  const duplicateEmailError = errorMessage === 'An account with this email already exists. Please log in instead.';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isLockedOut) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLockedOut]);

  useEffect(() => {
    if (!confirmPassword || password === confirmPassword) {
      setConfirmPasswordError('');
      return;
    }
    setConfirmPasswordError('Passwords do not match.');
  }, [confirmPassword, password]);

  const validateEmail = (targetEmail: string): string => {
    if (!targetEmail) return 'Email is required.';
    if (!emailFormatRegex.test(targetEmail)) return 'Please enter a valid email address.';
    return '';
  };

  const onEmailBlur = () => {
    setEmailError(validateEmail(normalizedEmail));
  };

  const canSubmit =
    !isLoading &&
    !isLockedOut &&
    Boolean(fullName.trim()) &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    isPasswordValid &&
    isConfirmValid &&
    emailFormatRegex.test(normalizedEmail);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    const nextEmailError = validateEmail(normalizedEmail);
    setEmailError(nextEmailError);

    if (!isPasswordValid) {
      setPasswordError('Password does not meet all required rules.');
    } else {
      setPasswordError('');
    }

    if (!isConfirmValid) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }

    if (nextEmailError || !isPasswordValid || !isConfirmValid || !canSubmit) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(normalizedEmail, password);
      setFailedAttempts(0);
      setLockoutUntil(0);
      localStorage.setItem(SIGNUP_ATTEMPTS_KEY, '0');
      localStorage.removeItem(SIGNUP_LOCKOUT_KEY);

      if (result.needsConfirmation) {
        setConfirmationEmail(normalizedEmail);
        setResendMessage('');
        setResendCooldown(0);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create your account right now. Please try again.';
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem(SIGNUP_ATTEMPTS_KEY, String(nextAttempts));
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockoutUntil(until);
        setNow(Date.now());
        localStorage.setItem(SIGNUP_LOCKOUT_KEY, String(until));
      }
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google signup failed.';
      setErrorMessage(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || !confirmationEmail) return;
    setIsResending(true);
    try {
      await authService.resendConfirmationEmail(confirmationEmail);
      setResendMessage('Confirmation email sent again. Please check your inbox.');
      setResendCooldown(RESEND_SECONDS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend confirmation email. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  if (confirmationEmail) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden p-8 sm:p-10">
          <div className="text-center">
            <h1 className="text-text-main dark:text-white text-2xl font-bold mb-3">Confirm your email</h1>
            <p className="text-text-muted text-sm">
              Please check your email. We sent a confirmation link to <span className="font-semibold">{confirmationEmail}</span>. Click the
              link to activate your account.
            </p>
            {resendMessage ? <p className="mt-3 text-sm text-green-700 dark:text-green-300">{resendMessage}</p> : null}
            {errorMessage ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{errorMessage}</p> : null}
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendCooldown > 0 || isResending}
              className="mt-5 w-full rounded-lg h-11 bg-primary text-white font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend confirmation email (${resendCooldown}s)`
                : isResending
                  ? 'Sending...'
                  : 'Resend confirmation email'}
            </button>
            <button type="button" onClick={() => navigate('/login')} className="mt-3 text-sm text-primary hover:underline font-medium">
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-10 text-primary">
              <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            </div>
            <div className="text-center">
              <h1 className="text-text-main dark:text-white text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-text-muted text-sm">Start capturing better notes with AI assistance</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-white text-sm font-semibold">Full Name</span>
              <input
                className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 h-12 px-4"
                placeholder="Alex Morgan"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-white text-sm font-semibold">Email Address</span>
              <input
                name="email"
                className={`w-full rounded-lg bg-background-light dark:bg-background-dark border ${
                  emailError ? 'border-red-500' : 'border-border-light dark:border-border-dark'
                } focus:ring-2 focus:ring-primary/20 h-12 px-4`}
                placeholder="name@company.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={onEmailBlur}
                required
              />
              {emailError ? <span className="text-xs text-red-600 dark:text-red-300">{emailError}</span> : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-white text-sm font-semibold">Password</span>
              <div className="relative">
                <input
                  name="password"
                  className={`w-full rounded-lg bg-background-light dark:bg-background-dark border ${
                    passwordError ? 'border-red-500' : 'border-border-light dark:border-border-dark'
                  } focus:ring-2 focus:ring-primary/20 h-12 px-4 pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                  placeholder="Create a password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    if (!passwordTouched) setPasswordTouched(true);
                    setPassword(e.target.value);
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {passwordTouched ? (
                <>
                  <div className="h-2 rounded-full bg-border-light dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        score <= 2 ? 'bg-red-500' : score === 3 ? 'bg-amber-500' : score === 4 ? 'bg-sky-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: strengthWidth }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">Strength: {strength}</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <span className={checks.minLength ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                      {checks.minLength ? '✓' : '✗'} Minimum 8 characters
                    </span>
                    <span className={checks.uppercase ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                      {checks.uppercase ? '✓' : '✗'} At least one uppercase letter
                    </span>
                    <span className={checks.lowercase ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                      {checks.lowercase ? '✓' : '✗'} At least one lowercase letter
                    </span>
                    <span className={checks.number ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                      {checks.number ? '✓' : '✗'} At least one number
                    </span>
                    <span className={checks.special ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                      {checks.special ? '✓' : '✗'} At least one special character (!@#$%^&*)
                    </span>
                  </div>
                </>
              ) : null}
              {passwordError ? <span className="text-xs text-red-600 dark:text-red-300">{passwordError}</span> : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-white text-sm font-semibold">Confirm Password</span>
              <div className="relative">
                <input
                  className={`w-full rounded-lg bg-background-light dark:bg-background-dark border ${
                    confirmPasswordError ? 'border-red-500' : 'border-border-light dark:border-border-dark'
                  } focus:ring-2 focus:ring-primary/20 h-12 px-4 pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {confirmPasswordError ? <span className="text-xs text-red-600 dark:text-red-300">{confirmPasswordError}</span> : null}
            </label>
            {errorMessage ? (
              <p className="text-sm text-red-600 dark:text-red-300">
                {duplicateEmailError ? (
                  <>
                    An account with this email already exists.{' '}
                    <button type="button" onClick={() => navigate('/login')} className="underline font-semibold">
                      Please log in instead.
                    </button>
                  </>
                ) : (
                  errorMessage
                )}
              </p>
            ) : null}
            {isLockedOut ? (
              <p className="text-sm text-red-600 dark:text-red-300">
                Too many attempts. Try again in {formatCountdown(lockoutSeconds)}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-surface-dark px-2 text-sm text-text-muted">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-light dark:border-white/10 h-12 bg-white dark:bg-transparent text-text-main dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            {isGoogleLoading ? 'Redirecting...' : 'Sign up with Google'}
          </button>

          <p className="mt-8 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="font-bold text-primary hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;