import { motion, useSpring } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** How strongly the content is pulled toward the cursor (0..1) */
  strength?: number;
  className?: string;
};

/** Wraps a button/link so it gently drifts toward the cursor. */
export default function Magnetic({ children, strength = 0.3, className }: Props) {
  const x = useSpring(0, { stiffness: 180, damping: 14, mass: 0.3 });
  const y = useSpring(0, { stiffness: 180, damping: 14, mass: 0.3 });

  return (
    <motion.div
      className={`inline-block ${className ?? ''}`}
      style={{ x, y }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
