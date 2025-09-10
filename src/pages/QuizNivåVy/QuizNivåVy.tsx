import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";
import { topicApi, TopicLevelStatusDto, TopicProgressDto } from "../../Api/TopicsApi/topics";

/* icons (unchanged) */
function LockIcon({ className = "h-6 w-6", ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function StarIcon({ className = "h-6 w-6", ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...rest}>
      <path d="M12 2.2l2.7 5.7 6.2.9-4.6 4.3 1.1 6.3-5.4-2.8-5.4 2.8 1.1-6.3L3.1 8.8l6.2-.9L12 2.2z" />
    </svg>
  );
}

export default function QuizNivåVy(): React.ReactElement {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const [params] = useSearchParams();
  const classId = params.get("classId") ?? "";
  const navigate = useNavigate();

  const [progress, setProgress] = useState<TopicProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    setErr(null);
    topicApi
      .getProgress(topicId)
      .then(setProgress)
      .catch((e) => setErr(e?.message ?? "Kunde inte hämta progression"))
      .finally(() => setLoading(false));
  }, [topicId]);

  const items: TopicLevelStatusDto[] = progress?.levels ?? [];
  const pct = useMemo(
    () => (!progress || progress.totalLevels === 0 ? 0 : Math.min(100, Math.round((progress.completedLevels / progress.totalLevels) * 100))),
    [progress]
  );

  const activeLevel = useMemo(
    () => items.find((l) => l.isUnlocked && !l.isCompleted) ?? items[items.length - 1],
    [items]
  );
  const allDone = items.length > 0 && items.every((l) => l.isCompleted);

  const startQuiz = (lvl: TopicLevelStatusDto) => {
    navigate(`/quizzes/start?topicId=${topicId}&levelId=${lvl.levelId}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0F1F] text-white overflow-x-hidden">
      {/* Hero */}
      <div className="relative h-48 md:h-56 overflow-hidden rounded-b-[28px] bg-gradient-to-r from-[#5A39E6] via-[#4F2ACB] to-[#4A2BC3]">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(173,140,255,0.95),rgba(123,76,255,0.5)_58%,transparent_72%)]" />
        <img src={frageTitle} alt="FrågeFejden" className="absolute left-4 top-4 h-14 md:h-20 object-contain" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 ring-2 ring-white/25">
          <img src={avatar} alt="Profil" className="h-[72px] w-[72px] rounded-full ring-2 ring-white/80 object-cover" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 md:px-8 pt-8 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[26px] md:text-[28px] font-semibold text-white/90">
              {loading ? "Hämtar kurs..." : progress ? `${progress.subjectName} • ${progress.topicName}` : "Kurs"}
            </h2>
            {!!progress && (
              <span className="mt-1 text-sm text-white/70">
                {progress.completedLevels} av {progress.totalLevels} nivåer klara • XP: {progress.userXp}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/subjects/${progress?.subjectId}/topics?classId=${classId}`)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
            >
              ← Tillbaka till kurser
            </button>
            {!!classId && (
              <button
                onClick={() => navigate(`/classes/${classId}/subjects`)}
                className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
              >
                Ämnen
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mx-auto mt-2 w-full max-w-4xl">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-white/90">
            {loading || !progress ? "Laddar..." : `${progress.completedLevels} av ${progress.totalLevels} nivåer klara`}
          </div>
          <div className="h-[4px] w-full rounded bg-white/15">
            <div className="h-full rounded bg-[#E9C341]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Levels carousel */}
        <div className="mt-6">
          <TopLevelsBar
            items={items}
            activeId={!allDone ? activeLevel?.levelId ?? null : null}
            onStartQuiz={startQuiz}
            allDone={allDone}
          />
        </div>

        {/* CTA */}
        {!allDone && activeLevel && (
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2 rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold text-white/90">Redo för nivå {activeLevel.levelNumber}?</h3>
              <p className="mt-2 text-sm text-white/70">
                Starta quizet för att låsa upp nästa nivå.
              </p>
            </section>

            <aside className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
              <h3 className="text-sm font-semibold text-white/90">Quiz</h3>
              <button
                onClick={() => startQuiz(activeLevel)}
                className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
              >
                Starta quiz för nivå {activeLevel.levelNumber}
              </button>
            </aside>
          </div>
        )}

        {/* All done banner */}
        {allDone && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600/15 px-4 py-2 ring-1 ring-emerald-400/30">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-semibold text-emerald-200">Alla nivåer klara! Grymt jobbat!</span>
          </div>
        )}

        {err && <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}
      </div>
    </div>
  );
}

/* Top Levels Bar — unchanged logic, nicer focus states */
function TopLevelsBar({
  items,
  activeId,
  onStartQuiz,
  allDone,
}: {
  items: TopicLevelStatusDto[];
  activeId: string | null;
  onStartQuiz: (lvl: TopicLevelStatusDto) => void;
  allDone: boolean;
}) {
  const [visibleStartIndex, setVisibleStartIndex] = React.useState(0);
  const VISIBLE_COUNT = 5;

  const clampStart = (n: number) =>
    Math.max(0, Math.min(n, Math.max(0, items.length - VISIBLE_COUNT)));

  React.useEffect(() => {
    if (!activeId || allDone) return;
    const idx = items.findIndex((x) => x.levelId === activeId);
    if (idx === -1) return;
    const idealStart = clampStart(idx - Math.floor(VISIBLE_COUNT / 2));
    if (idealStart !== visibleStartIndex) setVisibleStartIndex(idealStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, allDone, items.length]);

  const visibleItems = items.slice(visibleStartIndex, visibleStartIndex + VISIBLE_COUNT);

  return (
    <section>
      <div className="relative">
        {visibleStartIndex > 0 && !allDone && (
          <button
            type="button"
            onClick={() => setVisibleStartIndex(clampStart(visibleStartIndex - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 rounded-full bg-[#11182B] p-2 ring-1 ring-white/20 hover:bg-[#1A2332] focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            aria-label="Visa föregående nivåer"
          >
            <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {visibleStartIndex + VISIBLE_COUNT < items.length && !allDone && (
          <button
            type="button"
            onClick={() => setVisibleStartIndex(clampStart(visibleStartIndex + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 rounded-full bg-[#11182B] p-2 ring-1 ring-white/20 hover:bg-[#1A2332] focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            aria-label="Visa nästa nivåer"
          >
            <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="flex justify-center gap-6 py-4 px-8">
          {allDone ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-600/15 px-6 py-4 ring-1 ring-emerald-400/30">
              <span className="text-3xl">🏆</span>
              <div className="text-sm leading-tight">
                <div className="font-semibold text-emerald-200">Alla nivåer klara!</div>
                <div className="text-emerald-100/90">Fantastiskt jobbat!</div>
              </div>
            </div>
          ) : (
            visibleItems.map((lvl) => {
              const isCompleted = lvl.isCompleted;
              const isUnlocked = lvl.isUnlocked && !isCompleted;
              const isActive = activeId === lvl.levelId;
              const bubbleSize = "h-[72px] w-[72px]";

              return (
                <div key={`${lvl.levelId}-${visibleStartIndex}`} className="flex flex-col items-center min-w-[80px]" title={`Nivå ${lvl.levelNumber}`}>
                  {isCompleted ? (
                    <div
                      className={`relative grid ${bubbleSize} place-items-center rounded-full
                        bg-gradient-to-b from-emerald-400 to-emerald-600
                        text-[20px] font-bold text-white shadow-[0_22px_60px_rgba(16,185,129,0.35)]
                        ${isActive ? "ring-2 ring-emerald-300/80" : ""}`}
                    >
                      {lvl.levelNumber}
                      <div className="pointer-events-none absolute -inset-3 rounded-full bg-emerald-500/25 blur-[16px]" />
                    </div>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onStartQuiz(lvl)}
                      aria-label={`Starta nivå ${lvl.levelNumber}`}
                      className="flex flex-col items-center focus:outline-none group"
                    >
                      <div
                        className={`relative grid ${bubbleSize} place-items-center rounded-full
                          bg-gradient-to-b from-[#8B5CF6] to-[#4F2ACB] text-white
                          shadow-[0_22px_60px_rgba(79,42,203,0.45)]
                          ${isActive ? "ring-2 ring-violet-300/80" : ""}`}
                      >
                        <StarIcon className="h-8 w-8" />
                        <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#6B46F2]/30 blur-[16px]" />
                      </div>
                    </button>
                  ) : (
                    <div
                      className={`grid ${bubbleSize} place-items-center rounded-full
                        bg-[#12192B] text-white/85 ring-1 ring-[#2A3760]/60
                        ${isActive ? "ring-2 ring-white/40" : ""}`}
                    >
                      <LockIcon className="h-7 w-7" />
                    </div>
                  )}
                  <div className={`mt-3 text-xs font-medium text-center ${isActive ? "text-white" : "text-white/70"}`}>
                    Nivå {lvl.levelNumber}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!allDone && items.length > VISIBLE_COUNT && (
          <div className="mt-1 flex justify-center gap-1.5">
            {Array.from({ length: Math.max(1, Math.ceil(items.length / VISIBLE_COUNT)) }).map((_, i) => {
              const isOnPage = Math.floor(visibleStartIndex / VISIBLE_COUNT) === i;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => setVisibleStartIndex(clampStart(i * VISIBLE_COUNT))}
                  className={`h-1.5 rounded-full transition-all duration-200 ${isOnPage ? "w-5 bg-white/80" : "w-1.5 bg-white/30 hover:bg-white/50"}`}
                  aria-label={`Gå till nivågrupp ${i + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
