import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 w-full px-6 overflow-hidden bg-gradient-to-b from-background-light to-white dark:from-background-dark dark:to-black">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="flex flex-col gap-8 max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary-dark w-fit animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              New: Gemini 2.0 Integration
            </div>
            <h1 className="text-text-main dark:text-white text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              Turn conversations into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">actionable knowledge.</span>
            </h1>
            <p className="text-text-muted text-xl leading-relaxed max-w-lg">
              The AI meeting assistant that records, transcribes, and summarizes your calls, so you can focus on the work that matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button 
                onClick={() => navigate('/signup')}
                className="inline-flex h-14 items-center justify-center rounded-xl bg-primary hover:bg-primary-dark transition-all hover:scale-105 px-8 text-lg font-bold text-white shadow-xl shadow-primary/20"
              >
                Get Started for Free
              </button>
            </div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-2">No credit card required • Cancel anytime</p>
          </div>
          
          {/* Hero Visual */}
          <div className="relative w-full aspect-square flex items-center justify-center perspective-1000">
             {/* Floating Elements */}
             <div className="absolute top-10 right-10 z-20 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-xl border border-border-light dark:border-white/10 animate-bounce-slow max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="size-2 bg-green-500 rounded-full"></div>
                   <span className="text-xs font-bold text-text-muted">Action Item Detected</span>
                </div>
                <p className="text-sm font-medium text-text-main dark:text-white">"Schedule follow-up with design team"</p>
             </div>

             <div className="absolute bottom-20 left-0 z-20 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-xl border border-border-light dark:border-white/10 animate-bounce-slow delay-700 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                   <p className="text-xs font-bold text-text-muted">Summary Ready</p>
                   <p className="text-sm font-bold text-text-main dark:text-white">45m meeting in 30s</p>
                </div>
             </div>

             {/* Main Card */}
            <div className="relative w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-2xl overflow-hidden transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
               <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-black/20">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 h-2 w-32 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                </div>
                <div className="p-8 flex flex-col gap-8 bg-gradient-to-b from-white to-gray-50 dark:from-surface-dark dark:to-black">
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">JD</div>
                         <div className="space-y-2">
                            <div className="h-2.5 w-24 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                            <div className="h-2 w-64 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                            <div className="h-2 w-48 bg-gray-100 dark:bg-white/5 rounded-full"></div>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">AI</div>
                         <div className="space-y-3 w-full p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                               <span className="text-xs font-bold text-primary">AI Insight</span>
                            </div>
                            <div className="h-2 w-full bg-primary/10 rounded-full"></div>
                            <div className="h-2 w-[90%] bg-primary/10 rounded-full"></div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
            
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/30 via-cyan-100/20 to-transparent dark:from-primary/10 dark:via-blue-900/20 rounded-full blur-[100px] -z-10"></div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-border-light dark:border-white/5 w-full bg-surface-light dark:bg-surface-dark/50">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
           <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-8">Trusted by forward-thinking teams at</p>
           <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {['Acme Corp', 'GlobalTech', 'Nebula', 'FoxRun', 'Circle'].map((logo, i) => (
                 <span key={i} className="text-xl md:text-2xl font-black text-text-main dark:text-white">{logo}</span>
              ))}
           </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-24 bg-background-light dark:bg-background-dark w-full px-6">
         <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-20 max-w-3xl mx-auto">
               <h2 className="text-3xl md:text-5xl font-black text-text-main dark:text-white mb-6 tracking-tight">Everything you need to run <br/>better meetings</h2>
               <p className="text-text-muted text-lg md:text-xl">Stop worrying about taking notes. Let NoteAI handle the administrative work while you focus on the conversation.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { icon: 'mic', title: 'Accurate Transcription', desc: 'Speaker-diarized transcripts in 30+ languages with industry-leading accuracy.' },
                 { icon: 'bolt', title: 'Instant Summaries', desc: 'Get a concise summary delivered to your inbox minutes after the meeting ends.' },
                 { icon: 'check_box', title: 'Auto-Action Items', desc: 'AI automatically detects tasks, assignees, and due dates from the conversation.' },
                 { icon: 'search', title: 'Smart Search', desc: 'Search across all your meetings to find exactly what was said and when.' },
                 { icon: 'lock', title: 'Enterprise Security', desc: 'SOC2 compliant, end-to-end encryption, and private cloud deployment options.' },
                 { icon: 'extension', title: 'Seamless Integrations', desc: 'Connects with Zoom, Google Meet, Teams, Slack, Notion, and more.' }
               ].map((feature, i) => (
                 <div key={i} className="group p-8 rounded-3xl bg-white dark:bg-surface-dark border border-border-light dark:border-white/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                       <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-text-muted leading-relaxed">{feature.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-24 w-full px-6 overflow-hidden">
         <div className="max-w-[1280px] mx-auto flex flex-col gap-32">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
               <div className="flex-1 flex flex-col gap-6">
                  <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                     <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white">Ask your meetings anything.</h2>
                  <p className="text-lg text-text-muted leading-relaxed">
                     Forgot what the budget was? Just ask the NoteAI Chat Assistant. It searches through the transcript to give you precise answers, complete with citations.
                  </p>
                  <ul className="flex flex-col gap-3 mt-2">
                     {['"What were the key risks mentioned?"', '"List all deadlines for Q4"', '"Did we decide on the color palette?"'].map((q, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-white/10">
                           <span className="material-symbols-outlined text-primary">forum</span>
                           <span className="font-medium text-text-main dark:text-white italic">{q}</span>
                        </li>
                     ))}
                  </ul>
               </div>
               <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full"></div>
                  <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-border-light dark:border-white/10 p-6">
                     {/* Chat Mockup */}
                     <div className="space-y-4">
                        <div className="flex justify-end">
                           <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm">What's the budget for the new campaign?</div>
                        </div>
                        <div className="flex justify-start">
                           <div className="bg-gray-100 dark:bg-white/10 text-text-main dark:text-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[90%]">
                              <p className="font-bold text-primary mb-1 text-xs">AI Assistant</p>
                              Based on the discussion at 14:20, the approved budget is <strong>$50,000</strong>. This includes a 10% contingency fund.
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Feature 2 (Reversed) */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
               <div className="flex-1 flex flex-col gap-6">
                  <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                     <span className="material-symbols-outlined text-3xl">integration_instructions</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white">Works where you work.</h2>
                  <p className="text-lg text-text-muted leading-relaxed">
                     NoteAI integrates seamlessly with your existing stack. Push summaries to Slack, sync tasks to Notion, and log calls in Salesforce automatically.
                  </p>
               </div>
               <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                     { name: 'Slack', color: 'bg-purple-100' },
                     { name: 'Notion', color: 'bg-gray-100' },
                     { name: 'Zoom', color: 'bg-blue-100' },
                     { name: 'Teams', color: 'bg-indigo-100' },
                  ].map((app, i) => {
                     const getIcon = (name: string) => {
                       switch(name) {
                         case 'Slack':
                           return (
                             <svg viewBox="0 0 24 24" className="w-8 h-8">
                               <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
                             </svg>
                           );
                         case 'Notion':
                           return (
                             <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                               <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z"/>
                             </svg>
                           );
                         case 'Zoom':
                           return (
                             <svg viewBox="0 0 24 24" className="w-8 h-8">
                               <circle cx="12" cy="12" r="12" fill="#2D8CFF"/>
                               <path d="M5.5 8.5A1.5 1.5 0 0 1 7 7h7a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 14 15H7a1.5 1.5 0 0 1-1.5-1.5v-5zm10 1.25v4.5l3 1.75v-8l-3 1.75z" fill="white"/>
                             </svg>
                           );
                         case 'Teams':
                           return (
                             <svg viewBox="0 0 24 24" className="w-8 h-8">
                               <circle cx="12" cy="12" r="12" fill="#6264A7"/>
                               <path d="M13.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-5 3h7v5.5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9.5zm8.5 0h-1v4h.5a1.5 1.5 0 0 0 1.5-1.5V11a1.5 1.5 0 0 0-1-.5z" fill="white"/>
                             </svg>
                           );
                         default:
                           return null;
                       }
                     };
                     
                     return (
                       <div key={i} className="flex flex-col items-center justify-center p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-white/10 aspect-square hover:-translate-y-2 transition-transform shadow-sm">
                          <div className={`size-16 rounded-2xl ${app.color} flex items-center justify-center mb-4`}>
                             {getIcon(app.name)}
                          </div>
                          <span className="font-bold text-text-main dark:text-white">{app.name}</span>
                       </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface-light dark:bg-surface-dark w-full px-6">
         <div className="max-w-[1280px] mx-auto">
            <h2 className="text-3xl font-black text-center text-text-main dark:text-white mb-16">Loved by thousands of users</h2>
            <div className="grid md:grid-cols-3 gap-8">
               {[
                  { text: "NoteAI has completely changed how we run product reviews. I actually pay attention now instead of furiously typing.", author: "Sarah Jenkins", role: "Product Director at TechFlow" },
                  { text: "The automatic action item detection is a lifesaver. Nothing falls through the cracks anymore.", author: "Michael Chang", role: "VP of Engineering at CloudScale" },
                  { text: "It's like having a super-smart secretary in every meeting. The ROI was obvious within the first week.", author: "Jessica Day", role: "Founder at Bloom" }
               ].map((t, i) => (
                  <div key={i} className="p-8 rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-white/10 relative">
                     <span className="material-symbols-outlined text-6xl text-primary/10 absolute top-6 left-6">format_quote</span>
                     <p className="text-lg text-text-main dark:text-white relative z-10 mb-6 font-medium leading-relaxed">"{t.text}"</p>
                     <div>
                        <p className="font-bold text-text-main dark:text-white">{t.author}</p>
                        <p className="text-sm text-text-muted">{t.role}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA */}
      <section className="py-24 w-full px-6">
         <div className="max-w-5xl mx-auto text-center">
            <div className="bg-primary rounded-[2.5rem] p-12 md:p-24 relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               <div className="absolute -top-24 -right-24 size-96 bg-white/10 rounded-full blur-3xl"></div>
               <div className="absolute -bottom-24 -left-24 size-96 bg-black/10 rounded-full blur-3xl"></div>
               
               <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to reclaim your time?</h2>
                  <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">Join 50,000+ professionals who trust NoteAI to capture their most important conversations.</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <button
                       onClick={() => navigate('/signup')}
                       className="px-8 py-4 bg-white text-primary font-bold text-lg rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                     >
                       Get Started for Free
                     </button>
                  </div>
                  <p className="text-sm text-white/70 mt-6 font-medium">14-day free trial • No credit card required</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Landing;