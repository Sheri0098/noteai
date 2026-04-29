import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MeetingChat from '../components/MeetingChat';
import { meetingService } from '../services/meetingService';
import { ActionItem, Meeting } from '../types';
import { exportMeetingPdf } from '../utils/exportPdf';

const MeetingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state with either passed data (from NewMeeting) or fetched backend data
  const passedData = location.state?.meetingData;

  const [activeTab, setActiveTab] = useState<'transcript' | 'chat'>('transcript');
  const [title, setTitle] = useState(passedData?.title || 'Q3 Product Roadmap Review');
  const [meetingDate, setMeetingDate] = useState(passedData?.date || 'Oct 24, 2023');
  const [meetingTime, setMeetingTime] = useState(passedData?.time || '10:00 AM');
  const [meetingStatus, setMeetingStatus] = useState<Meeting['status']>(passedData ? 'Done' : 'Processing');
  const [summary, setSummary] = useState(
    passedData?.summarySnippet ||
      ''
  );
  const [actionItems, setActionItems] = useState<ActionItem[]>(passedData?.actionItems || []);
  const [transcript, setTranscript] = useState(passedData?.fullTranscript || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [transcriptQuery, setTranscriptQuery] = useState('');
  const [isSavingActionItems, setIsSavingActionItems] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportPdf = () => {
    exportMeetingPdf({
      title,
      date: meetingDate,
      time: meetingTime,
      source: passedData ? 'Text Upload' : 'Live Recording',
      summary,
      actionItems,
      transcript: transcript || undefined,
    });
  };

  useEffect(() => {
    if (passedData || !id) {
      return;
    }

    let mounted = true;
    setIsLoadingDetails(true);
    setDetailsError(null);
    meetingService
      .getMeetingDetails(id)
      .then((data) => {
        if (!mounted) return;
        setTitle(data.title);
        setMeetingDate(data.date);
        setMeetingTime(data.time);
        setMeetingStatus(data.status || 'Done');
        setSummary(data.summarySnippet);
        setTranscript(data.fullTranscript);
        setActionItems(data.actionItems);
      })
      .catch((error) => {
        if (mounted) {
          setDetailsError(error instanceof Error ? error.message : 'Failed to load meeting details');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, passedData]);

  // Derive transcript string for chat context
  const transcriptText = transcript;

  useEffect(() => {
    if (!id || passedData || meetingStatus !== 'Processing') {
      return;
    }

    const intervalId = window.setInterval(() => {
      meetingService
        .getMeetingDetails(id)
        .then((data) => {
          setTitle(data.title);
          setMeetingDate(data.date);
          setMeetingTime(data.time);
          setMeetingStatus(data.status || 'Done');
          setSummary(data.summarySnippet);
          setTranscript(data.fullTranscript);
          setActionItems(data.actionItems);
        })
        .catch(() => {
          // Keep existing values until next poll attempt.
        });
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id, passedData, meetingStatus]);

  const handleRegenerateSummary = async () => {
    setIsRegenerating(true);
    try {
      if (!id) return;
      const regenerated = await meetingService.regenerateSummary(id, transcriptText);
      setSummary(regenerated);
    } catch (e) {
      console.error("Failed to regenerate summary", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const persistActionItems = async (nextItems: ActionItem[]) => {
    setActionItems(nextItems);
    if (!id) return;
    setIsSavingActionItems(true);
    try {
      await meetingService.updateActionItems(id, nextItems);
    } catch {
      // Keep optimistic UI state even if persistence fails.
    } finally {
      setIsSavingActionItems(false);
    }
  };

  const toggleActionItem = (itemId: string, checked: boolean) => {
    const nextItems = actionItems.map((item) =>
      item.id === itemId ? { ...item, status: checked ? 'Done' : 'In Progress' } : item
    );
    persistActionItems(nextItems);
  };

  const handleAddActionItem = () => {
    const newItem: ActionItem = {
      id: `local-${Date.now()}`,
      text: 'New action item',
      assignee: 'Unassigned',
      dueDate: 'TBD',
      status: 'Pending',
    };
    persistActionItems([...actionItems, newItem]);
  };

  const updateActionItemField = (
    itemId: string,
    patch: Partial<Pick<ActionItem, 'text' | 'assignee' | 'dueDate' | 'status'>>
  ) => {
    const nextItems = actionItems.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    persistActionItems(nextItems);
  };

  const transcriptLines = transcript ? transcript.split('\n') : [];
  const filteredTranscriptLines = transcriptLines.filter((line) => {
    if (!transcriptQuery.trim()) return true;
    return line.toLowerCase().includes(transcriptQuery.toLowerCase());
  });

  const highlightText = (text: string) => {
    if (!transcriptQuery.trim()) {
      return text;
    }
    const escaped = transcriptQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === transcriptQuery.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200/70 dark:bg-yellow-700/50 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
          )
        )}
      </>
    );
  };

  const handleDeleteMeeting = async () => {
    if (!id) return;
    const confirmed = window.confirm('Delete this meeting? This action cannot be undone.');
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await meetingService.deleteMeeting(id);
      navigate('/meetings');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete meeting.';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 shrink-0">
         <div className="flex flex-col gap-3 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
               <button onClick={() => navigate('/dashboard')} className="p-1 rounded-full hover:bg-border-light dark:hover:bg-border-dark text-text-muted transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <h2 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight">
                 {title}
               </h2>
               <button className="text-text-muted hover:text-primary transition-colors p-1 rounded-md">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
               </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-text-muted text-sm ml-10">
               <div className="flex items-center gap-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-3 py-1.5 rounded-md">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>{meetingDate} • {meetingTime}</span>
               </div>
               <div className="flex items-center gap-1.5 bg-primary/10 text-primary-dark px-3 py-1.5 rounded-md font-medium">
                  <span className="material-symbols-outlined text-[18px]">fiber_manual_record</span>
                  <span>{passedData ? 'Text Upload' : 'Live Recording'}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button
              onClick={handleExportPdf}
              className="h-10 px-4 rounded-lg border border-border-light dark:border-border-dark text-text-main dark:text-white hover:bg-background-light dark:hover:bg-background-dark font-medium text-sm transition-colors flex items-center gap-2"
            >
               <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
               Export PDF
            </button>
            <button
              onClick={handleDeleteMeeting}
              disabled={isDeleting}
              className="h-10 px-4 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/10 font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
               <span className="material-symbols-outlined text-[18px]">delete</span>
               {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold tracking-wide shadow-sm flex items-center gap-2 transition-colors">
               <span className="material-symbols-outlined text-[18px]">share</span>
               Share
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Left Column: Summary & Actions */}
         <div className="xl:col-span-8 flex flex-col gap-6 pb-4">
            {detailsError && (
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-4 text-sm text-red-500">
                {detailsError}
              </div>
            )}
            {meetingStatus === 'Processing' && (
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-4 text-sm text-text-muted">
                Your meeting is still processing. This page auto-refreshes every few seconds.
              </div>
            )}
            {/* Executive Summary */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-main dark:text-white">Executive Summary</h3>
                  <button 
                    onClick={handleRegenerateSummary}
                    disabled={isRegenerating}
                    className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                     <span className={`material-symbols-outlined text-[16px] ${isRegenerating ? 'animate-spin' : ''}`}>auto_awesome</span>
                     {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
               </div>
               <p className="text-text-main dark:text-white/90 leading-relaxed text-base">
                 {isLoadingDetails ? 'Loading meeting summary...' : summary || 'Summary is not available yet.'}
               </p>
            </div>

            {/* Action Items */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                  <h3 className="text-lg font-bold text-text-main dark:text-white">Action Items</h3>
                  <button onClick={handleAddActionItem} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                     <span className="material-symbols-outlined text-[18px]">add_circle</span> Add Item
                  </button>
               </div>
               {isSavingActionItems && (
                 <div className="px-6 py-2 text-xs text-text-muted border-b border-border-light dark:border-border-dark">
                   Saving action items...
                 </div>
               )}
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <colgroup>
                       <col className="w-8" />
                       <col className="w-[40%]" />
                       <col className="w-[20%]" />
                       <col className="w-[18%]" />
                       <col className="w-[18%]" />
                       <col className="w-10" />
                     </colgroup>
                     <thead>
                        <tr className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
                           <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-light dark:border-border-dark"></th>
                           <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-light dark:border-border-dark">Description</th>
                           <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-light dark:border-border-dark">Owner</th>
                           <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-light dark:border-border-dark">Due Date</th>
                           <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-light dark:border-border-dark">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {actionItems.map((item) => (
                          <tr key={item.id} className="border-b border-border-light dark:border-border-dark last:border-b-0">
                             <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  className="rounded border-border-dark/30 text-primary focus:ring-primary size-4 cursor-pointer"
                                  checked={item.status === 'Done'}
                                  onChange={(event) => toggleActionItem(item.id, event.target.checked)}
                                />
                             </td>
                             <td className="py-4 pl-4 pr-6 text-sm font-medium text-text-main dark:text-white align-middle">
                               {item.text}
                             </td>
                             <td className="py-4 px-4 text-sm text-text-muted dark:text-gray-400 align-middle whitespace-nowrap">
                               {item.assignee}
                             </td>
                             <td className="py-4 px-4 text-sm text-text-muted dark:text-gray-400 align-middle whitespace-nowrap">
                               <input
                                 value={item.dueDate}
                                 onChange={(event) => updateActionItemField(item.id, { dueDate: event.target.value })}
                                 className={`${item.status === 'Done' ? 'text-text-muted line-through' : 'text-text-muted'} w-full bg-transparent border border-transparent hover:border-border-light dark:hover:border-border-dark focus:border-primary/40 rounded px-2 py-1 transition-colors`}
                               />
                             </td>
                             <td className="py-4 px-4 align-middle whitespace-nowrap">
                                <select
                                  value={item.status}
                                  onChange={(event) =>
                                    updateActionItemField(item.id, {
                                      status: event.target.value as ActionItem['status'],
                                    })
                                  }
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    item.status === 'Done' 
                                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                      : item.status === 'In Progress'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'  
                                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Done">Done</option>
                                </select>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Column: Transcript & Chat */}
         <div className="xl:col-span-4 flex flex-col gap-0 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden sticky top-4 max-h-[calc(100vh-120px)]">
            <div className="flex items-center border-b border-border-light dark:border-border-dark">
               <button 
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main dark:hover:text-white'}`}
               >
                 Transcript
               </button>
               <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main dark:hover:text-white'}`}
               >
                 <span className="material-symbols-outlined text-[18px]">temp_preferences_custom</span>
                 AI Assistant
               </button>
            </div>

            {activeTab === 'transcript' ? (
              <>
                <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between shrink-0 bg-background-light/30 dark:bg-background-dark/30">
                   <div className="flex gap-2 w-full">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">search</span>
                        <input
                          value={transcriptQuery}
                          onChange={(event) => setTranscriptQuery(event.target.value)}
                          className="w-full h-9 pl-9 pr-3 rounded-lg bg-background-light dark:bg-background-dark border-none text-sm"
                          placeholder="Search..."
                        />
                      </div>
                      <button className="p-1.5 rounded hover:bg-background-light dark:hover:bg-background-dark text-text-muted transition-colors">
                         <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                   {transcript ? (
                     <div className="whitespace-pre-wrap text-sm text-text-main dark:text-white/80 leading-relaxed font-mono">
                       {(transcriptQuery.trim() ? filteredTranscriptLines : transcriptLines).map((line, index) => (
                         <div key={index}>{highlightText(line)}</div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-sm text-text-muted">
                       Transcript is not available yet.
                     </div>
                   )}
                </div>

                {!transcript && <div className="p-4 border-t border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/50 shrink-0"></div>}
              </>
            ) : (
              <MeetingChat meetingId={id || ''} transcript={transcriptText} />
            )}
         </div>
      </div>
    </div>
  );
};

export default MeetingDetails;