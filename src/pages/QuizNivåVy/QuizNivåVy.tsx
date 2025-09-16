// pages/QuizNivåVy/QuizNivåVy.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";
import globe from "../../assets/images/icons/geografy-icon.png";
import bulb from "../../assets/images/pictures/fun-fact-pic.png";
import { QuizzesApi } from "../../Api/QuizApi/Quizzes";


import {
  topicApi,
  type TopicLevelStatusDto,
  type TopicProgressDto,
  type LevelStudyDto,
  type LevelStudyReadStatusDto,
} from "../../Api/TopicsApi/topics";

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

/* ===================== Page ===================== */
export default function QuizNivåVy(): React.ReactElement {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const [params] = useSearchParams();
  const classId = params.get("classId") ?? ""; // reserved for future routing
  const navigate = useNavigate();

  const [progress, setProgress] = useState<TopicProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ---- backend study text + read status ----
  const [study, setStudy] = useState<LevelStudyDto | null>(null);
  const [readStatus, setReadStatus] = useState<LevelStudyReadStatusDto | null>(null);
  const isStudyRead = !!readStatus?.hasReadStudyText;

  // Reader modal
  const [readerOpen, setReaderOpen] = useState(false);

  // Allow selecting previous/unlocked levels to view their study in the left panel
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  // Fetch topic progress (levels come from DB; totalLevels reflects DB count)
  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    setErr(null);
    setSelectedLevelId(null);
    topicApi
      .getProgress(topicId)
      .then((p) => setProgress(p))
      .catch((e) => setErr(e?.message ?? "Kunde inte hämta progression"))
      .finally(() => setLoading(false));
  }, [topicId]);

  const items: TopicLevelStatusDto[] = progress?.levels ?? [];

  const activeLevel = useMemo(() => {
    if (items.length === 0) return undefined;
    const fromSelection = selectedLevelId ? items.find((l) => l.levelId === selectedLevelId) : undefined;
    if (fromSelection) return fromSelection;
    // Default: first unlocked & not completed, else last level
    return items.find((l) => l.isUnlocked && !l.isCompleted) ?? items[items.length - 1];
  }, [items, selectedLevelId]);

  const allDone = items.length > 0 && items.every((l) => l.isCompleted);
  const activeLevelNumber = activeLevel?.levelNumber ?? 1;

  const pct = useMemo(
    () =>
      !progress || progress.totalLevels === 0
        ? 0
        : Math.min(100, Math.round((progress.completedLevels / progress.totalLevels) * 100)),
    [progress]
  );


  // Load study + read status for active level (API-only, no placeholders)
  useEffect(() => {
    if (!topicId || !activeLevel) {
      setStudy(null);
      setReadStatus(null);
      return;
    }
    let mounted = true;

    (async () => {
      try {
        const [s, r] = await Promise.all([
          topicApi.getLevelStudy(topicId, activeLevel.levelId).catch(() => null),
          topicApi.getStudyReadStatus(topicId, activeLevel.levelId).catch(() => null),
        ]);
        if (!mounted) return;
        setStudy(s);
        setReadStatus(r);
      } catch (e: any) {
        if (!mounted) return;
        console.warn("Study/read load failed", e?.message || e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [topicId, activeLevel?.levelId]);

  // Start quiz: only requires study-read if backend study exists
  const startQuiz = async (lvl: TopicLevelStatusDto) => {
    try {
      if (study?.studyText) {
        const status = readStatus ?? (await topicApi.getStudyReadStatus(topicId, lvl.levelId));
        if (!status?.hasReadStudyText) {
          alert("Du måste läsa studiematerialet för denna nivå innan du kan starta quizet.");
          return;
        }
      }
      navigate(`/quizzes/start?topicId=${topicId}&levelId=${lvl.levelId}`);
    } catch (e: any) {
      alert(e?.message ?? "Kunde inte starta quiz.");
    }
  };


  // Mark study as read (backend only)
  const markReadAndClose = async () => {
    try {
      if (activeLevel && study?.studyText) {
        const newStatus = await topicApi.markStudyRead(topicId, activeLevel.levelId);
        setReadStatus(newStatus);
      }
    } finally {
      setReaderOpen(false);
    }
  };

  // Subject icon (if provided by API)
  // @ts-expect-error: subjectIconUrl is an optional field your API may add
  const subjectIcon: string = (progress?.subjectIconUrl as string | undefined) || globe;

  return (
    <div className="min-h-screen w-full bg-[#0A0F1F] text-white overflow-x-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { height: 8px; width: 8px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* Header */}
      <div className="w-full">
        <div className="relative h-48 md:h-56 overflow-hidden rounded-b-[28px] bg-gradient-to-r from-[#5A39E6] via-[#4F2ACB] to-[#4A2BC3]">
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(173,140,255,0.95),rgba(123,76,255,0.5)_58%,transparent_72%)]" />
          <img src={frageTitle} alt="FrågeFejden" className="absolute left-4 top-4 h-14 md:h-20 object-contain max-w-full" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 ring-2 ring-white/25">
            <img src={avatar} alt="Profil" className="h-[72px] w-[72px] rounded-full ring-2 ring-white/80 object-cover" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 md:px-8 pt-8 pb-16">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-center text-[26px] font-semibold text-white/90 md:text-[28px]">
              {loading
                ? "Hämtar kurs..."
                : progress
                  ? `Du har valt kursen: ${progress.subjectName} • ${progress.topicName}`
                  : "Kurs"}
            </h2>
            <img
              src={subjectIcon}
              alt="Ämnesikon"
              className="h-6 w-6 md:h-7 md:w-7 object-contain"
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = globe)}
            />
          </div>

          <div className="relative mx-auto mt-2 w-full max-w-4xl">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-white/90">
              {loading || !progress
                ? "Laddar..."
                : `${progress.completedLevels} av ${progress.totalLevels} nivåer klara • XP: ${progress.userXp}`}
            </div>
            <div className="h-[4px] w-full rounded bg-white/15">
              <div className="h-full rounded bg-[#E9C341]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <TopLevelsBar
            items={items}
            activeId={allDone ? null : (activeLevel?.levelId ?? null)}
            onStartQuiz={(lvl) => startQuiz(lvl)}
            onSelectLevel={(lvl) => setSelectedLevelId(lvl.levelId)}
            allDone={allDone}
          />

          {allDone && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600/15 px-4 py-2 ring-1 ring-emerald-400/30">
              <span className="text-lg">🎉</span>
              <span className="text-sm font-semibold text-emerald-200">
                Alla nivåer klara! Grymt jobbat!
              </span>
            </div>
          )}
        </div>

        {!allDone && activeLevel && (
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {/* LEFT: Reading area */}
            <section className="lg:col-span-2 rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white/90">Läsning för nivå {activeLevel.levelNumber}</h3>
                <span className="text-xs text-white/60">
                  {study?.studyText ? (isStudyRead ? "Markerad som läst" : "Ej läst") : "Ingen studietext"}
                </span>
              </div>

              {/* Only backend study text—no placeholders */}
              {study?.studyText ? (
                <div className="rounded-xl border border-white/10 bg-[#0D1426] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-white/90">
                        {study.title || `Studietext för nivå ${activeLevel.levelNumber}`}
                      </h4>
                      <p className="mt-1 text-sm text-white/70 break-words">
                        Läs igenom materialet och markera som läst för att kunna starta quizet.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        onClick={() => setReaderOpen(true)}
                        className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                      >
                        Öppna
                      </button>
                      <button
                        onClick={markReadAndClose}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-white/15 ${isStudyRead ? "bg-emerald-600 text-white" : "bg-white/5 text-white/90 hover:bg-white/10"}`}
                        aria-pressed={isStudyRead}
                        disabled={isStudyRead}
                        title={isStudyRead ? "Redan markerad som läst" : "Markera som läst"}
                      >
                        {isStudyRead ? "Markerad som läst" : "Markera som läst"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#0D1426] p-4">
                  <h4 className="text-base font-semibold text-white/90">
                    Ingen studietext för denna nivå
                  </h4>
                  <p className="mt-1 text-sm text-white/70">
                    Du kan fortfarande starta quizet för att gå vidare.
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-[#0E1930] p-4 gap-3">
                <div className="flex items-center gap-3 self-start">
                  <img src={bulb} alt="Tips" className="h-7 w-7" />
                  <div>
                    <div className="text-sm font-semibold text-white">Tips</div>
                    <div className="text-xs text-white/80">
                      {study?.studyText
                        ? "Läs studiematerialet och markera som läst för att låsa upp quizet."
                        : "Ingen studietext krävs här – kör igång med quizet när du är redo."}
                    </div>
                  </div>
                </div>
                {study?.studyText && (
                  <button
                    onClick={() => setReaderOpen(true)}
                    className="self-end sm:self-auto rounded-lg bg-[#5B3CF2] px-3 py-1.5 text-xs font-semibold hover:brightness-110"
                  >
                    Öppna studietext
                  </button>
                )}
              </div>
            </section>

            {/* RIGHT: Quiz */}
            <aside className="space-y-6 min-w-0">
              <section className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
                <h3 className="text-sm font-semibold text-white/90">Quiz för nivå {activeLevel.levelNumber}</h3>
                <p className="mt-2 text-xs text-white/70">
                  {study?.studyText ? "Markera studiematerialet som läst för att starta." : "Redo? Starta quizet för att låsa upp nästa nivå."}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => startQuiz(activeLevel)}
                    disabled={!!study?.studyText && !isStudyRead}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-semibold 
                      ${!!study?.studyText && !isStudyRead
                        ? "bg-white/10 text-white/60 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:brightness-110"}`}
                    title={!!study?.studyText && !isStudyRead ? "Du måste läsa studietexten först" : "Starta quiz"}
                  >
                    Starta quiz
                  </button>

                  {/* Demo: complete level -> unlock next -> carousel slides */}
                  <button
                    onClick={async () => {
                      try {
                        const updated = await topicApi.completeLevel(topicId, activeLevel.levelId);
                        setProgress(updated);
                        // move selection to the next unlocked active level (if any)
                        const nextActive = updated.levels.find(l => l.isUnlocked && !l.isCompleted);
                        setSelectedLevelId(nextActive?.levelId ?? null);
                        alert("Quiz markerat som klart! 🚀");
                      } catch (e: any) {
                        alert(e?.message ?? "Kunde inte markera quiz som klart.");
                      }
                    }}
                    className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    ✔ Markera som färdig (demo)
                  </button>
                </div>
              </section>
            </aside>
          </div>
        )}

        {err && (
          <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        )}
      </div>

      {/* Reader modal: API studyText only */}
      {readerOpen && activeLevel && study?.studyText && (
        <ReaderModal
          title={`${study.title || `Studiematerial (nivå ${activeLevel.levelNumber})`}`}
          text={study.studyText}
          onClose={() => setReaderOpen(false)}
          onMarkRead={markReadAndClose}
        />
      )}
    </div>
  );
}




function TopLevelsBar({
  items,
  activeId,
  onStartQuiz,
  onSelectLevel,
  allDone,
}: {
  items: TopicLevelStatusDto[];
  activeId: string | null;
  onStartQuiz: (lvl: TopicLevelStatusDto) => void;
  onSelectLevel: (lvl: TopicLevelStatusDto) => void;
  allDone: boolean;
}) {
  // find current center index from props
  const activeIndex = React.useMemo(
    () => (activeId ? items.findIndex((l) => l.levelId === activeId) : 0),
    [items, activeId]
  );

  const bubbleSize = "h-[72px] w-[72px]";

  function Bubble(lvl: TopicLevelStatusDto, isActive: boolean, onClick: () => void) {
    const isCompleted = lvl.isCompleted;
    const isUnlocked = lvl.isUnlocked && !isCompleted;

    const base =
      `relative grid ${bubbleSize} place-items-center rounded-full select-none transition-all duration-300 cursor-pointer` +
      (isCompleted
        ? " bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_22px_60px_rgba(16,185,129,0.35)]"
        : isUnlocked
          ? " bg-gradient-to-b from-[#8B5CF6] to-[#4F2ACB] text-white shadow-[0_22px_60px_rgba(79,42,203,0.45)]"
          : " bg-[#12192B] text-white/85 ring-1 ring-[#2A3760]/60");

    return (
      <button
        key={lvl.levelId}
        onClick={onClick}
        className={base + (isActive ? (isCompleted ? " ring-2 ring-emerald-300/80 scale-110" : isUnlocked ? " ring-2 ring-violet-300/80 scale-110" : " ring-2 ring-white/40 scale-110") : " hover:scale-105")}
        aria-label={`Nivå ${lvl.levelNumber}`}
      >
        {isCompleted ? (
          <>
            <span className="text-[20px] font-bold">{lvl.levelNumber}</span>
            <div className="pointer-events-none absolute -inset-3 rounded-full bg-emerald-500/25 blur-[16px]" />
          </>
        ) : isUnlocked ? (
          <>
            <StarIcon className={isActive ? "h-8 w-8" : "h-6 w-6"} />
            <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#6B46F2]/30 blur-[16px]" />
          </>
        ) : (
          <LockIcon className="h-7 w-7" />
        )}
      </button>
    );
  }

  // Calculate which 3 items to show based on active index
  const getVisibleItems = () => {
    if (items.length <= 3) {
      // Show all items if we have 3 or fewer
      return items.map((item, index) => ({ item, isActive: index === activeIndex }));
    }

    // For carousel logic with more than 3 items
    let startIndex;

    if (activeIndex === 0) {
      // At the beginning
      startIndex = 0;
    } else if (activeIndex === items.length - 1) {
      // At the end
      startIndex = items.length - 3;
    } else {
      // In the middle, keep active item centered
      startIndex = activeIndex - 1;
    }

    return [
      { item: items[startIndex], isActive: startIndex === activeIndex },
      { item: items[startIndex + 1], isActive: startIndex + 1 === activeIndex },
      { item: items[startIndex + 2], isActive: startIndex + 2 === activeIndex }
    ];
  };

  const visibleItems = getVisibleItems();

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < items.length - 1;

  const goLeft = () => {
    if (canGoLeft) {
      onSelectLevel(items[activeIndex - 1]);
    }
  };

  const goRight = () => {
    if (canGoRight) {
      onSelectLevel(items[activeIndex + 1]);
    }
  };

  return (
    <section className="mt-6 w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white/85">Nivåer</h3>
        {!allDone && <span className="text-[11px] text-white/60">{activeIndex + 1} av {items.length} nivåer</span>}
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {allDone ? (
          <div className="h-[130px] flex items-center justify-center gap-3 rounded-2xl bg-emerald-600/15 px-6 py-4 ring-1 ring-emerald-400/30">
            <span className="text-3xl">🏆</span>
            <div className="text-sm leading-tight">
              <div className="font-semibold text-emerald-200">Alla nivåer klara!</div>
              <div className="text-emerald-100/90">Fantastiskt jobbat!</div>
            </div>
          </div>
        ) : (
          <div className="relative h-[130px] flex items-center">
            {/* Left Arrow */}
            {items.length > 3 && (
              <button
                onClick={goLeft}
                disabled={!canGoLeft}
                className={`absolute left-0 z-10 p-2 rounded-full transition-all duration-200 ${canGoLeft
                  ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                aria-label="Previous level"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Carousel Content */}
            <div className="flex-1 mx-8">
              <div className="grid grid-cols-3 gap-4 place-items-center transition-all duration-300 ease-out">
                {visibleItems.map(({ item, isActive }, index) => {
                  const click = item.isUnlocked && !item.isCompleted
                    ? () => (isActive ? onStartQuiz(item) : onSelectLevel(item))
                    : () => onSelectLevel(item);

                  return (
                    <div key={item.levelId} className={`flex flex-col items-center min-w-[88px] transition-all duration-300 ${!isActive ? "opacity-75 scale-95" : ""}`}>
                      {Bubble(item, isActive, click)}
                      <div className={`mt-3 text-xs font-medium text-center transition-all duration-300 ${isActive ? "text-white" : "text-white/70"}`}>
                        Nivå {item.levelNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            {items.length > 3 && (
              <button
                onClick={goRight}
                disabled={!canGoRight}
                className={`absolute right-0 z-10 p-2 rounded-full transition-all duration-200 ${canGoRight
                  ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                aria-label="Next level"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Dots indicator for levels > 3 */}
        {items.length > 3 && !allDone && (
          <div className="flex justify-center mt-4 gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => onSelectLevel(items[index])}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${index === activeIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/30 hover:bg-white/50'
                  }`}
                aria-label={`Go to level ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ===================== Reader Modal ===================== */
function ReaderModal({
  title,
  text,
  onClose,
  onMarkRead,
}: {
  title: string;
  text: string;
  onClose: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0F1527] ring-1 ring-white/10">
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <div className="text-xs text-white/70">Läsning</div>
            <h4 className="text-lg font-semibold text-white">{title}</h4>
          </div>
          <button onClick={onClose} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15">
            Stäng
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-5 text-sm leading-6 text-white/90 prose-invert whitespace-pre-wrap">
          {text}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button onClick={onClose} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">
            Fortsätt senare
          </button>
          <button onClick={onMarkRead} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold hover:brightness-110">
            Markera som läst ✓
          </button>
        </div>
      </div>
    </div>
  );
}