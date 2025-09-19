import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import globe from "../../assets/images/icons/geografy-icon.png";
import { QuizzesApi, type Question, type UUID } from "../../Api/QuizApi/Quizzes";
import { AttemptsApi } from "../../Api/QuizApi/Attempts";
import { http } from "../../lib/http";

const DEV_BYPASS_LOCK = true;
const PASS_PCT = 70;

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function CrossIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

type ResultState = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationMs: number;
  xpEarned: number;
  passed: boolean;
  nextLevelId?: UUID | null;
};

export default function QuizPage(): React.ReactElement {
  const { quizId = "" } = useParams<{ quizId: UUID }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [attemptId, setAttemptId] = React.useState<UUID | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<UUID | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);

  const [time, setTime] = React.useState(45);
  const [questionStartAt, setQuestionStartAt] = React.useState<number>(Date.now());

  const [result, setResult] = React.useState<ResultState | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const classId = search.get("classId");

  // load questions + start attempt (or show last status if already finished)
  React.useEffect(() => {
    if (!quizId) return;

    let mounted = true;
    (async () => {
      try {
        // 1) Load questions (includeAnswers=true so we can show green/red)
        const qs = await QuizzesApi.getQuestions(quizId, true);
        if (!mounted) return;
        setQuestions(qs);

        // 2) Try to start attempt
        try {
          const can = await AttemptsApi.canStartAttempt(quizId);
          if (!mounted) return;

          if (!can.canStart) {
            // Can't start — show status instead (already completed, locked, etc.)
            const status = await AttemptsApi.getQuizStatus(quizId);
            if (!mounted) return;

            if (status.hasCompleted) {
              // We only have bestScore + completion flags on this endpoint
              setResult({
                score: status.bestScore ?? 0,
                correctCount: 0, // not available here
                totalQuestions: qs.length,
                durationMs: 0, // not available here
                xpEarned: 0, // not available here
                passed: status.isLevelCompleted || (status.bestScore ?? 0) >= PASS_PCT,
                // status does NOT include nextLevelId in your current types.
                nextLevelId: undefined,
              });
              setAttemptId(null);
              return;
            }

            setError(status.reason || "Du kan inte starta detta quiz just nu.");
            return;
          }

          const started = await AttemptsApi.startAttempt(quizId, { bypassLock: DEV_BYPASS_LOCK });
          if (!mounted) return;

          setAttemptId(started.attemptId);

          // reset UI
          setCurrentIndex(0);
          setSelected(null);
          setConfirmed(false);
          setTime(45);
          setQuestionStartAt(Date.now());
          setResult(null);
          setError(null);
        } catch (e: any) {
          // Fallback: show explicit status
          const status = await AttemptsApi.getQuizStatus(quizId);
          if (!mounted) return;

          if (status.hasCompleted) {
            setResult({
              score: status.bestScore ?? 0,
              correctCount: 0,
              totalQuestions: qs.length,
              durationMs: 0,
              xpEarned: 0,
              passed: status.isLevelCompleted || (status.bestScore ?? 0) >= PASS_PCT,
              nextLevelId: undefined,
            });
            setAttemptId(null);
            return;
          }
          setError(status.reason || "Kunde inte starta quizet.");
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.message ?? err?.message ?? "Kunde inte ladda quizet.");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [quizId]);

  // countdown
  React.useEffect(() => {
    if (confirmed || time <= 0 || result) return;
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [confirmed, time, result]);

  React.useEffect(() => {
    if (time === 0 && !confirmed) setConfirmed(true);
  }, [time, confirmed]);

  const q = questions[currentIndex];
  const lowTime = time <= 10 && time > 0 && !confirmed;
  const canConfirm = !!selected && !confirmed && time > 0;

  if (error) {
    return (
      <div className="p-8 text-white">
        <div className="max-w-xl rounded-lg border border-red-500/40 bg-red-500/10 p-4">{error}</div>
        {DEV_BYPASS_LOCK && <div className="mt-2 text-white/80 text-sm">DEV_BYPASS_LOCK=true för att tillåta omspel under utveckling.</div>}
      </div>
    );
  }

  // “done” view (also used after refresh)
  if (result) {
    const passed = result.passed || result.score >= PASS_PCT;
    return (
      <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
        <div className="mx-auto max-w-[680px] px-5 pt-10 pb-12">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">
              {passed ? "Godkänt!" : "Resultat"}
            </h1>
            <img src={globe} alt="Quiz" className="h-8 w-8 md:h-9 md:w-9" />
          </div>

          <div className="mt-8 rounded-2xl bg-[#11182B] p-6 ring-1 ring-white/10">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-extrabold">{result.score}</div>
                <div className="text-xs text-white/70 mt-1">Poäng</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">
                  {result.correctCount}/{result.totalQuestions}
                </div>
                <div className="text-xs text-white/70 mt-1">Rätt svar</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">{(result.durationMs / 1000).toFixed(0)}s</div>
                <div className="text-xs text-white/70 mt-1">Tid</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">+{result.xpEarned}</div>
                <div className="text-xs text-white/70 mt-1">XP</div>
              </div>
            </div>

            {passed ? (
              <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200 text-sm text-center">
                Du klarade quizet! {result.nextLevelId ? "Nästa nivå är upplåst." : "Det finns ingen nästa nivå eller kunde inte hämtas vid uppdatering."}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200 text-sm text-center">
                Under godkänd gräns ({PASS_PCT}%). Försök igen när det är upplåst.
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <button className="h-11 rounded-[12px] px-5 bg-white/10 hover:bg-white/15" onClick={() => navigate(-1)}>
                Tillbaka
              </button>
              {result.nextLevelId && (
                <button
                  className="h-11 rounded-[12px] px-5 bg-emerald-600 hover:brightness-110"
                  onClick={() => navigate(-1)}
                >
                  Gå till nästa nivå →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return <div className="p-8 text-white">Laddar quiz...</div>;

  // button style (green right, red wrong selected after confirm)
  const btnClass = (answerId: UUID): string => {
    const disabled = confirmed || time === 0;
    const base =
      "relative w-full h-[56px] md:h-[60px] rounded-[14px] text-white text-[18px] md:text-[20px] font-semibold flex items-center justify-center text-center transition focus:outline-none";

    if (!disabled && selected === answerId) {
      return `${base} bg-[#4666FF] outline outline-[3px] outline-white`;
    }

    if (confirmed && q.correctAnswerId) {
      if (answerId === q.correctAnswerId) {
        return `${base} bg-[#31C75A] ring-2 ring-emerald-400`;
      }
      if (selected === answerId && answerId !== q.correctAnswerId) {
        return `${base} bg-[#E11D48] ring-2 ring-red-400`;
      }
    }

    return `${base} bg-[#6B4CE1] ${disabled ? "opacity-70 cursor-not-allowed" : "hover:brightness-[1.06] active:scale-[.99]"}`;
  };

  const renderRightIcon = (answerId: UUID) => {
    if (!q.correctAnswerId) return null;
    if (!confirmed) {
      return selected === answerId ? (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      ) : null;
    }
    if (answerId === q.correctAnswerId) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }
    if (selected === answerId && answerId !== q.correctAnswerId) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CrossIcon className="h-5 w-5 text-rose-300 drop-shadow" />
        </span>
      );
    }
    return null;
  };

  // save current answer on confirm
  const onConfirm = async () => {
    if (!attemptId || !q || !selected) return;
    const elapsedS = Math.round((Date.now() - questionStartAt) / 1000);
    const timeMs = Math.min(45, Math.max(0, elapsedS)) * 1000;

    try {
      await AttemptsApi.submitAnswer(attemptId, {
        questionId: q.id,
        selectedOptionId: selected,
        timeMs,
      });
      setConfirmed(true);
    } catch (err) {
      console.error("Misslyckades att spara svaret:", err);
      // still allow progression to avoid UX dead-end
      setConfirmed(true);
    }
  };

  // next / finish
  const goNext = async () => {
    const last = currentIndex >= questions.length - 1;
    if (!last) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setConfirmed(false);
      setTime(45);
      setQuestionStartAt(Date.now());
      return;
    }

    if (attemptId) {
      try {
        const r = await AttemptsApi.finishAttempt(attemptId);
        setResult({
          score: r.score,
          correctCount: r.correctCount,
          totalQuestions: r.totalQuestions,
          durationMs: r.durationMs,
          xpEarned: r.xpEarned,
          passed: r.passed,
          nextLevelId: r.nextLevelId ?? undefined,
        });

        //Lägg till poäng till användaren i ämnet baserat på quizet
      const subjectId = search.get("subjectId");
      if (subjectId) {
        try {
          const {data : user } = await http.get('Auth/me');
          await http.post(`/Subject/${subjectId}/user/${user.id}/entries`, {
            exp: r.score,
          });
        console.log('Score tillagt:', r.score);
        } catch (err) {
          console.error('Kunde inte lägga till score:', err);
        }
      }

        setAttemptId(null);
      } catch (err) {
        console.error("finishAttempt error", err);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
      <div className="mx-auto max-w-[980px] px-5 pt-10 pb-12">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">Quiz</h1>
          <img src={globe} alt="Quiz" className="h-8 w-8 md:h-9 md:w-9" />
        </div>
        <p className="mt-2 text-center text-[15px] text-white/85">
          Fråga {currentIndex + 1} av {questions.length}
        </p>

        <h2 className="mx-auto mt-6 max-w-[820px] text-center text-[26px] md:text-[28px] font-extrabold tracking-tight">
          {q.text}
        </h2>

        {/* Timer */}
        <div className="mt-5 flex justify-center">
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0F1728] ring-2 ring-white">
              <span className="text-lg font-bold">{time}</span>
            </div>
            <div className={`pointer-events-none absolute -inset-1 rounded-full ring-2 ${lowTime ? "ring-red-500" : "ring-emerald-400"}`} />
            {lowTime && <div className="pointer-events-none absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />}
          </div>
        </div>

        {/* Answers */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {q.answers.map((a) => (
            <button
              key={a.id}
              type="button"
              className={btnClass(a.id)}
              onClick={() => {
                if (confirmed || time === 0) return;
                setSelected(a.id);
              }}
              disabled={confirmed || time === 0}
              aria-pressed={selected === a.id}
            >
              {a.text}
              {renderRightIcon(a.id)}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-center">
          {!confirmed ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className={[
                "flex items-center justify-center",
                "h-12 w-[280px] rounded-[12px] text-[15px] font-semibold text-center",
                "transition",
                canConfirm ? "bg-[#6B6F8A] hover:brightness-110" : "bg-[#6B6F8A]/60 cursor-not-allowed",
              ].join(" ")}
            >
              Bekräfta svar
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="h-12 w-[280px] rounded-[12px] text-[15px] font-semibold text-center bg-[#5B3CF2] hover:brightness-110"
            >
              {currentIndex < questions.length - 1 ? "Nästa fråga →" : "Avsluta"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
