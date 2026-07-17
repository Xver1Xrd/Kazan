import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-50 bg-gradient-to-r from-[#4b7a5a] via-[#85AB8B] to-[#c7e0cb]"
      style={{ scaleX }}
    />
  );
}
