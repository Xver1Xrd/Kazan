import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from '../components/Reveal';

type Story = {
  title: string;
  place: string;
  text: string;
};

const STORIES: Story[] = [
  {
    title: 'Падающая башня Сююмбике',
    place: 'Казанский Кремль',
    text:
      'Башня наклонена почти на два метра — казанская «Пизанская башня». По легенде, Иван Грозный, поражённый красотой царицы Сююмбике, потребовал её руки. Та согласилась с условием: за семь дней построить башню выше всех в городе. Башню построили, а на седьмой день царица поднялась на верхний ярус и бросилась вниз. Историки, впрочем, датируют башню более поздним временем — но с легендой она интереснее.',
  },
  {
    title: 'Имам, давший имя мечети',
    place: 'Мечеть Кул-Шариф',
    text:
      'Кул Шариф — реальный человек, поэт и глава мусульман Казани XVI века. В октябре 1552 года он погиб, защищая город, вместе со своими учениками. Мечеть его имени открыли в 2005 году к тысячелетию Казани — она вмещает полторы тысячи человек, а её купол сделан в форме казанской шапки. Внутри хранится один из самых больших печатных Коранов в мире.',
  },
  {
    title: 'Коты на государственной службе',
    place: 'Памятник коту, улица Баумана',
    text:
      'В 1745 году императрица Елизавета Петровна велела прислать из Казани 30 котов «для ловли мышей» в Зимнем дворце — казанские коты славились как лучшие крысоловы империи. Их потомки до сих пор «служат» в Эрмитаже. На Баумана стоит памятник Коту Казанскому: ему трут нос на удачу, поэтому нос блестит.',
  },
  {
    title: 'Клад на дне озера',
    place: 'Озеро Кабан',
    text:
      'Перед взятием Казани в 1552 году ханскую казну — золото, серебро и драгоценности — по легенде утопили в озере Кабан, чтобы она не досталась войскам Ивана Грозного. Указали три ориентира, известные только хранителям. Казну искали веками, в том числе с водолазами, — не нашли до сих пор. Так что смотрите на воду внимательнее.',
  },
  {
    title: 'Дракон-основатель',
    place: 'Герб Казани',
    text:
      'Зилант — крылатый змей с герба города. По легенде, когда закладывали Казань, на этом месте жил гигантский змей; его победил богатырь (по другой версии — колдун убедил его переселиться на гору). Зиланта вы встретите по всему городу: на фонарях, оградах и станциях метро.',
  },
  {
    title: 'Свадебный десерт',
    place: 'Чак-чак',
    text:
      'Чак-чак — не просто сладость, а обрядовое блюдо: его подавали на свадьбах как символ склеенной воедино новой семьи и сладкой жизни. Тесто жарят в масле и скрепляют мёдом. В Казани есть отдельный музей чак-чака в Старо-Татарской слободе — с чаепитием по всем правилам.',
  },
];

export default function StoriesPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 md:px-10 bg-white dark:bg-[#0e1712]"
    >
      <div className="max-w-3xl mx-auto">
        <span className="text-sm font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-[0.18em]">
          Истории
        </span>
        <h1
          className="mt-3 text-3xl sm:text-4xl md:text-5xl font-normal text-[#1f2a1d] dark:text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          Истории <span className="font-accent font-semibold text-[#4b7a5a] dark:text-[#a9cbad]">мест</span>
        </h1>
        <p className="mt-4 text-[#4b5b47] dark:text-white/60 max-w-xl">
          Легенды и факты о местах из нашего маршрута — чтобы, стоя перед башней или озером, знать, на что смотрим.
        </p>

        <div className="mt-14 flex flex-col gap-10">
          {STORIES.map((story, i) => (
            <Reveal key={story.title} delay={0.05}>
              <article className="relative rounded-3xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] p-7 sm:p-9 overflow-hidden">
                <span
                  aria-hidden
                  className="absolute -top-4 -right-1 text-[4.5rem] font-extrabold leading-none text-[#1f2a1d]/[0.05] dark:text-white/[0.05] select-none"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-[#4b7a5a] dark:text-[#a9cbad] uppercase tracking-[0.15em]">
                  {story.place}
                </span>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#1f2a1d] dark:text-white mt-2 mb-3">
                  {story.title}
                </h2>
                <p className="text-sm sm:text-base text-[#4b5b47] dark:text-white/60 leading-relaxed">{story.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <Link
            to="/#route"
            className="mt-12 inline-flex items-center gap-2 text-[#1f2a1d] dark:text-white text-sm font-semibold hover:gap-3 transition-all"
          >
            К маршруту
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </div>
    </motion.main>
  );
}
