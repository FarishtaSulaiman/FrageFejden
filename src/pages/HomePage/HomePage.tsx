import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";

import groupImg from "../../assets/images/pictures/fragefejden-group-pic.png";
import studentsIcon from "../../assets/images/icons/students-icon.png";
import teacherIcon from "../../assets/images/icons/teacher-icon.png";
import trophyIcon from "../../assets/images/icons/trophy-icon.png";
import controllerIcon from "../../assets/images/icons/climb-the-leaderboard-icon.png";
import subjectIcon from "../../assets/images/icons/history-icon.png";

export default function HomePage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="w-full bg-[#0A0F1F] text-white">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_720px_at_86%_12%,rgba(88,40,211,0.35),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-12 pb-12 md:grid-cols-[1.08fr_0.92fr] lg:px-6">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-40 -top-40 md:-left-64 md:-top-56 h-[36rem] w-[36rem] md:h-[46rem] md:w-[46rem] rounded-full -z-10 bg-[radial-gradient(closest-side_at_50%_50%,rgba(139,92,246,0.92),rgba(88,40,211,0.58)_56%,transparent_72%)]"
            />
            <h1 className="font-extrabold tracking-tight leading-[1.06] text-[44px] md:text-[64px]">
              <span className="block text-white">Där lärande blir en</span>
              <span className="block text-white">kamp –</span>
              <span className="mt-2 block text-[#D7CBFF]">och segern</span>
              <span className="block text-[#D7CBFF]">är din kunskap.</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[15px] text-white/90">
              Utmana dina vänner i kunskap – börja gratis redan idag.
            </p>
            <div className="mt-6 w-full">
              <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(34,197,94,0.35)] hover:brightness-110 active:scale-[0.99]"
                >
                  Registrera dig
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#4F2ACB] px-6 py-3 text-[14px] font-semibold text-white/95 shadow-[0_12px_28px_rgba(79,42,203,0.45)] hover:brightness-110 active:scale-[0.99]"
                >
                  Logga in
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -inset-x-16 bottom-6 h-44 rounded-full bg-[radial-gradient(70%_100%_at_50%_100%,rgba(124,76,255,0.75),transparent_72%)] blur-[52px] opacity-90" />
            <div className="relative mx-auto w-full max-w-[560px] rounded-[26px] bg-[#0F1426] p-5 ring-1 ring-white/10 shadow-[0_25px_80px_rgba(124,76,255,0.25),0_0_0_1px_rgba(0,0,0,0.25)]">
              <img
                src={groupImg}
                alt="Frågefejden - vänner som quiz:ar"
                className="h-auto w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-4 pb-10 lg:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <article className="rounded-2xl border border-[#2A3353] bg-[#0F1A2F]/90 shadow-[0_10px_26px_rgba(0,0,0,0.25)]">
            <header className="flex items-center gap-3 px-6 pb-3 pt-5">
              <img src={studentsIcon} className="h-8 w-8" alt="Studenthatt" />
              <h3 className="text-[17px] font-semibold">För elever</h3>
            </header>
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-[#202A49]/60 px-4 py-4 text-[14.5px] leading-relaxed text-white/90">
                ”Frågefejden gör lärandet roligare! Samla poäng, utmana dina vänner och klättra på topplistan – samtidigt som du lär dig mer i skolan.”
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-[#2A3353] bg-[#0F1A2F]/90 shadow-[0_10px_26px_rgba(0,0,0,0.25)]">
            <header className="flex items-center gap-3 px-6 pb-3 pt-5">
              <img src={teacherIcon} className="h-8 w-8" alt="Lärarikon" />
              <h3 className="text-[17px] font-semibold">För lärare</h3>
            </header>
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-[#202A49]/60 px-4 py-4 text-[14.5px] leading-relaxed text-white/90">
                ”Frågefejden – lärande på ett nytt sätt. Följ elevers utveckling, skapa quiz och testa deras kunskaper digitalt. Ett engagerande och roligt verktyg för klassrummet.”
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#2A3353] bg-[#0F1A2F]/90 px-6 py-8 text-center">
            <img src={subjectIcon} alt="Ämne" className="mx-auto mb-4 h-12 w-12" />
            <h4 className="text-[16px] font-semibold">Välj ämne</h4>
          </div>
          <div className="rounded-2xl border border-[#2A3353] bg-[#0F1A2F]/90 px-6 py-8 text-center">
            <img src={trophyIcon} alt="Pokal" className="mx-auto mb-4 h-12 w-12" />
            <h4 className="text-[16px] font-semibold">Utmana vänner</h4>
          </div>
          <div className="rounded-2L border border-[#2A3353] bg-[#0F1A2F]/90 px-6 py-8 text-center">
            <img src={controllerIcon} alt="Handkontroll" className="mx-auto mb-4 h-12 w-12" />
            <h4 className="text-[16px] font-semibold">Klättra på topplistan</h4>
          </div>
        </div>
      </section>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => {
          setShowLogin(false);
          navigate("/dashboard");
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onRegisterSuccess={() => {
          setShowRegister(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
}
