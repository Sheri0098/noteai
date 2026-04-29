// SUPABASE: Create 'avatars' bucket in Storage → set to PUBLIC → add policy allowing authenticated users to upload
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PROFILE_UPDATED_EVENT, useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { useDarkMode } from '../hooks/useDarkMode';
import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/config';
import { meetingService } from '../services/meetingService';
import { UsageSummary } from '../types';

type Tab = 'profile' | 'notifications' | 'billing' | 'integrations';

const AVATAR_MAX_PX = 300;

const isAvatarImageUrl = (value: string) => /^https?:\/\//i.test(value);

async function fileToResizedJpegBlob(file: File, maxSize: number): Promise<Blob> {
  const img = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context.');
    }
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to compress image'))),
        'image/jpeg',
        0.88
      );
    });
  } finally {
    img.close();
  }
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const currentUser = useCurrentUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const userEmail = user?.email || currentUser.email;

  useEffect(() => {
    meetingService
      .getUsageSummary()
      .then((data) => setUsage(data))
      .catch(() => {
        // Billing view can render static placeholders if needed.
      });
  }, []);

  useEffect(() => {
    setProfileLoading(true);
    setProfileError('');
    meetingService
      .getProfile()
      .then((profile) => {
        setFullName(profile.fullName);
        setBio(profile.bio);
        setAvatarUrl(profile.avatarUrl || '');
      })
      .catch((error) => setProfileError(error instanceof Error ? error.message : 'Failed to load profile'))
      .finally(() => setProfileLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError('');
    setProfileMessage('');
    try {
      await meetingService.updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setProfileMessage('Profile saved!');
      window.setTimeout(() => setProfileMessage(''), 3000);
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user?.id) {
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setAvatarUploadError('Supabase is not configured.');
      return;
    }

    setIsAvatarUploading(true);
    setAvatarUploadError('');
    try {
      const blob = await fileToResizedJpegBlob(file, AVATAR_MAX_PX);
      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const nextUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(nextUrl);
      await meetingService.updateProfile({
        fullName: fullName.trim(),
        bio: bio.trim(),
        avatarUrl: nextUrl,
      });
      window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    } catch (err) {
      setAvatarUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsAvatarUploading(true);
    try {
      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`]);

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      setAvatarUrl('');
      
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const usagePercent = useMemo(() => {
    if (!usage || usage.limitMinutes === null || usage.limitMinutes === 0) {
      return 25;
    }
    return Math.min(100, Math.round((usage.usedMinutes / usage.limitMinutes) * 100));
  }, [usage]);

  const planBadgeClass = useMemo(() => {
    switch (usage?.plan) {
      case 'Business':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Pro':
        return 'bg-primary/15 text-primary';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
    }
  }, [usage?.plan]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: 'My Profile', icon: 'person' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'billing', label: 'Plan & Billing', icon: 'credit_card' },
    { id: 'integrations', label: 'Integrations', icon: 'extension' },
  ];

  const displayInitial = (fullName || currentUser.name || userEmail || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-[1200px] mx-auto py-6">
       <div className="mb-8">
          <h1 className="text-3xl font-black text-text-main dark:text-white tracking-tight">Settings</h1>
          <p className="text-text-muted mt-2">Manage your account settings and workspace preferences.</p>
       </div>

       <div className="flex flex-col md:flex-row gap-8 items-start md:items-stretch">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex flex-col gap-2 shrink-0 md:min-h-[500px]">
             <div className="flex flex-col gap-2">
               {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                     activeTab === tab.id
                       ? 'bg-primary text-white shadow-md shadow-primary/20'
                       : 'text-text-muted hover:bg-surface-light dark:hover:bg-surface-dark hover:text-text-main dark:hover:text-white'
                   }`}
                 >
                   <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                   {tab.label}
                 </button>
               ))}
             </div>

             <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border-light dark:border-border-dark mt-2">
               <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-[20px] text-text-muted">
                   {isDark ? 'light_mode' : 'dark_mode'}
                 </span>
                 <span className="text-sm font-medium text-text-main dark:text-white">
                   {isDark ? 'Light Mode' : 'Dark Mode'}
                 </span>
               </div>
               <button
                 type="button"
                 onClick={toggle}
                 className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isDark ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}
               >
                 <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
             </div>

             <div className="flex-1 min-h-[1rem]" aria-hidden="true" />

             <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark">
               <button
                 type="button"
                 onClick={handleLogout}
                 className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
               >
                 <span className="material-symbols-outlined text-[20px]">logout</span>
                 Sign Out
               </button>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden min-h-[500px]">
             
             {activeTab === 'profile' && (
                <div className="p-8 md:p-10 animate-fade-in">
                   <h2 className="text-xl font-bold text-text-main dark:text-white mb-8 border-b border-border-light dark:border-border-dark pb-4">Public Profile</h2>
                   
                   <div className="flex flex-col gap-7">
                      <div className="flex items-center gap-6">
                         <input
                           ref={fileInputRef}
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleAvatarFileChange}
                         />
                         <div className="relative group shrink-0">
                           {isAvatarImageUrl(avatarUrl) ? (
                             <img
                               src={avatarUrl}
                               alt="Profile"
                               className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-background-dark shadow-sm"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                 if (sibling) sibling.style.display = 'flex';
                               }}
                             />
                           ) : null}
                           <div
                             className="w-24 h-24 rounded-full bg-primary/20 text-primary border-4 border-white dark:border-background-dark shadow-sm flex items-center justify-center text-3xl font-black"
                             style={{ display: isAvatarImageUrl(avatarUrl) ? 'none' : 'flex' }}
                           >
                             {displayInitial}
                           </div>
                           {isAvatarUploading ? (
                             <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                               <span className="h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                             </div>
                           ) : null}
                           <button
                             type="button"
                             onClick={() => fileInputRef.current?.click()}
                             disabled={isAvatarUploading || profileLoading}
                             className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 md:bg-black/0 md:hover:bg-black/35 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
                             title="Change profile photo"
                           >
                             <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">photo_camera</span>
                           </button>
                         </div>
                         <div className="flex flex-col gap-2 min-w-0">
                           <p className="text-sm font-semibold text-text-main dark:text-white">Profile photo</p>
                           <p className="text-xs text-text-muted">Hover and tap the camera icon to upload (max {AVATAR_MAX_PX}×{AVATAR_MAX_PX}).</p>
                           {avatarUploadError ? <p className="text-xs text-red-500">{avatarUploadError}</p> : null}
                           {avatarUrl && (
                             <button
                               type="button"
                               onClick={handleRemoveAvatar}
                               disabled={isAvatarUploading}
                               className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               <span className="material-symbols-outlined text-[14px]">delete</span>
                               Remove Photo
                             </button>
                           )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                         <label className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-text-main dark:text-white">Full Name</span>
                            <input
                              className="input-field"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Enter your full name"
                              disabled={profileLoading}
                            />
                         </label>
                         <label className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-text-main dark:text-white">Email</span>
                            <input className="input-field opacity-80" value={userEmail} readOnly />
                         </label>
                         <label className="flex flex-col gap-2 md:col-span-2">
                            <span className="text-sm font-bold text-text-main dark:text-white">Bio</span>
                            <textarea
                              className="input-field min-h-[100px]"
                              placeholder="Tell us a little about yourself..."
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              disabled={profileLoading}
                            />
                         </label>
                      </div>
                      {profileError ? <p className="text-sm text-red-500">{profileError}</p> : null}
                      {profileMessage ? <p className="text-sm text-green-600 dark:text-green-300">{profileMessage}</p> : null}

                      <div className="flex justify-end pt-4 border-t border-border-light dark:border-border-dark">
                         <button onClick={saveProfile} className="btn-primary min-w-[140px] flex items-center justify-center gap-2" disabled={isSavingProfile}>
                           {isSavingProfile ? (
                             <>
                               <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                               Saving...
                             </>
                           ) : (
                             'Save Changes'
                           )}
                         </button>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'notifications' && (
                <div className="p-8 md:p-10 animate-fade-in">
                   <h2 className="text-xl font-bold text-text-main dark:text-white mb-8 border-b border-border-light dark:border-border-dark pb-4">Notification Preferences</h2>
                   
                   <div className="flex flex-col gap-7">
                      {[
                        { title: 'Meeting Summaries', desc: 'Receive an email when your meeting summary is ready.', default: true },
                        { title: 'Action Item Reminders', desc: 'Get notified 24 hours before an action item is due.', default: true },
                        { title: 'New Comments', desc: 'Notify me when someone comments on a transcript.', default: true },
                        { title: 'Product Updates', desc: 'Receive news about new features and improvements.', default: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                           <div className="max-w-[80%]">
                              <h3 className="text-sm font-bold text-text-main dark:text-white">{item.title}</h3>
                              <p className="text-sm text-text-muted mt-0.5">{item.desc}</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                           </label>
                        </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === 'billing' && (
                <div className="p-8 md:p-10 animate-fade-in">
                   <h2 className="text-xl font-bold text-text-main dark:text-white mb-8 border-b border-border-light dark:border-border-dark pb-4">Plan & Usage</h2>
                   
                   <div className="flex flex-col gap-8">
                      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-xl p-6 text-white flex items-center justify-between shadow-lg">
                         <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Current Plan</p>
                            <h3 className="text-3xl font-black text-white">{usage?.plan || 'Free'} Plan</h3>
                            <p className="text-sm text-gray-400 mt-2">
                              {usage?.limitMinutes === null ? 'Unlimited processing minutes' : 'Monthly usage quota enabled'}
                            </p>
                            <span className={`inline-flex mt-3 px-2 py-1 rounded text-xs font-bold ${planBadgeClass}`}>
                              {usage?.plan || 'Free'}
                            </span>
                         </div>
                         <button
                           onClick={() => {
                             navigate('/pricing?from=dashboard');
                           }}
                           className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"
                         >
                           Manage Subscription
                         </button>
                      </div>

                      <div>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-text-main dark:text-white">Minutes Used</span>
                            <span className="text-sm text-text-muted">
                              {usage ? `${usage.usedMinutes} / ${usage.limitMinutes ?? 'Unlimited'}` : '...'}
                            </span>
                         </div>
                         <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${usagePercent}%` }}></div>
                         </div>
                      </div>

                      <div>
                         <h3 className="text-sm font-bold text-text-main dark:text-white mb-4">Payment Method</h3>
                         <div className="flex items-center justify-between p-4 border border-border-light dark:border-border-dark rounded-xl bg-background-light dark:bg-background-dark">
                            <div className="flex items-center gap-4">
                               <div className="h-8 w-12 bg-gray-200 dark:bg-white rounded flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-red-500 inline-block -mr-1"></div>
                                  <div className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></div>
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-text-main dark:text-white">Mastercard ending in 4242</p>
                                  <p className="text-xs text-text-muted">Expiry 04/2025</p>
                               </div>
                            </div>
                            <button className="text-sm font-bold text-primary hover:underline">Edit</button>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'integrations' && (
                <div className="p-8 md:p-10 animate-fade-in">
                   <h2 className="text-xl font-bold text-text-main dark:text-white mb-8 border-b border-border-light dark:border-border-dark pb-4">Integrations</h2>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {[
                        { name: 'Google Calendar', desc: 'Sync meetings and auto-record.', connected: true, color: 'bg-blue-500/10' },
                        { name: 'Slack', desc: 'Send summaries to channels.', connected: false, color: 'bg-purple-500/10' },
                        { name: 'Zoom', desc: 'Import cloud recordings.', connected: true, color: 'bg-blue-400/10' },
                        { name: 'Notion', desc: 'Export notes to Notion pages.', connected: false, color: 'bg-gray-100 dark:bg-gray-700' },
                      ].map((app, i) => {
                        const getIcon = (name: string) => {
                          switch(name) {
                            case 'Slack':
                              return (
                                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
                                </svg>
                              );
                            case 'Notion':
                              return (
                                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                                </svg>
                              );
                            case 'Zoom':
                              return (
                                <svg viewBox="0 0 24 24" className="w-8 h-8">
                                  <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z" fill="#2D8CFF"/>
                                  <path d="M5.5 8.5A1.5 1.5 0 0 1 7 7h7a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 14 15H7a1.5 1.5 0 0 1-1.5-1.5v-5zm10 1.25v4.5l3 1.75v-8l-3 1.75z" fill="white"/>
                                </svg>
                              );
                            case 'Google Calendar':
                              return (
                                <svg viewBox="0 0 24 24" className="w-8 h-8">
                                  <rect width="24" height="24" rx="4" fill="#4285F4"/>
                                  <path d="M17 4h-1V2h-2v2H10V2H8v2H7C5.9 4 5 4.9 5 6v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H7V9h10v11zM9 11h2v2H9zm4 0h2v2h-2zm-4 4h2v2H9zm4 0h2v2h-2z" fill="white"/>
                                </svg>
                              );
                            default:
                              return null;
                          }
                        };
                        
                        return (
                         <div key={i} className="flex items-center justify-between p-4 border border-border-light dark:border-border-dark rounded-xl hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className={`size-12 rounded-xl flex items-center justify-center ${app.color}`}>
                                  {getIcon(app.name)}
                               </div>
                               <div>
                                  <h3 className="font-bold text-text-main dark:text-white">{app.name}</h3>
                                  <p className="text-sm text-text-muted">{app.desc}</p>
                               </div>
                            </div>
                            <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                               app.connected 
                               ? 'bg-transparent border border-border-light dark:border-border-dark text-text-main dark:text-white hover:bg-red-50 hover:text-red-500 hover:border-red-200' 
                               : 'bg-primary text-white hover:bg-primary-dark'
                            }`}>
                               {app.connected ? 'Disconnect' : 'Connect'}
                            </button>
                         </div>
                        );
                      })}
                   </div>
                </div>
             )}
          </div>
       </div>

       <style>{`
          .input-field {
            @apply w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 px-4 text-sm text-text-main dark:text-white outline-none transition-all;
          }
          .btn-primary {
            @apply bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm active:scale-95;
          }
       `}</style>
    </div>
  );
};

export default Settings;
