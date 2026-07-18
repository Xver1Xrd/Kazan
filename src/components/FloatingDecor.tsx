import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type Props = {
  emoji: string;
  className?: string;
  /** Parallax travel in px over the section's scroll range */
  speed?: number;
};

/** Blurred, semi-transparent emoji drifting at its own scroll speed. Desktop only. */
export default function FloatingDecor({ emoji, className, speed = 50 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <motion.span
      ref={ref}
      aria-hidden
      style={{ y, rotate }}
      className={`hidden sm:block absolute pointer-events-none select-none blur-[2px] opacity-[0.14] text-6xl md:text-7xl ${className ?? ''}`}
    >
      {emoji}
    </motion.span>
  );
}
