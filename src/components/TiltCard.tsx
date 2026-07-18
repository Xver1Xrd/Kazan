import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees */
  max?: number;
  /** Show a cursor-following glare highlight */
  glare?: boolean;
};

export default function TiltCard({ children, className, max = 8, glare = false }: Props) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 22 });

  const glareX = useTransform(px, (v) => v * 100);
  const glareY = useTransform(py, (v) => v * 100);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.16), transparent 55%)`;

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        className={`relative h-full ${className ?? ''}`}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - rect.left) / rect.width);
          py.set((e.clientY - rect.top) / rect.height);
        }}
        onMouseLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: glareBg }}
          />
        )}
      </motion.div>
    </div>
  );
}
