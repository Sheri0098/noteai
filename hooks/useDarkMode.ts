import { useEffect, useState } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('noteai_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('noteai_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('noteai_theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);
  return { isDark, toggle };
};
