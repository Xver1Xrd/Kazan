import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import { NAV_LINKS, ICON_LINKS } from '../data';
import ThemeToggle from './ThemeToggle';
import Magnetic from './Magnetic';

const ICONS = { heart: Heart };

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    drawerRef.current?.toggleAttribute('inert', !menuOpen);
    if (menuOpen) {
      firstLinkRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 bg-white/70 dark:bg-[#14231a]/80 backdrop-blur-md border-b border-white/60 dark:border-white/10 transition-shadow duration-300 ${
          scrolled ? 'shadow-lg shadow-black/5 dark:shadow-black/30' : ''
        }`}
      >
        <Link to="/#top" className="flex items-center gap-2 text-[#2d3a2a] dark:text-white">
          <span className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
            Казань<sup className="text-[10px] sm:text-xs font-medium">’26</sup>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/70 dark:bg-white/5 rounded-full pl-6 pr-1 py-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="relative text-sm px-3 py-2 font-medium text-[#4b5b47] dark:text-white/70 hover:text-[#1f2a1d] dark:hover:text-white transition-colors after:absolute after:left-3 after:right-3 after:bottom-0.5 after:h-[2px] after:rounded-full after:bg-current after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              {link.label}
            </Link>
          ))}
          <Magnetic className="ml-2">
            <Link
              to="/#route"
              className="block bg-[#1f2a1d] hover:bg-[#2a3827] dark:bg-white dark:hover:bg-white/90 text-white dark:text-[#1f2a1d] text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
            >
              Поехали!
            </Link>
          </Magnetic>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 text-[#2d3a2a] dark:text-white">
          {ICON_LINKS.map((link) => {
            const Icon = ICONS[link.icon];
            return (
              <Link
                key={link.href}
                to={link.href}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
          <button
            ref={toggleButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/60 dark:border-white/10 text-[#1f2a1d] dark:text-white transition-all duration-300 hover:bg-white/90 dark:hover:bg-white/20"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            <Menu
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        aria-hidden={!menuOpen}
        className={`lg:hidden fixed inset-0 z-20 transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      >
        <div className="absolute inset-0 bg-[#1f2a1d]/40 backdrop-blur-sm" />
      </div>

      {/* Mobile menu drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Меню навигации"
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-white/95 dark:bg-[#14231a]/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-8 pb-8">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                ref={i === 0 ? firstLinkRef : undefined}
                to={link.href}
                onClick={closeMenu}
                className={`text-2xl font-semibold text-[#1f2a1d] dark:text-white py-4 border-b border-[#1f2a1d]/10 dark:border-white/10 transition-all duration-500 ${
                  menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div
            className={`mt-8 flex flex-col gap-4 transition-all duration-500 ${
              menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}
          >
            {ICON_LINKS.map((link) => {
              const Icon = ICONS[link.icon];
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm font-medium text-[#2d3a2a] dark:text-white/80 sm:hidden"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/#route"
              onClick={closeMenu}
              className="mt-2 text-center bg-[#1f2a1d] hover:bg-[#2a3827] dark:bg-white dark:text-[#1f2a1d] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors"
            >
              Поехали!
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
