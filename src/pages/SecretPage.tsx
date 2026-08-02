import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Unlock, Mail, MailOpen, RotateCcw } from 'lucide-react';
import { SECRET_STAGES, SECRET_LETTER, STORAGE_KEY, HINT_INTERVAL_DAYS, hashAnswer } from '../secret';
import { celebrate } from '../trip';

type SecretState = {
  firstVisit: number;
  stage: number; // 0..4; 4 = решено всё
  foundAt?: number;
};

function loadState(): SecretState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && typeof raw.firstVisit === 'number' && typeof raw.stage === 'number') return raw;
  } catch {
    // повреждённое состояние — начинаем заново
  }
  return { firstVisit: Date.now(), stage: 0 };
}

function daysUntil(ts: number): number {
  return Math.ceil((ts - Date.now()) / 86_400_000);
}

function Letter({ foundAt }: { foundAt?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-xl mx-auto text-center"
    >
      <Heart className="w-10 h-10 mx-auto text-[#c7e0cb] fill-[#c7e0cb]" />
      <h1 className="mt-6 text-3xl sm:text-5xl font-normal" style={{ letterSpacing: '-0.02em' }}>
        {SECRET_LETTER.title}
      </h1>
      <div className="mt-8 flex flex-col gap-5 text-left">
        {SECRET_LETTER.paragraphs.map((p) => (
          <p key={p} className="text-white/85 leading-relaxed text-base sm:text-lg">
            {p}
          </p>
        ))}
      </div>
      <p className="mt-8 font-accent font-semibold text-xl text-[#c7e0cb]">{SECRET_LETTER.signature}</p>
      {foundAt && (
        <div className="mt-10 inline-flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-6 py-4">
          <span className="text-xs text-white/50">
            открыто{' '}
            {new Date(foundAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function SecretPage() {
  const [state, setState] = useState<SecretState>(loadState);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const celebrated = useRef(false);

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    celebrated.current = false;
    setState({ firstVisit: Date.now(), stage: 0 });
    setAnswer('');
    setHintOpen(false);
    setConfirmReset(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const solvedAll = state.stage >= SECRET_STAGES.length;

  useEffect(() => {
    if (solvedAll && !celebrated.current) {
      celebrated.current = true;
      celebrate();
    }
  }, [solvedAll]);

  const stage = SECRET_STAGES[state.stage];
  const hintUnlockAt = state.firstVisit + state.stage * HINT_INTERVAL_DAYS * 86_400_000;
  const hintAvailable = Date.now() >= hintUnlockAt;

  const submit = async () => {
    if (!answer.trim() || checking || !stage) return;
    setChecking(true);
    const hash = await hashAnswer(answer);
    if (stage.answerHashes.includes(hash)) {
      const nextStage = state.stage + 1;
      setState((s) => ({
        ...s,
        stage: nextStage,
        foundAt: nextStage >= SECRET_STAGES.length ? Date.now() : s.foundAt,
      }));
      setAnswer('');
      setHintOpen(false);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 900);
    }
    setChecking(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-28 bg-[#101c14] text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-[#4b7a5a]/20 blur-3xl pointer-events-none"
      />

      <div className="relative w-full max-w-lg">
        {solvedAll ? (
          <Letter foundAt={state.foundAt} />
        ) : (
          <>
            <div className="text-center">
              <motion.div
                key={state.stage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/15"
              >
                {state.stage >= SECRET_STAGES.length - 1 ? (
                  <Unlock className="w-7 h-7 text-[#a9cbad]" />
                ) : (
                  <Lock className="w-7 h-7 text-[#a9cbad]" />
                )}
              </motion.div>
              <h1 className="mt-5 text-2xl sm:text-3xl font-normal" style={{ letterSpacing: '-0.02em' }}>
                Ты <span className="font-accent font-semibold text-[#c7e0cb]">нашла</span> тайную страницу
              </h1>
              <p className="mt-3 text-sm text-white/60 max-w-sm mx-auto">
                Четыре зашифрованных вопроса. Сначала расшифруй вопрос, потом ответь на него — и замок откроется.
              </p>

              {/* Progress hearts */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {SECRET_STAGES.map((s, i) => (
                  <Heart
                    key={s.title}
                    className={`w-4 h-4 transition-all duration-500 ${
                      i < state.stage ? 'text-[#c7e0cb] fill-[#c7e0cb] scale-110' : 'text-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={state.stage}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10"
              >
                <div className="rounded-3xl border border-white/15 bg-[#16241a]/80 backdrop-blur-md p-6 sm:p-8">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#a9cbad] font-semibold">
                    {stage.title} · {state.stage + 1} из {SECRET_STAGES.length}
                  </span>
                  <p className="mt-4 font-mono text-base sm:text-lg leading-relaxed text-[#c7e0cb] break-words select-all">
                    {stage.ciphertext}
                  </p>

                  <motion.div animate={error ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
                    <div className="mt-6 flex gap-2">
                      <input
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        placeholder="Ответ на вопрос…"
                        autoCapitalize="off"
                        autoCorrect="off"
                        className={`flex-1 min-w-0 rounded-full bg-white/5 border px-5 py-3 text-sm text-white placeholder-white/40 focus:outline-none transition-colors ${
                          error ? 'border-red-400/70' : 'border-white/15 focus:border-[#a9cbad]/60'
                        }`}
                      />
                      <button
                        onClick={submit}
                        disabled={checking}
                        className="rounded-full bg-white text-[#1f2a1d] text-sm font-semibold px-5 py-3 hover:bg-white/90 transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
                      >
                        Проверить
                      </button>
                    </div>
                  </motion.div>
                  {error && <p className="mt-3 text-xs text-red-300/80">Не подходит. Подумай ещё — или дождись подсказки.</p>}
                </div>

                {/* Hint envelope */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  {hintAvailable ? (
                    hintOpen ? (
                      <div className="flex items-start gap-3">
                        <MailOpen className="w-4 h-4 text-[#a9cbad] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-white/75 leading-relaxed">{stage.hint}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setHintOpen(true)}
                        className="flex items-center gap-3 text-sm text-[#a9cbad] hover:text-[#c7e0cb] transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Открыть подсказку
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-white/40">
                      <Mail className="w-4 h-4" />
                      Подсказка откроется через {daysUntil(hintUnlockAt)}{' '}
                      {daysUntil(hintUnlockAt) === 1 ? 'день' : daysUntil(hintUnlockAt) < 5 ? 'дня' : 'дней'}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Reset progress */}
        <div className="mt-12 text-center">
          {confirmReset ? (
            <div className="inline-flex items-center gap-3 text-xs text-white/60">
              <span>Сбросить весь прогресс квеста?</span>
              <button
                onClick={resetProgress}
                className="rounded-full border border-red-400/40 text-red-300/90 px-4 py-1.5 hover:bg-red-400/10 transition-colors"
              >
                Да, сбросить
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-full border border-white/15 px-4 py-1.5 hover:bg-white/5 transition-colors"
              >
                Оставить
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Сбросить прогресс
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
