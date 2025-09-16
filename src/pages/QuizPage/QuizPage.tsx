// src/pages/QuizPage/QuizPage.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import globe from "../../assets/images/icons/geografy-icon.png";
import { QuizzesApi, type Question } from "../../Api/QuizApi/Quizzes";

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CrossIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function QuizPage(): React.ReactElement {
  const [params] = useSearchParams();
  const topicId = params.get("topicId") ?? "";
  const levelId = params.get("levelId") ?? "";

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [time, setTime] = React.useState(45);

  // 🔹 Hämta quiz från backend
  React.useEffect(() => {
    if (!topicId || !levelId) return;

    const load = async () => {
      try {
        // Hämta quiz baserat på topicId + levelId
        const res = await QuizzesApi.getPublished({
          topicId,
          levelId,
        });

        if (!res || res.length === 0) {
          console.warn("Inga quiz hittades för topic + level.");
          return;
        }

        const quizId = res[0].id; // ⭐ tar första quizet

        // Hämta frågor för quizet
        const qs = await QuizzesApi.getQuestions(quizId, true);
        setQuestions(qs);
      } catch (err) {
        console.error("Kunde inte hämta quiz:", err);
      }
    };

    load();
  }, [topicId, levelId]);

  React.useEffect(() => {
    if (confirmed || time <= 0) return;
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [confirmed, time]);

  React.useEffect(() => {
    if (time === 0 && !confirmed) setConfirmed(true);
  }, [time, confirmed]);

  const q = questions[currentIndex];
  const lowTime = time <= 10 && time > 0 && !confirmed;
  const canConfirm = !!selected && !confirmed && time > 0;

  if (!q) return <div className="p-8 text-white">Laddar quiz...</div>;

  const btnClass = (answerId: string): string => {
    const disabled = confirmed || time === 0;
    const base =
      "relative w-full h-[56px] md:h-[60px] rounded-[14px] text-white text-[18px] md:text-[20px] font-semibold flex items-center justify-center text-center transition focus:outline-none";

    if (!disabled && selected === answerId) {
      return `${base} bg-[#4666FF] outline outline-[3px] outline-white`;
    }
    if (confirmed) {
      if (answerId === q.correctAnswerId && selected === answerId)
        return `${base} bg-[#31C75A] ring-2 ring-emerald-400`;
      if (selected === answerId)
        return `${base} bg-[#E67E22] opacity-70 ring-2 ring-rose-400`;
    }
    return `${base} bg-[#6B4CE1] ${
      disabled
        ? "opacity-70 cursor-not-allowed"
        : "hover:brightness-[1.06] active:scale-[.99]"
    }`;
  };

  const renderRightIcon = (answerId: string) => {
    const isSel = selected === answerId;
    if (!isSel) return null;

    if (!confirmed) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }
    if (confirmed && answerId === q.correctAnswerId) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }
    if (confirmed && answerId !== q.correctAnswerId) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CrossIcon className="h-5 w-5 text-rose-300 drop-shadow" />
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
      <div className="mx-auto max-w-[980px] px-5 pt-10 pb-12">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">
            Quiz
          </h1>
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
            <div
              className={`pointer-events-none absolute -inset-1 rounded-full ring-2 ${
                lowTime ? "ring-red-500" : "ring-emerald-400"
              }`}
            />
            {lowTime && (
              <div className="pointer-events-none absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />
            )}
          </div>
        </div>

        {/* Svarsalternativ */}
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

        {/* Bekräfta */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            disabled={!canConfirm}
            className={[
              "flex items-center justify-center",
              "h-12 w-[280px] rounded-[12px] text-[15px] font-semibold text-center",
              "transition",
              canConfirm
                ? "bg-[#6B6F8A] hover:brightness-110"
                : "bg-[#6B6F8A]/60 cursor-not-allowed",
            ].join(" ")}
          >
            Bekräfta svar
          </button>
        </div>
      </div>
    </div>
  );
}
