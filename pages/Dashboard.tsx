import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { Meeting, UsageSummary } from '../types';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';

const StatCard = ({ title, value, subtext, icon, color }: any) => (
  <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark shadow-sm flex items-start justify-between group hover:border-primary/30 transition-colors">
    <div className="flex flex-col gap-1">
      <p className="text-text-muted text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-text-main dark:text-white">{value}</h3>
      <p className="text-xs text-text-muted font-medium">{subtext}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100 flex items-center justify-center`}>
      <span className={`material-symbols-outlined text-2xl ${color.replace('bg-', 'text-')}`}>{icon}</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUserProfile();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const processingCount = meetings.filter((meeting) => meeting.status === 'Processing').length;
  const totalMeetings = meetings.length;
  const pendingActions = meetings.reduce(
    (acc, meeting) => acc + Math.max(0, meeting.actionItemsCount - meeting.actionItemsCompleted),
    0
  );
  const completedMeetings = meetings.filter((meeting) => meeting.status === 'Done').length;
  const firstName = currentUser.name.split(' ')[0];
  const usagePercent = usage?.limitMinutes
    ? Math.min(100, Math.round((usage.usedMinutes / usage.limitMinutes) * 100))
    : 0;

  useEffect(() => {
    let mounted = true;
    let pollTimer: number | undefined;

    const loadMeetings = (initial = false) => {
      if (initial) {
        setIsLoadingMeetings(true);
      }
      setMeetingsError(null);
      meetingService
        .listMeetings()
        .then((data) => {
          if (!mounted) return;
          if (data.length) {
            setMeetings(data);
          }
          const hasProcessing = data.some((meeting) => meeting.status === 'Processing');
          if (hasProcessing && pollTimer === undefined) {
            pollTimer = window.setInterval(() => loadMeetings(false), 8000);
          }
          if (!hasProcessing && pollTimer !== undefined) {
            window.clearInterval(pollTimer);
            pollTimer = undefined;
          }
        })
        .catch((error) => {
          if (mounted) {
            setMeetingsError(error instanceof Error ? error.message : 'Failed to load meetings');
          }
        })
        .finally(() => {
          if (mounted && initial) {
            setIsLoadingMeetings(false);
          }
        });
    };

    loadMeetings(true);

    return () => {
      mounted = false;
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
      }
    };
  }, []);

  useEffect(() => {
    setIsLoadingUsage(true);
    setUsageError(null);
    meetingService
      .getUsageSummary()
      .then((summary) => setUsage(summary))
      .catch((error) => setUsageError(error instanceof Error ? error.message : 'Failed to load usage'))
      .finally(() => setIsLoadingUsage(false));
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-10 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight mb-2">Dashboard</h1>
          <p className="text-text-muted text-lg">
            {`Welcome back${firstName ? `, ${firstName}` : ''}. You have ${meetings.length} meeting${
              meetings.length !== 1 ? 's' : ''
            } recorded.`}
          </p>
          {processingCount > 0 && (
            <p className="text-xs text-text-muted mt-1">
              <span className="font-semibold text-primary">{processingCount}</span> meeting{processingCount > 1 ? 's' : ''} currently processing.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-bold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm">
             <span className="material-symbols-outlined text-[18px]">calendar_today</span>
             View Calendar
          </button>
          <button 
            onClick={() => navigate('/meetings/new?tab=record')}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-bold text-white shadow-md shadow-primary/20 transition-all active:scale-95"
          >
             <span className="material-symbols-outlined text-[18px]">add</span>
             New Meeting
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <StatCard 
          title="Total Meetings" 
          value={String(totalMeetings)} 
          subtext="All time" 
          icon="groups" 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Action Items Pending" 
          value={String(pendingActions)} 
          subtext="Across all meetings" 
          icon="check_circle" 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Completed Meetings" 
          value={String(completedMeetings)} 
          subtext="Successfully processed" 
          icon="task_alt" 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Column: Quick Actions & Recent */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          
          {/* Quick Actions */}
          <section>
             <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                Quick Actions
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => navigate('/meetings/new')}
                  className="group relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-border-light dark:border-border-dark hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex justify-between items-start">
                       <div className="p-3 bg-primary/10 w-fit rounded-xl text-primary">
                          <span className="material-symbols-outlined text-3xl">upload_file</span>
                       </div>
                       <span className="material-symbols-outlined text-border-light dark:text-border-dark group-hover:text-primary transition-colors">arrow_forward</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">Upload Audio/Video</h3>
                      <p className="text-text-muted text-xs">Drag & drop files to generate notes.</p>
                    </div>
                  </div>
                </div>

                <div 
                   onClick={() => navigate('/meetings/new?tab=record')}
                   className="group relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-border-light dark:border-border-dark hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-500/5 to-transparent"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex justify-between items-start">
                       <div className="p-3 bg-red-50 dark:bg-red-900/20 w-fit rounded-xl text-red-500">
                          <span className="material-symbols-outlined text-3xl">mic</span>
                       </div>
                       <span className="material-symbols-outlined text-border-light dark:text-border-dark group-hover:text-red-500 transition-colors">arrow_forward</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">Record Meeting</h3>
                      <p className="text-text-muted text-xs">Start real-time transcription now.</p>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          {/* Recent Meetings */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">history</span>
                 Recent Activity
              </h2>
              <button onClick={() => navigate('/meetings')} className="text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-wider">View All</button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
              {meetingsError && (
                <div className="px-6 py-3 text-xs text-red-500 border-b border-border-light dark:border-border-dark">
                  {meetingsError}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background-light dark:bg-background-dark/50 text-text-muted font-medium border-b border-border-light dark:border-border-dark">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap w-[40%]">Meeting</th>
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap">Actions</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {meetings.map((meeting) => (
                      <tr 
                        key={meeting.id} 
                        onClick={() => navigate(`/meetings/${meeting.id}`)}
                        className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                             <div className={`mt-1 size-2 rounded-full ${meeting.status === 'Done' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                             <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors text-base">{meeting.title}</span>
                                <span className="text-xs text-text-muted">{meeting.date} • {meeting.duration}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meeting.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700'}`}>
                              {meeting.status === 'Done' && <span className="material-symbols-outlined text-[14px]">check</span>}
                              {meeting.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1 w-32">
                              <div className="flex justify-between text-[10px] font-bold uppercase text-text-muted">
                                 <span>Tasks</span>
                                 <span>{meeting.actionItemsCompleted}/{meeting.actionItemsCount}</span>
                              </div>
                              <div className="h-1.5 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                                 <div className="h-full bg-primary rounded-full" style={{ width: `${(meeting.actionItemsCompleted/meeting.actionItemsCount)*100 || 0}%` }}></div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="p-2 rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-muted hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoadingMeetings && meetings.length === 0 && (
                <div className="px-6 py-8 text-sm text-text-muted text-center">
                  No meetings yet. Create your first meeting to get started.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Usage & Updates */}
        <div className="flex flex-col gap-10">
           {/* Usage */}
           <section className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm p-6 h-fit">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-bold text-text-main dark:text-white">Usage</h2>
              </div>
              {isLoadingUsage ? (
                <p className="text-sm text-text-muted">Loading usage...</p>
              ) : usageError ? (
                <p className="text-sm text-red-500">{usageError}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Plan</p>
                    <p className="text-xl font-black text-text-main dark:text-white mt-1">{usage?.plan || 'Free'}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-text-muted">Minutes Used</span>
                      <span className="font-semibold text-text-main dark:text-white">
                        {usage?.usedMinutes ?? 0} / {usage?.limitMinutes ?? 'Unlimited'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate('/pricing?from=dashboard')}
                className="w-full mt-6 py-2.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-bold text-text-muted hover:text-text-main dark:hover:text-white hover:bg-background-light dark:hover:bg-background-dark transition-colors"
              >
                 Upgrade Plan
              </button>
           </section>

           {/* Tips / Promo */}
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <span className="material-symbols-outlined text-9xl">auto_awesome</span>
              </div>
              <div className="relative z-10">
                 <div className="bg-white/20 w-fit px-2 py-1 rounded text-xs font-bold mb-3 border border-white/10">Pro Tip</div>
                 <h3 className="font-bold text-lg mb-2">Connect Google Calendar</h3>
                 <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                    Auto-join meetings and get summaries delivered straight to your inbox.
                 </p>
                 <button className="bg-white text-indigo-700 text-sm font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors">
                    Connect Now
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;