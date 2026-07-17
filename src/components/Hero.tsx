import { Play, Sparkles } from 'lucide-react';
import BoomerangVideoBg from '../BoomerangVideoBg';

const BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4';

export default function Hero() {
  return (
    <section id="top" className="relative w-full min-h-screen sm:h-screen overflow-hidden scroll-mt-16">
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />
      {/* Scrim: guarantees text legibility whether or not the video has loaded */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55" />

      {/* Hero copy */}
      <div className="relative z-10 flex flex-col items-center text-center pt-28 sm:pt-32 md:pt-36 px-4 sm:px-6">
        <h1
          className="font-normal leading-[0.95] text-white text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl"
          style={{ letterSpacing: '-0.035em' }}
        >
          Наше маленькое{' '}
          <span className="text-[#c7e0cb]">
            путешествие
            <br className="hidden sm:block" /> в сердце Казани
          </span>
        </h1>
        <p className="mt-6 sm:mt-8 text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-md px-2">
          Кремль и Кул-Шариф, прогулки по Баумана, чак-чак и закаты над Волгой — всё это мы увидим вместе.
        </p>
      </div>

      {/* Bottom-left CTA block */}
      <div className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 z-10 max-w-sm">
        <div className="flex items-center gap-2 text-white/95 mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">
            Только ты и я<sup className="text-[10px]">♥</sup>
          </span>
        </div>
        <p className="text-white/85 text-xs leading-relaxed mb-6 max-w-xs">
          Три дня вдвоём: старый город, набережная Казанки, татарская кухня и места, которые запомнятся только нам.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href="#route"
            className="bg-white hover:bg-white/90 text-[#1f2a1d] text-sm font-semibold px-6 py-3 rounded-full transition-colors shadow-sm"
          >
            Смотреть план
          </a>
          <a href="#checklist" className="text-white text-sm font-medium hover:opacity-80 transition-opacity">
            Что возьмём с собой?
          </a>
        </div>
      </div>

      {/* Bottom-right video link */}
      <a
        href="#memories"
        className="hidden sm:flex absolute right-6 md:right-10 bottom-8 md:bottom-10 z-10 items-center gap-2 text-white/90 text-sm hover:text-white transition-colors"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm">
          <Play className="w-3 h-3 fill-white text-white ml-0.5" />
        </span>
        <span className="font-medium">Что нас ждёт?</span>
      </a>
    </section>
  );
}
