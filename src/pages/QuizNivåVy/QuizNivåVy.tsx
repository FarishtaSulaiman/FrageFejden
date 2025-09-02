// src/pages/QuizNivåVy/QuizNivåVy.tsx
import React from "react";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";
import globe from "../../assets/images/icons/geografy-icon.png";
import bulb from "../../assets/images/pictures/fun-fact-pic.png";

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
  const items = Array.from({ length: 10 });

  return (
    <div className="min-h-screen w-full bg-[#0A0F1F] text-white">
      {/* Full-bleed banner som sitter ihop med navbaren */}
      <div className="w-screen -mt-[1px] ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]">
        <div className="relative h-[200px] md:h-[220px] overflow-hidden rounded-b-[28px] bg-gradient-to-r from-[#5A39E6] via-[#4F2ACB] to-[#4A2BC3]">
          <div aria-hidden className="pointer-events-none absolute -left-40 -top-36 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgba(173,140,255,0.95),rgba(123,76,255,0.5)_58%,transparent_72%)]" />
          <img
            src={frageTitle}
            alt="FrågeFejden"
            className="absolute left-10 top-10 h-16 md:h-24 object-contain opacity-100 drop-shadow-[0_4px_0_rgba(0,0,0,0.25)]"
          />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-2 ring-2 ring-white/25">
            <img
              src={avatar}
              alt="Profil"
              className="h-[84px] w-[84px] rounded-full ring-2 ring-white/80"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8 pb-16">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-center text-[26px] font-semibold text-white/90 md:text-[28px]">Du har valt kursen: Geografi</h2>
          <img src={globe} alt="Geografi" className="h-6 w-6 md:h-7 md:w-7" />
        </div>

        <div className="relative mx-auto mt-6 w-[460px] max-w-full">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-white/90">1 av 10 nivåer klara</div>
          <div className="h-[3px] w-full rounded bg-white/15">
            <div className="h-full w-[64px] rounded bg-[#E9C341]" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-4 justify-items-center gap-x-16 gap-y-14">
          {items.map((_, i) => {
            if (i === 0) {
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 text-[18px] font-bold text-white shadow-[0_22px_60px_rgba(16,185,129,0.45)]">
                    1
                    <div className="pointer-events-none absolute -inset-3 rounded-full bg-emerald-500/30 blur-[18px]" />
                  </div>
                </div>
              );
            }
            if (i === 1) {
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative grid h-[72px] w-[72px] place-items-center rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#4F2ACB] text-white shadow-[0_22px_60px_rgba(79,42,203,0.5)]">
                    <StarIcon />
                    <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#6B46F2]/30 blur-[18px]" />
                  </div>
                  <div className="mt-3 text-xs text-white/85">Lås upp nivå 2</div>
                </div>
              );
            }
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#12192B] text-white/85 ring-1 ring-[#2A3760]/60">
                  <LockIcon />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-end">
          <div className="w-[360px] rounded-2xl bg-[#5B3CF2] px-5 py-4 text-white shadow-[0_36px_96px_rgba(91,60,242,0.55)]">
            <div className="mb-1 flex items-center gap-3">
              <img src={bulb} alt="Tips" className="h-7 w-7" />
              <span className="text-[18px] font-semibold">Tips</span>
            </div>
            <div className="text-sm">Slutför dina nivåer för att få poäng</div>
          </div>
        </div>
      </div>
    </div>
  );
}
