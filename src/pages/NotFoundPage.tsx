import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#1f2a1d] dark:bg-[#0a120d] text-white relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-[#4b7a5a]/20 blur-3xl pointer-events-none"
      />
      <span
        aria-hidden
        className="text-[8rem] sm:text-[12rem] font-extrabold leading-none text-white/[0.06] select-none"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        404
      </span>
      <MapPin className="w-8 h-8 text-[#a9cbad] -mt-6 mb-6" />
      <h1 className="text-3xl sm:text-4xl font-normal" style={{ letterSpacing: '-0.02em' }}>
        Кажется, мы <span className="font-accent font-semibold text-[#c7e0cb]">свернули не туда</span>
      </h1>
      <p className="mt-4 text-white/60 max-w-sm">
        Такой страницы нет — но в Казани заблудиться не страшно: все дороги ведут к Кремлю.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#1f2a1d] text-sm font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-[0.98]"
      >
        <ArrowLeft className="w-4 h-4" />
        Обратно к маршруту
      </Link>
    </motion.main>
  );
}
