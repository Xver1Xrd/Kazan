import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme';

type DocumentWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const onToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as DocumentWithVT;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || prefersReduced) {
      toggleTheme();
      return;
    }

    // Circular "wave" from the toggle button (View Transitions API).
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    // Freeze every CSS transition for the duration of the wave: otherwise both
    // snapshots keep animating their own colors and the sweep looks jerky.
    const root = document.documentElement;
    root.classList.add('theme-switching');

    const transition = doc.startViewTransition(() => {
      flushSync(() => toggleTheme());
    });
    transition.ready.then(() => {
      const wave = root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
        {
          duration: 700,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
      wave.finished.finally(() => root.classList.remove('theme-switching'));
    });
    transition.finished.finally(() => root.classList.remove('theme-switching'));
  };

  return (
    <button
      onClick={onToggle}
      aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-[#1f2a1d] dark:text-white transition-colors hover:bg-white/90 dark:hover:bg-white/20"
    >
      <Sun className={`w-4 h-4 sm:w-5 sm:h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 sm:w-5 sm:h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
    </button>
  );
}
