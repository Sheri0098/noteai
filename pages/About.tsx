import React from 'react';

const About: React.FC = () => {
  return (
    <div className="w-full">
       {/* Hero */}
       <div className="max-w-[1000px] mx-auto pt-20 pb-16 px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-text-main dark:text-white mb-8 tracking-tight">Reimagining how teams <span className="text-primary">capture knowledge.</span></h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
             We combine advanced AI with intuitive design to ensure no brilliant idea is ever forgotten. NoteAI is the brain of your organization.
          </p>
       </div>

       {/* Stats Banner */}
       <div className="w-full bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-white/10 py-12 mb-20">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
             {[
                { label: 'Minutes Transcribed', val: '10M+' },
                { label: 'Active Users', val: '50k+' },
                { label: 'Countries', val: '120+' },
                { label: 'Languages Supported', val: '30+' },
             ].map((stat, i) => (
                <div key={i}>
                   <div className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.val}</div>
                   <div className="text-sm font-bold text-text-muted uppercase tracking-wider">{stat.label}</div>
                </div>
             ))}
          </div>
       </div>

       <div className="max-w-[1000px] mx-auto px-6 pb-24">
          {/* Story */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
             <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">Our Story</div>
                <h2 className="text-3xl font-bold text-text-main dark:text-white mb-6">Born from frustration. Built for focus.</h2>
                <div className="space-y-6 text-lg text-text-muted leading-relaxed">
                   <p>It started in 2022 with a simple observation: our best engineers were spending more time writing meeting notes than writing code. Important decisions were being lost in the ether, and "I'll follow up on that" often meant "I will forget this immediately."</p>
                   <p>We built NoteAI to solve this problem for ourselves. We wanted a tool that could listen as well as a human, understand context, and distill hour-long ramblings into crisp, actionable summaries.</p>
                   <p>Today, NoteAI serves thousands of teams worldwide, helping them reclaim their time and sanity.</p>
                </div>
             </div>
             <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl transform rotate-3"></div>
                <div className="relative bg-gray-200 dark:bg-white/5 rounded-2xl h-[500px] w-full overflow-hidden shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                   <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Team working together" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"/>
                </div>
             </div>
          </div>

          {/* Values */}
          <div className="mb-32">
             <h2 className="text-3xl font-bold text-text-main dark:text-white mb-12 text-center">Our Core Values</h2>
             <div className="grid md:grid-cols-3 gap-8">
                {[
                   { icon: 'bolt', title: 'Speed Matters', desc: 'We believe tools should be faster than thought. Latency is the enemy of flow.' },
                   { icon: 'lock', title: 'Privacy First', desc: 'Your conversations are sacred. We build with privacy-by-design principles.' },
                   { icon: 'psychology', title: 'Augment, Don\'t Replace', desc: 'AI should empower humans to do their best work, not automate them away.' },
                ].map((val, i) => (
                   <div key={i} className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-white/10">
                      <div className="size-12 rounded-xl bg-background-light dark:bg-background-dark flex items-center justify-center text-primary mb-6">
                         <span className="material-symbols-outlined text-3xl">{val.icon}</span>
                      </div>
                      <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">{val.title}</h3>
                      <p className="text-text-muted leading-relaxed">{val.desc}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* Team */}
          <div className="text-center mb-32">
             <h2 className="text-3xl font-bold text-text-main dark:text-white mb-12">Meet the Builders</h2>
             <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {[
                   { name: 'Alex Morgan', role: 'CEO & Co-founder', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=facearea&facepad=2&w=256&h=256&q=80' },
                   { name: 'Sarah Chen', role: 'CTO', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=facearea&facepad=2&w=256&h=256&q=80' },
                   { name: 'David Kim', role: 'Head of AI', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=facearea&facepad=2&w=256&h=256&q=80' },
                   { name: 'Emily Watson', role: 'Head of Product', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=facearea&facepad=2&w=256&h=256&q=80' }
                ].map((member, i) => (
                   <div key={i} className="flex flex-col items-center gap-4 group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-light dark:border-surface-dark shadow-lg relative">
                         <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      </div>
                      <div>
                         <h3 className="font-bold text-lg text-text-main dark:text-white">{member.name}</h3>
                         <p className="text-primary text-sm font-medium">{member.role}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Careers CTA */}
          <div className="rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-white/10 p-12 text-center">
             <h2 className="text-3xl font-bold text-text-main dark:text-white mb-4">Join our mission</h2>
             <p className="text-text-muted mb-8 max-w-xl mx-auto">We're looking for talented engineers, designers, and thinkers to help us build the future of work.</p>
             <button className="px-8 py-3 rounded-lg bg-text-main dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity">
                View Open Positions
             </button>
          </div>
       </div>
    </div>
  );
};

export default About;