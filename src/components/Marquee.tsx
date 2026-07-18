const ITEMS = ['Казань', '24–28 июля', 'только ты и я', 'кыстыбый', 'закаты над Казанкой', 'Кремль', 'чак-чак'];

function Row({ suffix }: { suffix: string }) {
  return (
    <>
      {ITEMS.map((item) => (
        <span key={`${item}-${suffix}`} className="flex items-center gap-6 sm:gap-10 shrink-0">
          <span className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em]">{item}</span>
          <span aria-hidden className="text-[#85AB8B]">✦</span>
        </span>
      ))}
    </>
  );
}

export default function Marquee() {
  return (
    <div
      aria-hidden
      className="marquee-host relative overflow-hidden py-4 sm:py-5 bg-[#1f2a1d] dark:bg-[#0a120d] text-white/80 border-y border-white/10"
    >
      <div className="marquee-track flex w-max gap-6 sm:gap-10">
        <Row suffix="a" />
        <Row suffix="b" />
      </div>
    </div>
  );
}
