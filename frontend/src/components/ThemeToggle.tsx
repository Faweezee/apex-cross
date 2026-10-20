'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from '@/components/icons';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'apexcross-theme';

type Theme = 'dark' | 'light';

/**
 * Dark / light theme toggle — DESIGN_SYSTEM.md §8.4.
 * Single Sun/Moon icon, 40x40 hit area, persists to localStorage under `apexcross-theme`.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initial: Theme = stored === 'light' ? 'light' : 'dark';
      setTheme(initial);
      document.documentElement.classList.toggle('dark', initial === 'dark');
      document.documentElement.dataset.theme = initial;
    } catch {
      /* localStorage unavailable — stay on dark */
    }
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failure */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.dataset.theme = next;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      data-theme={theme}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'glass-inline flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        'text-text-secondary transition-colors duration-200 hover:text-mint',
        className,
      )}
    >
      {mounted && !isDark ? (
        <Sun size={17} weight="regular" aria-hidden="true" />
      ) : (
        <Moon size={17} weight="regular" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
