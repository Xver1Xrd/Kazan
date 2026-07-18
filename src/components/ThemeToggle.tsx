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
    const x = e.clientX;
    const y = e.clientY;
    const maxRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = doc.startViewTransition(() => {
      flushSync(() => toggleTheme());
    });
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
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
