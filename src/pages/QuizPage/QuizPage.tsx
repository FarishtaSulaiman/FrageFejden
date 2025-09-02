// src/pages/QuizPlay/QuizPage.tsx
import React from "react";
import globe from "../../assets/images/icons/geografy-icon.png";

type AnswerId = "cn" | "us" | "ru" | "ca";
type Variant = "blue" | "purple" | "green" | "orange";
type Answer = { id: AnswerId; text: string; variant: Variant };

const ANSWERS: Answer[] = [
  { id: "cn", text: "Kina", variant: "blue" },
  { id: "us", text: "USA", variant: "purple" },
  { id: "ru", text: "Ryssland", variant: "green" }, // korrekt
  { id: "ca", text: "Kanada", variant: "orange" },
];

const COLOR: Record<Variant, string> = {
  blue: "bg-[#4666FF]",
  purple: "bg-[#6B4CE1]",
  green: "bg-[#31C75A]",
  orange: "bg-[#E67E22]",
};

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

export default function QuizPage(): React.ReactElement {
  const [selected, setSelected] = React.useState<AnswerId | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const [time, setTime] = React.useState(45);

  React.useEffect(() => {
    if (confirmed || time <= 0) return;
    const t = setInterval(() => setTime((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [confirmed, time]);

  React.useEffect(() => {
    if (time === 0 && !confirmed) setConfirmed(true);
  }, [time, confirmed]);

  const lowTime = time <= 10 && time > 0 && !confirmed;
  const correct: AnswerId = "ru";
  const canConfirm = !!selected && !confirmed && time > 0;

  const btnClass = (a: Answer): string => {
    const disabled = confirmed || time === 0;
    const base =
      "relative w-full h-[56px] md:h-[60px] rounded-[14px] " +
      "text-white text-[18px] md:text-[20px] font-semibold " +
      "flex items-center justify-center text-center " +
      "transition focus:outline-none";
    const color = COLOR[a.variant];

    if (!disabled && selected === a.id) {
      return `${base} ${color} outline outline-[3px] outline-white`;
    }
    if (confirmed) {
      if (a.id === correct && selected === a.id) return `${base} ${color} ring-2 ring-emerald-400`;
      if (selected === a.id) return `${base} ${color} opacity-70 ring-2 ring-rose-400`;
    }
    return `${base} ${color} ${disabled ? "opacity-70 cursor-not-allowed" : "hover:brightness-[1.06] active:scale-[.99]"}`;
  };

  const renderRightIcon = (a: Answer) => {
    const isSel = selected === a.id;
    if (!isSel) return null;

    if (!confirmed) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }
    if (confirmed && a.id === correct) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }
    if (confirmed && a.id !== correct) {
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
          <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">Geografi</h1>
          <img src={globe} alt="Geografi" className="h-8 w-8 md:h-9 md:w-9" />
        </div>
        <p className="mt-2 text-center text-[15px] text-white/85">Nivå 2 av 10</p>

        <h2 className="mx-auto mt-6 max-w-[820px] text-center text-[26px] md:text-[28px] font-extrabold tracking-tight">
          Vilket land är störst till ytan i världen?
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

        {/* Svarsalternativ */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {ANSWERS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={btnClass(a)}
              onClick={() => {
                if (confirmed || time === 0) return;
                setSelected(a.id);
              }}
              disabled={confirmed || time === 0}
              aria-pressed={selected === a.id}
            >
              {a.text}
              {renderRightIcon(a)}
            </button>
          ))}
        </div>

        {/* Bekräfta – centrerad  */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setConfirmed(true)}
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
        </div>
      </div>
    </div>
  );
}
