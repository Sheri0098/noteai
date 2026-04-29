import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { useDarkMode } from '../hooks/useDarkMode';
import { meetingService } from '../services/meetingService';

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

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  useEffect(() => {
    meetingService
      .getUsageSummary()
      .then((usage) => setPlan(usage.plan))
      .catch(() => setPlan('Free'));
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
            <div className="relative hidden md:block group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[20px]">search</span>
              <input className="h-10 w-64 rounded-full bg-background-light dark:bg-background-dark border-none pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 placeholder:text-text-muted/70 text-text-main dark:text-white" placeholder="Search transcripts..." type="text"/>
            </div>
            <button className="relative size-10 flex items-center justify-center rounded-full hover:bg-background-light dark:hover:bg-background-dark text-text-muted hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></span>
            </button>
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