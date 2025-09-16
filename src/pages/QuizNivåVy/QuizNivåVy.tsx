// pages/QuizNivåVy/QuizNivåVy.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";
import globe from "../../assets/images/icons/geografy-icon.png";
import bulb from "../../assets/images/pictures/fun-fact-pic.png";
import { QuizzesApi } from "../../Api/QuizApi/Quizzes";


// ✔ API: uses your working topics API (adjust import path if you re-export in Api/index)
import { topicApi, type TopicLevelStatusDto, type TopicProgressDto } from "../../Api/TopicsApi/topics";

/* icons (UI only) */
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

/* ------- Optional reading/flashcards demo content (pure UI) ------- */
const sampleReadingBlocks = [
  { id: "read-1", title: "Kartor & Skala", minutes: 7, summary: "Hur kartor representerar verkligheten och hur du tolkar skala.", bullets: ["Vad är skala? 1:50 000", "Avståndsberäkningar", "Tematisk vs. topografisk karta"] },
  { id: "read-2", title: "Klimat & Vegetationszoner", minutes: 10, summary: "Hur klimat påverkar vegetation och livsvillkor i regioner.", bullets: ["Klimatzoner & årstider", "Nederbörd & temperatur", "Anpassningar i natur och samhälle"] },
  { id: "read-3", title: "Naturresurser & Hållbarhet", minutes: 8, summary: "Råvaror, energi och hållbar användning av resurser.", bullets: ["Fossila vs. förnybara", "Ekologiskt fotavtryck", "Cirkulär ekonomi"] },
];
const articleText: Record<string, string> = {
  "read-1": `### Kartor & Skala

En karta är en förenkling av verkligheten. **Skalan** anger förhållandet mellan avstånd på kartan och i verkligheten.

- Skalan _1:50 000_ betyder att 1 cm på kartan är 50 000 cm (alltså 500 m) i verkligheten.
- På topografiska kartor ser du höjdskillnader med höjdkurvor.
- På tematiska kartor visas ett tema, t.ex. befolkningstäthet eller medeltemperatur.

**Exempel:** Om två orter ligger 3 cm isär på kartan med skala 1:50 000, är avståndet 1,5 km i verkligheten.`,
  "read-2": `### Klimat & Vegetationszoner

Klimat beskriver vädermönster över lång tid. Klimatet påverkar vilka växter som trivs och hur människor lever.

- **Tropiska zoner** har små temperaturvariationer över året.
- **Tempererade zoner** har fyra årstider.
- **Polara zoner** har mycket kalla vintrar och korta somrar.

Vegetationen anpassar sig efter temperatur och nederbörd, t.ex. regnskog i tropikerna och barrskog i kallare områden.`,
  "read-3": `### Naturresurser & Hållbarhet

Naturresurser kan vara **fossila** (t.ex. olja) eller **förnybara** (t.ex. sol och vind).

- Fossila bränslen har hög energitäthet men bidrar till utsläpp.
- Förnybara källor är renare men kan kräva större ytor och varierar i tillgänglighet.
- **Cirkulär ekonomi** syftar till att minimera avfall och återanvända material.

Målet är att möta dagens behov utan att äventyra framtida generationers möjligheter.`,
};
const keyTerms = [
  { term: "Skala", def: "Förhållandet mellan avstånd på kartan och i verkligheten." },
  { term: "Breddgrad", def: "Avstånd norr/söder från ekvatorn, i grader." },
  { term: "Klimatzon", def: "Område med liknande klimatförhållanden." },
  { term: "Longitud", def: "Avstånd öst/väst från nollmeridianen." },
  { term: "Topografi", def: "Beskrivning av terrängens höjder och dalar." },
];
function getReadingForLevel(levelNumber: number) {
  const a = sampleReadingBlocks[(levelNumber - 1) % sampleReadingBlocks.length];
  const b = sampleReadingBlocks[(levelNumber) % sampleReadingBlocks.length];
  return [a, b];
}
function getTermsForLevel(levelNumber: number) {
  const start = (levelNumber - 1) % keyTerms.length;
  return [keyTerms[start], keyTerms[(start + 1) % keyTerms.length]];
}
const readingKey = (levelId: string, blockId: string) => `${levelId}:${blockId}`;


export default function QuizNivåVy(): React.ReactElement {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const [params] = useSearchParams();
  const classId = params.get("classId") ?? "";
  const navigate = useNavigate();

  const [progress, setProgress] = useState<TopicProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  const [readStates, setReadStates] = useState<Record<string, boolean>>({});
  const setReadAndPersist = (upd: Record<string, boolean>) => setReadStates(upd);


  const [readerOpen, setReaderOpen] = useState(false);
  const [readerBlockId, setReaderBlockId] = useState<string | null>(null);


  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    setErr(null);
    topicApi
      .getProgress(topicId)
      .then((p) => setProgress(p))
      .catch((e) => setErr(e?.message ?? "Kunde inte hämta progression"))
      .finally(() => setLoading(false));
  }, [topicId]);

  const items: TopicLevelStatusDto[] = progress?.levels ?? [];
  const pct = useMemo(
    () =>
      !progress || progress.totalLevels === 0
        ? 0
        : Math.min(100, Math.round((progress.completedLevels / progress.totalLevels) * 100)),
    [progress]
  );


  const activeLevel = useMemo(
    () => items.find((l) => l.isUnlocked && !l.isCompleted) ?? items[items.length - 1],
    [items]
  );
  const allDone = items.length > 0 && items.every((l) => l.isCompleted);
  const activeLevelNumber = activeLevel?.levelNumber ?? 1;


const startQuiz = async (lvl: TopicLevelStatusDto) => {
  try {
    navigate(`/quizzes/start?topicId=${topicId}&levelId=${lvl.levelId}`);
  } catch (err) {
    console.error("Fel vid startQuiz:", err);
  }
};


  const activeBlocks = useMemo(() => getReadingForLevel(activeLevelNumber), [activeLevelNumber]);
  const openReader = (blockId: string) => { setReaderBlockId(blockId); setReaderOpen(true); };
  const closeReader = () => setReaderOpen(false);
  const markReadAndClose = () => {
    if (readerBlockId && activeLevel) {
      const k = readingKey(activeLevel.levelId, readerBlockId);
      setReadAndPersist({ ...readStates, [k]: true });
    }
    setReaderOpen(false);
  };
  const openNextUnread = () => {
    if (!activeLevel) return;
    const next = activeBlocks.find((b) => !readStates[readingKey(activeLevel.levelId, b.id)]);
    if (next) openReader(next.id);
  };

  const subjectIcon =
    ((progress as any)?.subjectIconUrl as string | undefined) || globe;

  return (
    <div className="min-h-screen w-full bg-[#0A0F1F] text-white overflow-x-hidden">

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { height: 8px; width: 8px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 9999px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>


      <div className="w-full">
        <div className="relative h-48 md:h-56 overflow-hidden rounded-b-[28px] bg-gradient-to-r from-[#5A39E6] via-[#4F2ACB] to-[#4A2BC3]">
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(173,140,255,0.95),rgba(123,76,255,0.5)_58%,transparent_72%)]" />
          <img src={frageTitle} alt="FrågeFejden" className="absolute left-4 top-4 h-14 md:h-20 object-contain max-w-full" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 ring-2 ring-white/25">
            <img src={avatar} alt="Profil" className="h-[72px] w-[72px] rounded-full ring-2 ring-white/80 object-cover" />
          </div>
        </div>
      </div>


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

            <section className="lg:col-span-2 rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white/90">Läsning för nivå {activeLevel.levelNumber}</h3>
                <span className="text-xs text-white/60">
                  Est. tid: {activeBlocks.reduce((t, b) => t + b.minutes, 0)} min
                </span>
              </div>

              <ul className="space-y-4">
                {activeBlocks.map((b) => {
                  const k = readingKey(activeLevel.levelId, b.id);
                  const read = !!readStates[k];
                  return (
                    <li key={k} className="rounded-xl border border-white/10 bg-[#0D1426] p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-semibold text-white/90">{b.title}</h4>
                            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                              {b.minutes} min
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-white/70 break-words">{b.summary}</p>
                          <ul className="mt-3 list-disc pl-5 text-sm text-white/70 space-y-1">
                            {b.bullets.map((s, i) => (
                              <li key={i} className="break-words">
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex shrink-0 flex-row sm:flex-col items-end gap-2">
                          <button
                            onClick={() => openReader(b.id)}
                            className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                          >
                            Öppna
                          </button>
                          <button
                            onClick={() => setReadAndPersist({ ...readStates, [k]: !read })}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-white/15 ${read ? "bg-emerald-600 text-white" : "bg-white/5 text-white/90 hover:bg-white/10"
                              }`}
                            aria-pressed={read}
                          >
                            {read ? "Markerad som läst" : "Markera som läst"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between rounded-xl bg-[#0E1930] p-4 gap-3">
                <div className="flex items-center gap-3 self-start">
                  <img src={bulb} alt="Tips" className="h-7 w-7" />
                  <div>
                    <div className="text-sm font-semibold text-white">Tips</div>
                    <div className="text-xs text-white/80">
                      Läs klart blocken ovan och starta sen quiz för nivå {activeLevel.levelNumber}.
                    </div>
                  </div>
                </div>
                <button
                  onClick={openNextUnread}
                  className="self-end sm:self-auto rounded-lg bg-[#5B3CF2] px-3 py-1.5 text-xs font-semibold hover:brightness-110"
                >
                  Fortsätt läsa
                </button>
              </div>
            </section>


            <aside className="space-y-6 min-w-0">
              <section className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
                <h3 className="text-sm font-semibold text-white/90">Quiz för nivå {activeLevel.levelNumber}</h3>
                <p className="mt-2 text-xs text-white/70">Redo? Starta quizet för att låsa upp nästa nivå.</p>
                <button
                  onClick={() => startQuiz(activeLevel)}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  Starta quiz
                </button>
              </section>

              <section className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
                <h3 className="text-sm font-semibold text-white/90">Nyckelbegrepp (nivå {activeLevel.levelNumber})</h3>
                <Flashcards terms={getTermsForLevel(activeLevelNumber)} />
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


      {readerOpen && readerBlockId && activeLevel && (
        <ReaderModal
          blockId={readerBlockId}
          onClose={closeReader}
          onMarkRead={markReadAndClose}
          titlePrefix={`Nivå ${activeLevel.levelNumber}: `}
        />
      )}
    </div>
  );
}


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
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const VISIBLE_COUNT = 5;

  const clampStart = (n: number) =>
    Math.max(0, Math.min(n, Math.max(0, items.length - VISIBLE_COUNT)));

  useEffect(() => {
    if (!activeId || allDone) return;
    const idx = items.findIndex((x) => x.levelId === activeId);
    if (idx === -1) return;
    const idealStart = clampStart(idx - Math.floor(VISIBLE_COUNT / 2));
    if (idealStart !== visibleStartIndex) setVisibleStartIndex(idealStart);
  }, [activeId, allDone, items.length]);

  const visibleItems = items.slice(visibleStartIndex, visibleStartIndex + VISIBLE_COUNT);

  return (
    <section className="mt-6 w-full max-w-4xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white/85">Nivåer</h3>
        {!allDone && (
          <span className="text-[11px] text-white/60">
            Visar {visibleStartIndex + 1}–
            {Math.min(visibleStartIndex + VISIBLE_COUNT, items.length)} av {items.length}
          </span>
        )}
      </div>

      <div className="relative">

        {visibleStartIndex > 0 && !allDone && (
          <button
            type="button"
            onClick={() => setVisibleStartIndex(clampStart(visibleStartIndex - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 rounded-full bg-[#11182B] p-2 ring-1 ring-white/20 hover:bg-[#1A2332] transition-colors"
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
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 rounded-full bg-[#11182B] p-2 ring-1 ring-white/20 hover:bg-[#1A2332] transition-colors"
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

function Flashcards({ terms }: { terms: { term: string; def: string }[] }) {
  const [i, setI] = useState(0);
  if (terms.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg bg-[#0D1426] p-4">
      <div className="text-xs text-white/75">
        <b>{terms[i].term}:</b> {terms[i].def}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15" onClick={() => setI((x) => (x - 1 + terms.length) % terms.length)}>
          ← Föregående
        </button>
        <span className="text-[11px] text-white/60">
          {i + 1}/{terms.length}
        </span>
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15" onClick={() => setI((x) => (x + 1) % terms.length)}>
          Nästa →
        </button>
      </div>
    </div>
  );
}


function ReaderModal({
  blockId,
  onClose,
  onMarkRead,
  titlePrefix = "",
}: {
  blockId: string;
  onClose: () => void;
  onMarkRead: () => void;
  titlePrefix?: string;
}) {
  const block = sampleReadingBlocks.find((b) => b.id === blockId)!;
  const text = articleText[blockId] ?? "Ingen text tillgänglig.";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0F1527] ring-1 ring-white/10">
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <div className="text-xs text-white/70">Läsning</div>
            <h4 className="text-lg font-semibold text-white">
              {titlePrefix}
              {block.title}
            </h4>
            <div className="mt-1 text-[11px] text-white/60">Est. tid: {block.minutes} min</div>
          </div>
          <button onClick={onClose} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15">
            Stäng
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-5 text-sm leading-6 text-white/90 prose-invert">
          {text.split("\n\n").map((para, i) => (
            <p key={i} className="mb-3 whitespace-pre-wrap">
              {para}
            </p>
          ))}
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