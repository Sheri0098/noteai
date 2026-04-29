import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/meetingService';

interface CheckoutState {
  planName: 'Pro' | 'Business';
  price: string;
  billingCycle: 'monthly' | 'yearly';
}

const PLAN_HIERARCHY: Record<string, number> = {
  Free: 0,
  Starter: 0,
  Pro: 1,
  Business: 2,
};

const PLAN_FEATURES: Record<string, string[]> = {
  Pro: [
    'Unlimited transcription minutes',
    'Advanced AI summaries',
    'Unlimited meeting history',
    'Speaker Identification',
    'Calendar & Slack Integrations',
  ],
  Business: [
    'Everything in Pro',
    'Admin Dashboard',
    'SSO (Okta, Google, SAML)',
    'Audit Logs & Custom Retention',
    'Dedicated Success Manager',
  ],
};

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const planState = location.state as CheckoutState | null;
  const planName = planState?.planName ?? 'Pro';
  const price = planState?.price ?? '$15';
  const billingCycle = planState?.billingCycle ?? 'monthly';
  const features = PLAN_FEATURES[planName] ?? PLAN_FEATURES['Pro'];

  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [isDowngrade, setIsDowngrade] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    meetingService
      .getUsageSummary()
      .then((usage) => {
        setCurrentPlan(usage.plan);
        const currentLevel = PLAN_HIERARCHY[usage.plan] ?? 0;
        const targetLevel = PLAN_HIERARCHY[planName] ?? 0;
        if (currentLevel >= targetLevel) {
          setAlreadySubscribed(true);
          setIsDowngrade(currentLevel > targetLevel);
        }
      })
      .catch(() => {});
  }, []);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    }
    return digits;
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16) next.cardNumber = 'Card number must be 16 digits.';

    const expiryMatch = expiry.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      next.expiry = 'Enter a valid expiry date (MM / YY).';
    } else {
      const month = parseInt(expiryMatch[1], 10);
      const year = parseInt('20' + expiryMatch[2], 10);
      const now = new Date();
      const expDate = new Date(year, month - 1);
      if (month < 1 || month > 12 || expDate < new Date(now.getFullYear(), now.getMonth())) {
        next.expiry = 'Expiry date must be in the future.';
      }
    }

    if (cvv.length !== 3) next.cvv = 'CVV must be 3 digits.';
    if (!cardName.trim()) next.cardName = 'Cardholder name is required.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoading(false);
    setIsSuccess(true);

    try {
      await meetingService.upgradePlan(planState?.planName ?? planName);
    } catch {
      // silently fail — mock payment
    }

    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const inputBase =
    'w-full rounded-lg border bg-background-light dark:bg-background-dark text-text-main dark:text-white placeholder:text-text-muted/60 h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors';
  const inputOk = 'border-border-light dark:border-border-dark';
  const inputErr = 'border-red-400 dark:border-red-500 focus:ring-red-300';

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main dark:text-white mb-2">
              Payment Successful! 🎉
            </h2>
            <p className="text-text-muted">
              Your <span className="font-semibold text-primary">{planName}</span> plan is now active.
            </p>
          </div>
          <p className="text-sm text-text-muted">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Right panel content (resolved before JSX return) ──────────────────────
  let rightPanel: React.ReactNode;

  if (alreadySubscribed && isDowngrade) {
    rightPanel = (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-orange-500 text-3xl">arrow_downward</span>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
            Downgrade Not Available
          </h3>
          <p className="text-text-muted text-sm max-w-xs">
            You are currently on the {currentPlan} plan which is higher than {planName}. Contact
            support to downgrade.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  } else if (alreadySubscribed) {
    rightPanel = (
      <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">verified</span>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
            Already Subscribed
          </h3>
          <p className="text-text-muted text-sm">
            You are already on the {planName} plan. No action needed.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/pricing')}
          className="text-sm text-text-muted hover:text-primary transition-colors"
        >
          View other plans
        </button>
      </div>
    );
  } else {
    rightPanel = (
      <>
        <h2 className="text-2xl font-black text-text-main dark:text-white mb-1">
          Complete your subscription
        </h2>
        <p className="text-sm text-text-muted mb-8">
          Enter your payment details to activate {planName}.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main dark:text-white">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className={`${inputBase} ${inputOk} bg-background-light/60 dark:bg-background-dark/60 cursor-not-allowed text-text-muted`}
            />
          </div>

          {/* Card Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main dark:text-white">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  if (errors.cardNumber) setErrors((p) => ({ ...p, cardNumber: '' }));
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                inputMode="numeric"
                className={`${inputBase} ${errors.cardNumber ? inputErr : inputOk} pr-10`}
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-text-muted/60">
                credit_card
              </span>
            </div>
            {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main dark:text-white">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => {
                  setExpiry(formatExpiry(e.target.value));
                  if (errors.expiry) setErrors((p) => ({ ...p, expiry: '' }));
                }}
                placeholder="MM / YY"
                maxLength={7}
                inputMode="numeric"
                className={`${inputBase} ${errors.expiry ? inputErr : inputOk}`}
              />
              {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-main dark:text-white">CVV</label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setCvv(v);
                  if (errors.cvv) setErrors((p) => ({ ...p, cvv: '' }));
                }}
                placeholder="123"
                maxLength={3}
                inputMode="numeric"
                className={`${inputBase} ${errors.cvv ? inputErr : inputOk}`}
              />
              {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main dark:text-white">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => {
                setCardName(e.target.value);
                if (errors.cardName) setErrors((p) => ({ ...p, cardName: '' }));
              }}
              placeholder="Name on card"
              className={`${inputBase} ${errors.cardName ? inputErr : inputOk}`}
            />
            {errors.cardName && <p className="text-xs text-red-500">{errors.cardName}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 mt-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-base shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing payment…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">lock</span>
                Subscribe Now
              </>
            )}
          </button>

          <p className="text-center text-xs text-text-muted">
            By subscribing you agree to our{' '}
            <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </form>
      </>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary mb-8 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Pricing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Left: Order Summary ── */}
          <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-8 flex flex-col gap-6">
            {/* Logo + badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">mic</span>
                <span className="text-xl font-black text-text-main dark:text-white">NoteAI</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
                {planName}
              </span>
            </div>

            {/* Plan details */}
            <div>
              <p className="text-sm text-text-muted mb-1">Plan</p>
              <p className="text-lg font-bold text-text-main dark:text-white">{planName}</p>
            </div>

            <div>
              <p className="text-sm text-text-muted mb-1">Price</p>
              <p className="text-3xl font-black text-text-main dark:text-white">
                {price}
                <span className="text-base font-medium text-text-muted">
                  /user/mo
                  {billingCycle === 'yearly' && (
                    <span className="ml-2 text-xs text-green-500 font-bold">billed yearly</span>
                  )}
                </span>
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-3">
              {features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl shrink-0">
                    check_circle
                  </span>
                  <span className="text-sm text-text-main dark:text-white/80">{feat}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border-light dark:border-border-dark pt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-text-muted">Total today</span>
              <span className="text-xl font-black text-text-main dark:text-white">
                {price}
                <span className="text-sm font-medium text-text-muted">/mo</span>
              </span>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30">
                <span className="material-symbols-outlined text-green-500 text-lg">verified_user</span>
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                  30-day money back guarantee
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-text-muted text-lg">lock</span>
                <span className="text-xs text-text-muted">Secure payment powered by Stripe</span>
              </div>
            </div>
          </div>

          {/* ── Right: Payment Form or Subscription Status ── */}
          <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-8">
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
