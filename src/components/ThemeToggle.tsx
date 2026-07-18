import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-[#1f2a1d] dark:text-white transition-colors hover:bg-white/90 dark:hover:bg-white/20"
    >
      <Sun className={`w-4 h-4 sm:w-5 sm:h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 sm:w-5 sm:h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
    </button>
  );
}
