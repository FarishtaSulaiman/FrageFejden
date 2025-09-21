// src/pages/QuizNivåVy/QuizNivåVy.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";


import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";
import globe from "../../assets/images/icons/geografy-icon.png";
import bulb from "../../assets/images/pictures/fun-fact-pic.png";

import {
  ProgressApi,
  type LearningPathDto,
  type PathLevelDto,
} from "../../Api/QuizApi/Progress";
import { QuizzesApi, type QuizSummaryDto } from "../../Api/QuizApi/Quizzes";

/* --------------------------- small inline icons --------------------------- */
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

/* ================================ Page =================================== */
export default function QuizNivåVy(): React.ReactElement {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const classId = params.get("classId") ?? ""; // optional passthrough

  const [path, setPath] = useState<LearningPathDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Allow selecting previous/unlocked levels to preview on the left
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  // Fetch learning path (levels come from DB; totalLevels reflects DB count)
  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    setErr(null);
    setSelectedLevelId(null);

    ProgressApi.getLearningPath(topicId)
      .then((p) => setPath(p))
      .catch((e: any) => setErr(e?.message ?? "Kunde inte hämta progression"))
      .finally(() => setLoading(false));
  }, [topicId]);

  const items: PathLevelDto[] = path?.levels ?? [];

  const activeLevel = useMemo(() => {
    if (items.length === 0) return undefined;
    const fromSelection = selectedLevelId ? items.find((l) => l.levelId === selectedLevelId) : undefined;
    if (fromSelection) return fromSelection;
    return (
      items.find((l) => (l.status === "available" || l.canAccess) && !l.isCompleted) ??
      items[items.length - 1]
    );
  }, [items, selectedLevelId]);

  const allDone = items.length > 0 && items.every((l) => l.isCompleted);
  const activeLevelNumber = activeLevel?.levelNumber ?? 1;
  const studyText = activeLevel?.studyText ?? activeLevel?.description ?? null;


  const pct = useMemo(
    () =>
      !path || path.totalLevels === 0
        ? 0
        : Math.min(100, Math.round((path.completedLevels / path.totalLevels) * 100)),
    [path]
  );

  function PlainMarkdownLike({ text }: { text: string }) {
    return (
      <div className="space-y-2 text-sm leading-6 text-white/85">
        {text.split("\n").map((line, i) => (
          <p key={i} className="whitespace-pre-wrap">{line}</p>
        ))}
      </div>
    );
  }
  // @ts-expect-error
  const subjectIcon: string = (path?.subjectIconUrl as string | undefined) || globe;

  // ------------------------------- actions --------------------------------
  // Start quiz: fetch the first published quiz for current topic+level and go to /quizzes/:quizId/questions
  const startQuiz = async (lvl: PathLevelDto) => {
    try {
      if (!lvl.canAccess && lvl.status !== "available") {
        alert("Denna nivå är låst ännu.");
        return;
      }

      const published: QuizSummaryDto[] = await QuizzesApi.getPublishedQuizzes(undefined, topicId, lvl.levelId);
      if (!published || published.length === 0) {
        alert("Inga publicerade quiz hittades för den här nivån.");
        return;
      }

      const quizId = published[0].id; // pick the first published quiz for the topic+level
      const subjectId = params.get("subjectId") ?? "";
      navigate(
      `/quizzes/${quizId}/questions?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}`
);
    } catch (e: any) {
      alert(e?.message ?? "Kunde inte starta quiz.");
    }
  };

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
                : path
                  ? `Du har valt kursen: ${path.subjectName ?? "—"} • ${path.topicName}`
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
              {loading || !path
                ? "Laddar..."
                : `${path.completedLevels} av ${path.totalLevels} nivåer klara`}
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
            {/* LEFT: Info / tips (no study API in the new stack) */}
            <section className="lg:col-span-2 rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white/90">Nivå {activeLevel.levelNumber}</h3>
                <span className="text-xs text-white/60">
                  {activeLevel.isCompleted ? "Klar" : (activeLevel.canAccess ? "Tillgänglig" : "Låst")}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D1426] p-4">
                <h4 className="text-base font-semibold text-white/90">
                  {activeLevel.title || `Läsning & quiz för nivå ${activeLevel.levelNumber}`}
                </h4>
                <p className="mt-1 text-sm text-white/70 break-words">
                  Klara nivån genom att spela quizet. Nya nivåer låses upp allt eftersom.
                </p>
              </div>

              {/* ==== Studiematerial from Level.StudyText ==== */}
              {studyText && (
                <div className="mt-5 rounded-xl border border-white/10 bg-[#0D1426] p-4">
                  <h4 className="text-sm font-semibold text-white/90">Studiematerial</h4>
                  <div className="mt-2 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-white/85 prose-li:text-white/85">
                    {/* Prefer ReactMarkdown if available; otherwise fall back */}
                    {ReactMarkdown ? (
                      <ReactMarkdown>{studyText}</ReactMarkdown>
                    ) : (
                      <PlainMarkdownLike text={studyText} />
                    )}
                  </div>
                </div>
              )}

              {/* Tips (kept) */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-[#0E1930] p-4 gap-3">
                <div className="flex items-center gap-3 self-start">
                  <img src={bulb} alt="Tips" className="h-7 w-7" />
                  <div>
                    <div className="text-sm font-semibold text-white">Tips</div>
                    <div className="text-xs text-white/80">
                      Vissa nivåer kan vara låsta tills du klarat tidigare nivåer.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: Quiz */}
            <aside className="space-y-6 min-w-0">
              <section className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
                <h3 className="text-sm font-semibold text-white/90">Quiz för nivå {activeLevel.levelNumber}</h3>
                <p className="mt-2 text-xs text-white/70">
                  Starta quizet för att låsa upp nästa nivå (om kraven uppfylls).
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => startQuiz(activeLevel)}
                    disabled={!activeLevel.canAccess && activeLevel.status !== "available"}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-semibold 
                      ${!activeLevel.canAccess && activeLevel.status !== "available"
                        ? "bg-white/10 text-white/60 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:brightness-110"
                      }`}
                    title={!activeLevel.canAccess && activeLevel.status !== "available" ? "Nivån är låst" : "Starta quiz"}
                  >
                    Starta quiz
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
    </div>
  );
}

/* ============================ Levels Carousel ============================ */
function TopLevelsBar({
  items,
  activeId,
  onStartQuiz,
  onSelectLevel,
  allDone,
}: {
  items: PathLevelDto[];
  activeId: string | null;
  onStartQuiz: (lvl: PathLevelDto) => void;
  onSelectLevel: (lvl: PathLevelDto) => void;
  allDone: boolean;
}) {
  // find current center index from props
  const activeIndex = React.useMemo(
    () => (activeId ? items.findIndex((l) => l.levelId === activeId) : 0),
    [items, activeId]
  );

  const bubbleSize = "h-[72px] w-[72px]";

  function Bubble(lvl: PathLevelDto, isActive: boolean, onClick: () => void) {
    const isCompleted = lvl.isCompleted;
    const isUnlocked = (lvl.status === "available" || lvl.canAccess) && !isCompleted;

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
        className={
          base +
          (isActive
            ? isCompleted
              ? " ring-2 ring-emerald-300/80 scale-110"
              : isUnlocked
                ? " ring-2 ring-violet-300/80 scale-110"
                : " ring-2 ring-white/40 scale-110"
            : " hover:scale-105")
        }
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
      // Show all if 3 or fewer
      return items.map((item, index) => ({ item, isActive: index === activeIndex }));
    }

    // For carousel logic with more than 3 items
    let startIndex: number;

    if (activeIndex === 0) {
      startIndex = 0;
    } else if (activeIndex === items.length - 1) {
      startIndex = items.length - 3;
    } else {
      startIndex = activeIndex - 1;
    }

    return [
      { item: items[startIndex], isActive: startIndex === activeIndex },
      { item: items[startIndex + 1], isActive: startIndex + 1 === activeIndex },
      { item: items[startIndex + 2], isActive: startIndex + 2 === activeIndex },
    ];
  };

  const visibleItems = getVisibleItems();

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < items.length - 1;

  const goLeft = () => {
    if (canGoLeft) onSelectLevel(items[activeIndex - 1]);
  };
  const goRight = () => {
    if (canGoRight) onSelectLevel(items[activeIndex + 1]);
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
                className={`absolute left-0 z-10 p-2 rounded-full transition-all duration-200 ${canGoLeft ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer" : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                aria-label="Previous level"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            )}

            {/* Carousel Content */}
            <div className="flex-1 mx-8">
              <div className="grid grid-cols-3 gap-4 place-items-center transition-all duration-300 ease-out">
                {visibleItems.map(({ item, isActive }) => {
                  const click =
                    (item.status === "available" || item.canAccess) && !item.isCompleted
                      ? () => (isActive ? onStartQuiz(item) : onSelectLevel(item))
                      : () => onSelectLevel(item);

                  return (
                    <div
                      key={item.levelId}
                      className={`flex flex-col items-center min-w-[88px] transition-all duration-300 ${!isActive ? "opacity-75 scale-95" : ""}`}
                    >
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
                className={`absolute right-0 z-10 p-2 rounded-full transition-all duration-200 ${canGoRight ? "bg-white/10 hover:bg-white/20 text-white cursor-pointer" : "bg-white/5 text-white/30 cursor-not-allowed"
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
                className={`w-2 h-2 rounded-full transition-all duration-200 ${index === activeIndex ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"
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
