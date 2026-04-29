import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingService } from '../services/meetingService';
import { UsageSummary } from '../types';

const NewMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'text'>('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingPhase, setProcessingPhase] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'record') setActiveTab('record');
    else if (tab === 'upload') setActiveTab('upload');
  }, [searchParams]);

  useEffect(() => {
    meetingService
      .getUsageSummary()
      .then((data) => {
        setUsage(data);
        if (data.limitMinutes !== null) {
          const remaining = data.limitMinutes - data.usedMinutes;
          if (remaining <= 0) {
            setQuotaWarning('You have reached your monthly quota.');
          } else if (remaining <= 20) {
            setQuotaWarning(`You are close to your monthly limit (${remaining} min left).`);
          }
        }
      })
      .catch(() => {
        // Keep UI stable without blocking.
      });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }
    setIsProcessing(true);
    setProcessingPhase('uploading');

    try {
      const gate = await meetingService.canStartProcessing();
      setUsage(gate.usage);
      if (!gate.allowed) {
        alert('You have reached your monthly processing quota for your current plan.');
        return;
      }

      const result = await meetingService.createFromUpload({
        file: selectedFile,
        title: uploadTitle || undefined,
        meetingDate: uploadDate,
      });
      setProcessingPhase('analyzing');
      navigate(`/meetings/${result.meetingId}`);
    } catch (error) {
      console.error('Upload processing failed', error);
      alert('Failed to upload and process the file. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingPhase('idle');
    }
  };

  const handleTextProcessing = async () => {
    if (!textInput.trim()) return;
    console.log('Starting text processing...');
    setIsProcessing(true);
    setProcessingPhase('analyzing');

    try {
      console.log('Checking quota...');
      const gate = await meetingService.canStartProcessing();
      console.log('Quota gate:', gate);
      setUsage(gate.usage);
      if (!gate.allowed) {
        alert('You have reached your monthly processing quota for your current plan.');
        setIsProcessing(false);
        setProcessingPhase('idle');
        return;
      }

      const result = await meetingService.createFromTranscript({
        transcript: textInput,
      });
      navigate(`/meetings/${result.meetingId}`);
    } catch (error) {
      console.error('Generation failed', error);
      alert("Failed to process transcript. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingPhase('idle');
    }
  };

  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check supported formats
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const extension = mimeType.includes('mp4') 
          ? 'mp4' 
          : 'webm';
        const fileName = `recording-${Date.now()}.${extension}`;
        const audioFile = new File(
          [new Blob(chunksRef.current, { type: mimeType })],
          fileName,
          { type: mimeType }
        );
        setRecordedFile(audioFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setRecordingError('Microphone access is required to record.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleProcessRecording = async () => {
    if (!recordedFile) {
      return;
    }

    setIsProcessing(true);
    setProcessingPhase('uploading');
    try {
      const gate = await meetingService.canStartProcessing();
      setUsage(gate.usage);
      if (!gate.allowed) {
        alert('You have reached your monthly processing quota for your current plan.');
        return;
      }

      const result = await meetingService.createFromUpload({
        file: recordedFile,
        title: `Live Recording ${new Date().toLocaleString()}`,
        meetingDate: uploadDate,
      });
      setProcessingPhase('analyzing');
      navigate(`/meetings/${result.meetingId}`);
    } catch (error) {
      console.error('Recording processing failed', error);
      alert('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingPhase('idle');
    }
  };

  return (
    <div className="flex justify-center py-8 px-4">
      <div className="flex flex-col max-w-[960px] w-full gap-8">
        <div className="flex flex-col gap-2 shrink-0">
           <button onClick={() => navigate(-1)} className="hover:text-primary flex items-center gap-1 text-sm font-medium text-text-muted w-fit mb-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
           </button>
           <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">New Meeting</h1>
           <p className="text-text-muted text-base font-normal leading-normal max-w-2xl">Create a new entry by uploading audio, recording live, or pasting a transcript.</p>
           {usage && (
             <p className="text-xs text-text-muted">
               Plan: <span className="font-semibold text-text-main dark:text-white">{usage.plan}</span> • Usage:{' '}
               <span className="font-semibold text-text-main dark:text-white">
                 {usage.usedMinutes}/{usage.limitMinutes ?? 'Unlimited'} min
               </span>
             </p>
           )}
           {quotaWarning && (
             <p className="text-xs text-orange-600 dark:text-orange-400">{quotaWarning}</p>
           )}
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden flex flex-col">
           {/* Tabs */}
           <div className="border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark/30 shrink-0">
              <nav className="flex px-6 gap-8 overflow-x-auto">
                 <button 
                   onClick={() => setActiveTab('text')}
                   className={`group flex items-center gap-2 border-b-[3px] py-4 px-2 transition-colors whitespace-nowrap ${activeTab === 'text' ? 'border-primary text-text-main dark:text-white' : 'border-transparent text-text-muted hover:text-primary'}`}
                 >
                    <span className={`material-symbols-outlined ${activeTab === 'text' ? 'text-primary' : ''}`}>description</span>
                    <span className="text-sm font-bold">Paste Transcript</span>
                 </button>
                 <button 
                   onClick={() => setActiveTab('upload')}
                   className={`group flex items-center gap-2 border-b-[3px] py-4 px-2 transition-colors whitespace-nowrap ${activeTab === 'upload' ? 'border-primary text-text-main dark:text-white' : 'border-transparent text-text-muted hover:text-primary'}`}
                 >
                    <span className={`material-symbols-outlined ${activeTab === 'upload' ? 'text-primary' : ''}`}>upload_file</span>
                    <span className="text-sm font-bold">Upload Audio</span>
                 </button>
                 <button 
                   onClick={() => setActiveTab('record')}
                   className={`group flex items-center gap-2 border-b-[3px] py-4 px-2 transition-colors whitespace-nowrap ${activeTab === 'record' ? 'border-primary text-text-main dark:text-white' : 'border-transparent text-text-muted hover:text-primary'}`}
                 >
                    <span className={`material-symbols-outlined ${activeTab === 'record' ? 'text-primary' : ''}`}>mic</span>
                    <span className="text-sm font-bold">Record Live</span>
                 </button>
              </nav>
           </div>

           <div className="p-6 md:p-8">
              {activeTab === 'text' && (
                <div className="flex flex-col gap-8 max-w-3xl mx-auto">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-text-main dark:text-white">Paste Meeting Transcript</h2>
                    <p className="text-sm text-text-muted">Paste the raw conversation text and AI will extract a summary, action items, and insights.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-text-main dark:text-white text-sm font-semibold">Transcript Text</label>
                    <textarea 
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={"Paste your meeting transcript here...\n\nExample:\nJohn: Let's discuss the Q4 budget.\nSarah: I think we need to allocate more for marketing..."}
                      className="w-full flex-1 min-h-[320px] rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none leading-relaxed"
                    ></textarea>
                    <p className="text-xs text-text-muted">Minimum ~100 words recommended for best results.</p>
                  </div>
                  <div className="pt-2 border-t border-border-light dark:border-border-dark shrink-0">
                    <button 
                      onClick={handleTextProcessing}
                      disabled={isProcessing || !textInput.trim()}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                       {isProcessing ? (
                         <>
                           <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                           {processingPhase === 'analyzing' ? 'Analyzing with AI...' : 'Working...'}
                         </>
                       ) : (
                         <>
                           <span className="material-symbols-outlined">auto_awesome</span>
                           Generate Meeting Notes
                         </>
                       )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="flex flex-col gap-10 max-w-3xl mx-auto">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-text-main dark:text-white">Upload Audio or Video</h2>
                    <p className="text-sm text-text-muted">Upload a recording and AI will transcribe and summarize it automatically.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Meeting Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <label className="flex flex-col gap-2">
                          <span className="text-text-main dark:text-gray-200 text-sm font-semibold">Meeting Title <span className="text-text-muted font-normal">(Optional)</span></span>
                          <div className="relative">
                             <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 text-base placeholder:text-text-muted/60" placeholder="e.g., Q4 Strategy Sync" type="text"/>
                             <span className="absolute right-3 top-3 text-text-muted/60 material-symbols-outlined">edit</span>
                          </div>
                       </label>
                       <label className="flex flex-col gap-2">
                          <span className="text-text-main dark:text-gray-200 text-sm font-semibold">Date</span>
                          <input value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 text-base" type="date"/>
                       </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Upload File</h3>
                    <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group">
                       <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-4">
                          <div className="p-4 rounded-full bg-surface-light dark:bg-surface-dark shadow-sm group-hover:scale-110 transition-transform duration-300">
                             <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
                          </div>
                          <div className="text-center">
                            <p className="text-lg text-text-main dark:text-white font-medium">
                               <span className="font-bold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-sm text-text-muted mt-1">MP3, WAV, M4A, MP4, MOV, WEBM — Max 50MB</p>
                          </div>
                       </div>
                       <input
                         type="file"
                         accept=".mp3,.wav,.m4a,.mp4,.mov,.webm"
                         className="hidden"
                         onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                       />
                    </label>
                    {selectedFile ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
                        <span className="material-symbols-outlined text-primary">audio_file</span>
                        <span className="text-sm font-semibold text-text-main dark:text-white">{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} className="ml-auto text-text-muted hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-border-light dark:border-border-dark">
                    <button 
                      onClick={handleUpload}
                      disabled={isProcessing || !selectedFile}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                       {isProcessing ? (
                         <>
                           <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                           {processingPhase === 'uploading' ? 'Uploading file...' : 'Starting AI processing...'}
                         </>
                       ) : (
                         <>
                           <span className="material-symbols-outlined">auto_awesome</span>
                           Upload & Generate Notes
                         </>
                       )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'record' && (
                <div className="flex flex-col items-center justify-center gap-8 py-16 max-w-lg mx-auto text-center">
                   <div className="flex flex-col items-center gap-4">
                     <div className="relative">
                        <div className={`size-28 rounded-full flex items-center justify-center relative z-10 ${isRecording ? 'bg-red-100 dark:bg-red-900/20' : 'bg-red-50 dark:bg-red-900/10'}`}>
                           <span className="material-symbols-outlined text-5xl text-red-500">mic</span>
                        </div>
                        {isRecording && <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>}
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-text-main dark:text-white">
                          {isRecording ? 'Recording in Progress' : recordedFile ? 'Recording Complete' : 'Ready to Record'}
                        </h3>
                        <p className="text-text-muted mt-2 text-sm leading-relaxed">
                          {isRecording
                            ? 'Speak clearly. Click Stop when your meeting ends.'
                            : recordedFile
                            ? 'Your recording is ready. Process it to generate AI notes.'
                            : 'Make sure your microphone is connected and permissions are granted.'}
                        </p>
                     </div>
                   </div>

                   {isRecording && (
                     <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30">
                       <span className="size-2.5 rounded-full bg-red-500 animate-pulse"></span>
                       <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{formatDuration(recordingSeconds)}</span>
                     </div>
                   )}

                   {recordedFile && !isRecording && (
                     <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 w-full">
                       <span className="material-symbols-outlined text-primary">audio_file</span>
                       <span className="text-sm font-semibold text-text-main dark:text-white truncate">{recordedFile.name}</span>
                     </div>
                   )}

                   {recordingError && (
                     <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 w-full">
                       <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                       <p className="text-sm text-red-600 dark:text-red-400">{recordingError}</p>
                     </div>
                   )}

                   <div className="flex flex-col items-center gap-4 w-full">
                     <button
                       onClick={isRecording ? stopRecording : startRecording}
                       className={`w-full py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white'}`}
                     >
                        <span className="material-symbols-outlined">{isRecording ? 'stop_circle' : 'fiber_manual_record'}</span>
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                     </button>
                     {recordedFile && (
                       <button
                         onClick={handleProcessRecording}
                         disabled={isProcessing}
                         className="w-full py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                       >
                         <span className="material-symbols-outlined">auto_awesome</span>
                         {isProcessing ? 'Processing...' : 'Process Recording'}
                       </button>
                     )}
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default NewMeeting;