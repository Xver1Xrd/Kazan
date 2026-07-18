import { useEffect, useRef, useState } from 'react';
import { NotebookPen, Check } from 'lucide-react';

/** Personal per-day travel journal, stored on this device only. */
export default function DayJournal({ slug }: { slug: string }) {
  const storageKey = `kazan-journal-${slug}`;
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setText(localStorage.getItem(storageKey) ?? '');
    setSaved(false);
  }, [storageKey]);

  const onChange = (value: string) => {
    setText(value);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(storageKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  return (
    <div className="mt-10 rounded-3xl border border-black/5 dark:border-white/10 bg-[#fbfcfa] dark:bg-white/[0.03] p-6 sm:p-7">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#1f2a1d] dark:text-white">
          <NotebookPen className="w-4 h-4 text-[#4b7a5a] dark:text-[#a9cbad]" />
          Дневник дня
        </span>
        <span
          className={`flex items-center gap-1 text-xs text-[#4b7a5a] dark:text-[#a9cbad] transition-opacity duration-300 ${
            saved ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          сохранено
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Как прошёл этот день? Пара предложений вечером — а перечитывать будем годами…"
        className="w-full resize-y rounded-2xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3 text-sm text-[#1f2a1d] dark:text-white placeholder-[#4b5b47]/50 dark:placeholder-white/30 leading-relaxed focus:outline-none focus:border-[#4b7a5a]/50 dark:focus:border-[#a9cbad]/50 transition-colors"
      />
      <p className="mt-2 text-[11px] text-[#4b5b47]/70 dark:text-white/30">
        Хранится только на этом устройстве.
      </p>
    </div>
  );
}
