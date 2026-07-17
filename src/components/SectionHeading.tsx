import type { ReactNode } from 'react';
import Reveal from './Reveal';

type Props = {
  number: string;
  label: string;
  title: ReactNode;
  text?: ReactNode;
};

export default function SectionHeading({ number, label, title, text }: Props) {
  return (
    <Reveal className="relative">
      <span
        aria-hidden
        className="absolute -top-10 sm:-top-16 right-0 text-[6rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter text-[#1f2a1d]/[0.04] dark:text-white/[0.04] select-none pointer-events-none"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {number}
      </span>
      <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-[0.18em]">
        {label}
      </span>
      <h2
        className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white max-w-2xl"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {text && <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">{text}</p>}
    </Reveal>
  );
}
