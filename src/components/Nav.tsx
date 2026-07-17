import { useEffect, useRef, useState } from 'react';
import { Heart, MapPin, Menu, X } from 'lucide-react';
import { NAV_LINKS, ICON_LINKS } from '../data';

const ICONS = { heart: Heart, 'map-pin': MapPin };

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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
      <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 bg-white/70 backdrop-blur-md border-b border-white/60">
        <a href="#top" className="flex items-center gap-2 text-[#2d3a2a]">
          <span className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
            Казань<sup className="text-[10px] sm:text-xs font-medium">’26</sup>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-1 bg-white/70 rounded-full pl-6 pr-1 py-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm px-3 py-2 font-medium text-[#4b5b47] hover:text-[#1f2a1d] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#route"
            className="ml-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Поехали!
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 text-[#2d3a2a]">
          {ICON_LINKS.map((link) => {
            const Icon = ICONS[link.icon];
            return (
              <a
                key={link.href}
                href={link.href}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </a>
            );
          })}
          <button
            ref={toggleButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-[#1f2a1d] transition-all duration-300 hover:bg-white/90"
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
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-8 pb-8">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                ref={i === 0 ? firstLinkRef : undefined}
                href={link.href}
                onClick={closeMenu}
                className={`text-2xl font-semibold text-[#1f2a1d] py-4 border-b border-[#1f2a1d]/10 transition-all duration-500 ${
                  menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms' }}
              >
                {link.label}
              </a>
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
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-sm font-medium text-[#2d3a2a] sm:hidden"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </a>
              );
            })}
            <a
              href="#route"
              onClick={closeMenu}
              className="mt-2 text-center bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors"
            >
              Поехали!
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
