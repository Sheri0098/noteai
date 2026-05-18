import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { useDarkMode } from '../hooks/useDarkMode';
import { meetingService } from '../services/meetingService';
import { Meeting } from '../types';

const isAvatarImageUrl = (value: string) => /^https?:\/\//i.test(value);

const SidebarLink = ({ to, icon, label, isActive }: { to: string, icon: string, label: string, isActive: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
      isActive 
        ? 'bg-primary/10 text-primary dark:text-primary' 
        : 'text-text-muted dark:text-gray-400 hover:bg-border-light dark:hover:bg-surface-dark hover:text-text-main dark:hover:text-white'
    }`}
  >
    <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>{icon}</span>
    <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentUser = useCurrentUserProfile();
  const { isDark, toggle } = useDarkMode();
  const [plan, setPlan] = useState<string>('Free');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allMeetingTitles, setAllMeetingTitles] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  useEffect(() => {
    meetingService
      .getUsageSummary()
      .then((usage) => setPlan(usage.plan))
      .catch(() => setPlan('Free'));
  }, []);

  useEffect(() => {
    meetingService
      .listMeetings()
      .then((data) => {
        setMeetings(data);
        const titles = data
          .map(m => m.title)
          .filter(Boolean) as string[];
        setAllMeetingTitles(titles);
      })
      .catch(() => {
        setMeetings([]);
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = allMeetingTitles
      .filter(title => title.toLowerCase().includes(query))
      .slice(0, 5);
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchQuery, allMeetingTitles]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-bell')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-text-main dark:text-white">
      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex absolute md:relative z-20 w-64 h-full flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-all duration-300`}>
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="flex items-center justify-center rounded-lg bg-primary/20 p-2 text-primary">
              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text-main dark:text-white">NoteAI</h1>
              <p className="text-xs text-text-muted">Workspace</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2 flex-1">
            <SidebarLink to="/dashboard" icon="dashboard" label="Dashboard" isActive={isActive('/dashboard')} />
            <SidebarLink to="/meetings" icon="groups" label="Meetings" isActive={isActive('/meetings')} />
            <SidebarLink to="/settings" icon="settings" label="Settings" isActive={isActive('/settings')} />
          </nav>

          {/* CTA */}
          <div className="mt-auto pt-4 mb-6">
            <Link to="/meetings/new" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg h-11 bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>New Meeting</span>
            </Link>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 py-3 border-t border-border-light dark:border-border-dark cursor-pointer hover:bg-background-light dark:hover:bg-background-dark/50 rounded-lg transition-colors" onClick={() => navigate('/settings')}>
            {isAvatarImageUrl(currentUser.avatar) ? (
              <img
                src={currentUser.avatar}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover border border-primary/30 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (sibling) sibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/30 flex-shrink-0"
              style={{ display: isAvatarImageUrl(currentUser.avatar) ? 'none' : 'flex' }}
            >
              {currentUser.name.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate text-text-main dark:text-white">{currentUser.name}</span>
              <span className="text-xs text-text-muted truncate">{plan} Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-1 text-text-muted hover:text-text-main transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            {/* Breadcrumbs (Simple) */}
            <div className="hidden md:flex items-center gap-2 text-sm text-text-muted">
              <span>{location.pathname.split('/')[1] ? location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1) : 'Home'}</span>
              {location.pathname.split('/')[2] && (
                <>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <span className="font-semibold text-text-main dark:text-white">Details</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div ref={searchRef} className="relative hidden md:block group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[20px]">search</span>
              <input 
                className="h-10 w-64 rounded-full bg-background-light dark:bg-background-dark border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-text-muted/70 text-text-main dark:text-white" 
                placeholder="Search transcripts..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/meetings?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark z-50 overflow-hidden">
                  
                  <div className="px-3 py-2 border-b border-border-light dark:border-border-dark">
                    <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                      Meetings
                    </span>
                  </div>
                  
                  {suggestions.map((title, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        navigate(`/meetings?search=${encodeURIComponent(title)}`);
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-light dark:hover:bg-background-dark transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-text-muted text-[18px]">description</span>
                      <span className="text-sm text-text-main dark:text-white">
                        {title.split(new RegExp(`(${searchQuery})`, 'gi'))
                          .map((part, i) => 
                            part.toLowerCase() === searchQuery.toLowerCase() 
                              ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
                              : part
                          )
                        }
                      </span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      navigate(`/meetings?search=${encodeURIComponent(searchQuery)}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-t border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px]">search</span>
                    <span className="text-sm text-primary font-medium">
                      Search for "{searchQuery}"
                    </span>
                  </button>
                </div>
              )}
            </div>
            <div className="notification-bell relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative size-10 flex items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-muted hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark z-50 overflow-hidden">
                  
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
                    <span className="font-semibold text-sm text-text-main dark:text-white">
                      Notifications
                    </span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-text-muted hover:text-primary text-xs transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="divide-y divide-border-light dark:divide-border-dark">
                    
                    {meetings.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-text-muted mb-2 block">
                          notifications_none
                        </span>
                        <p className="text-sm text-text-muted">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      meetings.slice(0, 5).map((meeting) => (
                        <div 
                          key={meeting.id}
                          onClick={() => {
                            navigate(`/meetings/${meeting.id}`);
                            setShowNotifications(false);
                          }}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">mic</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main dark:text-white truncate">
                              {meeting.title || 'Untitled Meeting'}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {meeting.status === 'Done' 
                                ? 'Meeting processed successfully' 
                                : 'Meeting is being processed'}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {meeting.date}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                            meeting.status === 'Done' 
                              ? 'bg-green-400' 
                              : 'bg-primary'
                          }`} />
                        </div>
                      ))
                    )}
                  </div>

                  {meetings.length > 0 && (
                    <div className="px-4 py-3 border-t border-border-light dark:border-border-dark">
                      <button
                        onClick={() => {
                          navigate('/meetings');
                          setShowNotifications(false);
                        }}
                        className="text-sm text-primary hover:text-primary-dark font-medium transition-colors w-full text-center"
                      >
                        View all meetings →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggle}
              className="relative size-10 flex items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-muted hover:text-primary transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;