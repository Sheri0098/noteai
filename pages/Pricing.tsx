import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/meetingService';

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fromDashboard = searchParams.get('from') === 'dashboard';
  const [currentUserPlan, setCurrentUserPlan] = useState<string>('');

  useEffect(() => {
    if (user) {
      meetingService.getUsageSummary()
        .then(u => setCurrentUserPlan(u.plan))
        .catch(() => {});
    }
  }, [user]);

  const isCurrentPlan = (planName: string): boolean => {
    if (planName === 'Starter') {
      return currentUserPlan === 'Free' || currentUserPlan === 'Starter';
    }
    return currentUserPlan === planName;
  };

  return (
    <div className="flex flex-col items-center py-20 px-6 overflow-x-hidden">
      {fromDashboard && (
        <div className="w-full max-w-[1200px] mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      )}
      {fromDashboard && (
        <div className="w-full max-w-[800px] mb-8 bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-primary">
            Upgrade your plan to unlock unlimited transcription minutes and advanced features
          </p>
        </div>
      )}
      <div className="text-center max-w-3xl mb-12">
        <h1 className="text-text-main dark:text-white text-4xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
           Simple, transparent pricing.
        </h1>
        <p className="text-text-muted text-xl font-normal">
           Choose the plan that fits your team. No hidden fees.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-4 mb-16 bg-surface-light dark:bg-surface-dark p-1.5 rounded-full border border-border-light dark:border-white/10 shadow-sm">
         <button 
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isYearly ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main dark:hover:text-white'}`}
         >
            Monthly
         </button>
         <button 
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isYearly ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main dark:hover:text-white'}`}
         >
            Yearly <span className="text-[10px] bg-green-500 text-white px-1.5 rounded uppercase">Save 20%</span>
         </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] w-full mb-24">
         {/* Starter */}
         <div className={`
           relative rounded-2xl p-8 transition-all duration-300 flex flex-col
           ${isCurrentPlan('Starter')
             ? 'border-2 border-primary shadow-xl shadow-primary/20 bg-primary/5 dark:bg-primary/10 scale-[1.02]'
             : 'border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm'
           }
         `}>
            {isCurrentPlan('Starter') && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                <span className="material-symbols-outlined text-[13px] fill">check_circle</span>
                Current Plan
              </div>
            )}
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">Starter</h3>
               <p className="text-sm text-text-muted">For individuals just getting started.</p>
               <div className="flex items-baseline gap-1 mt-6">
                  <span className="text-5xl font-black text-text-main dark:text-white">$0</span>
                  <span className="text-text-muted font-medium">/ forever</span>
               </div>
            </div>
            {isCurrentPlan('Starter') ? (
              <button 
                disabled
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary/10 text-primary border border-primary/30 cursor-not-allowed flex items-center justify-center gap-2 mb-8"
              >
                <span className="material-symbols-outlined text-[16px] fill">check_circle</span>
                Active Plan
              </button>
            ) : (
              <button className="w-full py-3.5 rounded-xl border-2 border-border-light dark:border-white/10 hover:border-primary hover:text-primary text-text-main dark:text-white font-bold transition-colors mb-8" onClick={() => { if (user) { navigate('/dashboard'); } else { navigate('/signup'); } }}>
                Get Started
              </button>
            )}
            <div className="flex flex-col gap-4 text-sm text-text-main dark:text-white/80">
               {['300 transcription minutes/mo', 'Basic AI summaries', '7-day recording history', '1 user seat', 'Email support'].map((feat, i) => (
                  <div key={i} className="flex gap-3 items-start">
                     <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                     <span>{feat}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Pro */}
         <div className={`
           relative rounded-2xl p-8 transition-all duration-300 flex flex-col transform md:scale-105 z-10
           ${isCurrentPlan('Pro')
             ? 'border-2 border-primary shadow-xl shadow-primary/25 bg-primary/5 dark:bg-primary/10 scale-[1.02]'
             : 'border-2 border-primary shadow-lg'
           }
         `}>
            {isCurrentPlan('Pro') ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                <span className="material-symbols-outlined text-[13px] fill">check_circle</span>
                Current Plan
              </div>
            ) : (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-blue-500 text-white text-sm font-bold px-6 py-2 rounded-full uppercase tracking-wider shadow-md">Most Popular</div>
            )}
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">Pro</h3>
               <p className="text-sm text-text-muted">For professionals and small teams.</p>
               <div className="flex items-baseline gap-1 mt-6">
                  <span className="text-5xl font-black text-text-main dark:text-white">${isYearly ? '12' : '15'}</span>
                  <span className="text-text-muted font-medium">/ user / mo</span>
               </div>
               {isYearly && <p className="text-xs text-green-500 font-bold mt-2">Billed $144 yearly</p>}
            </div>
            {isCurrentPlan('Pro') ? (
              <button 
                disabled
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary/10 text-primary border border-primary/30 cursor-not-allowed flex items-center justify-center gap-2 mb-8"
              >
                <span className="material-symbols-outlined text-[16px] fill">check_circle</span>
                Active Plan
              </button>
            ) : (
              <button className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold transition-colors shadow-lg mb-8" onClick={() => { if (!user) { navigate('/signup'); return; } navigate('/checkout', { state: { planName: 'Pro', price: isYearly ? '$12' : '$15', billingCycle: isYearly ? 'yearly' : 'monthly' } }); }}>
                Subscribe to Pro
              </button>
            )}
            <div className="flex flex-col gap-4 text-sm text-text-main dark:text-white/80">
               {['Unlimited transcription minutes', 'Advanced Gemini 2.0 Summaries', 'Unlimited history', 'Speaker Identification', 'Calendar & Slack Integrations', 'Search across all meetings'].map((feat, i) => (
                  <div key={i} className="flex gap-3 items-start">
                     <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                     <span>{feat}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Business */}
         <div className={`
           relative rounded-2xl p-8 transition-all duration-300 flex flex-col
           ${isCurrentPlan('Business')
             ? 'border-2 border-primary shadow-xl shadow-primary/20 bg-primary/5 dark:bg-primary/10 scale-[1.02]'
             : 'border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm'
           }
         `}>
            {isCurrentPlan('Business') && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                <span className="material-symbols-outlined text-[13px] fill">check_circle</span>
                Current Plan
              </div>
            )}
            <div className="mb-8">
               <h3 className="text-2xl font-bold text-text-main dark:text-white mb-2">Business</h3>
               <p className="text-sm text-text-muted">For growing organizations.</p>
               <div className="flex items-baseline gap-1 mt-6">
                  <span className="text-5xl font-black text-text-main dark:text-white">${isYearly ? '49' : '59'}</span>
                  <span className="text-text-muted font-medium">/ user / mo</span>
               </div>
               {isYearly && <p className="text-xs text-green-500 font-bold mt-2">Billed $588 yearly</p>}
            </div>
            {isCurrentPlan('Business') ? (
              <button 
                disabled
                className="w-full py-3.5 rounded-xl font-semibold text-sm bg-primary/10 text-primary border border-primary/30 cursor-not-allowed flex items-center justify-center gap-2 mb-8"
              >
                <span className="material-symbols-outlined text-[16px] fill">check_circle</span>
                Active Plan
              </button>
            ) : (
              <button className="w-full py-3.5 rounded-xl border-2 border-border-light dark:border-white/10 hover:border-primary hover:text-primary text-text-main dark:text-white font-bold transition-colors mb-8" onClick={() => { if (!user) { navigate('/signup'); return; } navigate('/checkout', { state: { planName: 'Business', price: isYearly ? '$49' : '$59', billingCycle: isYearly ? 'yearly' : 'monthly' } }); }}>
                Subscribe to Business
              </button>
            )}
            <div className="flex flex-col gap-4 text-sm text-text-main dark:text-white/80">
               {['Everything in Pro', 'Admin Dashboard', 'SSO (Okta, Google, SAML)', 'Audit Logs', 'Custom Data Retention', 'Priority 24/7 Support', 'Dedicated Success Manager'].map((feat, i) => (
                  <div key={i} className="flex gap-3 items-start">
                     <span className="material-symbols-outlined text-primary text-xl shrink-0">check_circle</span>
                     <span>{feat}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-[1000px] w-full mb-24 hidden md:block">
         <h2 className="text-3xl font-bold text-center text-text-main dark:text-white mb-12">Feature Comparison</h2>
         <div className="overflow-hidden rounded-2xl border border-border-light dark:border-white/10">
            <table className="w-full text-left border-collapse bg-white dark:bg-surface-dark">
               <thead>
                  <tr className="bg-background-light dark:bg-black/20">
                     <th className="p-6 text-sm font-bold text-text-muted uppercase w-1/3">Feature</th>
                     <th className="p-6 text-sm font-bold text-center text-text-main dark:text-white w-1/5">Starter</th>
                     <th className="p-6 text-sm font-bold text-center text-primary w-1/5">Pro</th>
                     <th className="p-6 text-sm font-bold text-center text-text-main dark:text-white w-1/5">Business</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border-light dark:divide-white/5">
                  {[
                     ['Minutes / Mo', '300', 'Unlimited', 'Unlimited'],
                     ['History', '7 Days', 'Unlimited', 'Custom'],
                     ['Integrations', '-', 'Zoom, Slack, GCal', 'All + Salesforce'],
                     ['AI Model', 'Basic', 'Gemini 2.0 Flash', 'Gemini 2.0 Pro'],
                     ['Support', 'Email', 'Priority Email', 'Dedicated Manager'],
                     ['SSO', '-', '-', 'Included'],
                  ].map((row, i) => (
                     <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-6 text-sm font-medium text-text-main dark:text-white">{row[0]}</td>
                        <td className="p-6 text-center text-sm text-text-muted">{row[1]}</td>
                        <td className="p-6 text-center text-sm font-bold text-primary">{row[2]}</td>
                        <td className="p-6 text-center text-sm text-text-main dark:text-white">{row[3]}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl w-full">
         <h2 className="text-3xl font-bold text-center text-text-main dark:text-white mb-12">Frequently Asked Questions</h2>
         <div className="space-y-4">
            {[
               { q: "Can I cancel my subscription at any time?", a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period." },
               { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption for all data in transit and at rest. We are SOC2 Type II compliant." },
               { q: "Does NoteAI work with video files?", a: "Yes! You can upload audio (mp3, wav) or video (mp4, mov) files, and we will extract the audio for transcription." },
               { q: "Do you offer discounts for non-profits?", a: "Yes, we offer a 50% discount for registered non-profit organizations and educational institutions. Contact our sales team for details." }
            ].map((faq, i) => (
               <div key={i} className="rounded-2xl border border-border-light dark:border-white/10 bg-surface-light dark:bg-surface-dark p-6">
                  <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">{faq.q}</h3>
                  <p className="text-text-muted leading-relaxed">{faq.a}</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Pricing;