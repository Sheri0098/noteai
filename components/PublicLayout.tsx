import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-full bg-background-light dark:bg-background-dark overflow-y-auto">
      <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-white/10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur shrink-0">
        <div className="flex items-center justify-between whitespace-nowrap px-6 py-3 mx-auto max-w-[1280px]">
          <Link to="/" className="flex items-center gap-3 text-text-main dark:text-white group">
            <div className="size-8 text-primary group-hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-3xl">auto_awesome</span>
            </div>
            <span className="text-xl font-bold leading-tight tracking-tight">NoteAI</span>
          </Link>
          
          <nav className="flex items-center gap-8 hidden md:flex">
             <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
             <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">About</Link>
             <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          </nav>

          <div className="flex gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium text-text-main dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              Log In
            </button>
            <button onClick={() => navigate('/signup')} className="flex h-9 items-center justify-center rounded-lg bg-primary hover:bg-primary-dark transition-colors px-4 text-sm font-bold text-white shadow-sm">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full shrink-0 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border-light dark:border-white/10 bg-surface-light dark:bg-surface-dark py-12 shrink-0">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-2 text-text-main dark:text-white">
               <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              <span className="text-lg font-bold">NoteAI</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              Making meetings actionable again with the power of artificial intelligence.
            </p>
          </div>
          <div className="flex gap-16 flex-wrap">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-text-main dark:text-white text-sm">Product</h4>
              <Link to="/" className="text-sm text-text-muted hover:text-primary transition-colors">Features</Link>
              <Link to="/pricing" className="text-sm text-text-muted hover:text-primary transition-colors">Pricing</Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-text-main dark:text-white text-sm">Company</h4>
              <Link to="/about" className="text-sm text-text-muted hover:text-primary transition-colors">About Us</Link>
              <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Contact</a>
            </div>
             <div className="flex flex-col gap-4">
              <h4 className="font-bold text-text-main dark:text-white text-sm">Legal</h4>
              <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-sm text-text-muted hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 mt-12 pt-8 border-t border-border-light dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">© 2024 NoteAI Inc. All rights reserved.</p>
          <div className="flex gap-4 text-text-muted">
            <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">public</span></a>
            <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">alternate_email</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;