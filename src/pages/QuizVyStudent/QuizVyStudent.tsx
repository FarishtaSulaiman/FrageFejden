import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi, Classes, SubjectsApi } from "../../Api/index";


import titleImg from "../../assets/images/titles/frageFejden-title-pic.png";
import rankingIcon from "../../assets/images/icons/ranking-icon.png";
import scoreIcon from "../../assets/images/icons/score-icon.png";
import geografiIcon from "../../assets/images/icons/geografy-icon.png";
import historyIcon from "../../assets/images/icons/history-icon.png";
import mathIcon from "../../assets/images/icons/math-transparent.png";
import bookIcon from "../../assets/images/icons/open-book.png";
import avatarImg from "../../assets/images/avatar/avatar1.png";


const SUBJECT_ICON_BY_NAME: Record<string, string> = {
  geografi: geografiIcon,
  historia: historyIcon,
  matematik: mathIcon,
  svenska: bookIcon,
};

function subjectIconFor(name?: string) {
  const key = (name ?? "").trim().toLowerCase();
  return SUBJECT_ICON_BY_NAME[key] ?? bookIcon;
}

export default function QuizVyStudent(): React.ReactElement {
  const navigate = useNavigate();

 
  const [displayName, setDisplayName] = useState("Användare");
  const [className, setClassName] = useState("—");
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);

  // Hämta ämnen
  const [subjects, setSubjects] = useState<
    Awaited<ReturnType<typeof SubjectsApi.getMySubjects>>
  >([]);

  // Val av ämne
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

  // Laddar data från API
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      let me: any = null;

      // 1) Hämta användare
      try {
        me = await AuthApi.getMe();
        if (!alive) return;
        setDisplayName(me.fullName?.trim() || "Användare");
      } catch (err) {
        console.error("Kunde inte hämta användare:", err);
        setDisplayName("Användare");
      }

      // 2) Hämta poäng
      try {
        if (me) {
          const xp = await Classes.GetLoggedInUserScore(me.id);
          if (!alive) return;
          setPoints(typeof xp === "number" ? xp : 0);
        }
      } catch (err) {
        console.error("Kunde inte hämta poäng:", err);
        setPoints(0);
      }

      // 3) Hämta klass + ranking
      try {
        if (me) {
          const myClasses = await Classes.GetUsersClasses();
          if (!alive) return;

          if (Array.isArray(myClasses) && myClasses.length > 0) {
            const first = myClasses[0];
            const classId =
              first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id;
            const clsName = first?.name ?? first?.className ?? "—";
            setClassName(clsName || "—");

            if (classId) {
              const { myRank } = await Classes.GetClassLeaderboard(
                classId,
                me.id
              );
              if (!alive) return;
              setRankNum(myRank ?? null);
            } else {
              setRankNum(null);
            }
          } else {
            setClassName("—");
            setRankNum(null);
          }
        }
      } catch (err) {
        console.error("Kunde inte hämta klass/ranking:", err);
        setClassName("—");
        setRankNum(null);
      }

      // 4) Hämta ämnen
      try {
        const mySubjects = await SubjectsApi.getMySubjects();
        if (!alive) return;
        setSubjects(Array.isArray(mySubjects) ? mySubjects : []);
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
        setSubjects([]);
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Mappa ämnen till kort
  const subjectCards = useMemo(() => {
    if (!subjects?.length) return [];
    return subjects.map((s) => ({
      id: s.id,
      label: s.name,
      sub:
        s.levelsCount && s.levelsCount > 0
          ? `${s.levelsCount} nivåer`
          : "Inga nivåer ännu",
      icon: subjectIconFor(s.name),
    }));
  }, [subjects]);

  // Bekräfta ämnesval
  function handleConfirm() {
    if (!selected) return;
    navigate(`/quiz?subjectId=${selected.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white">
      {/* Header med namn, klass, poäng */}
      <section className="relative">
        <div className="relative h-[230px] overflow-hidden bg-gradient-to-r from-[#5E2FD7] via-[#5B2ED6] to-[#3E1BB2]">
          <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
            <img
              src={titleImg}
              alt="FRÅGEFEJDEN"
              className="h-[96px] sm:h-[112px] w-auto -ml-3 sm:-ml-6 lg:-ml-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
            />
            <div className="flex items-center gap-3">
              <div className="mr-1 text-right leading-tight">
                <div className="text-[13px] text-white/85">
                  {loading ? "Laddar…" : `Hej ${displayName}!`}
                </div>
                <div className="text-[12px] text-white/70">
                  {loading ? "—" : `Klass: ${className}`}
                </div>
              </div>
              <img
                src={avatarImg}
                alt="Avatar"
                className="h-[72px] w-[72px] rounded-full ring-2 ring-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.35)] object-cover"
              />
            </div>
          </div>

          {/* Ranking + Poäng */}
          <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-5">
              <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                <img src={rankingIcon} alt="Ranking" className="h-7 w-7" />
                <div className="leading-tight">
                  <div className="text-[13px] text-white/85">Ranking</div>
                  <div className="text-[17px] font-semibold">
                    {loading ? "…" : rankNum ?? "—"}
                  </div>
                </div>
              </div>
              <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                <img src={scoreIcon} alt="Poäng" className="h-7 w-7" />
                <div className="leading-tight">
                  <div className="text-[13px] text-white/85">Poäng</div>
                  <div className="text-[17px] font-semibold">
                    {loading ? "…" : points}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Titel */}
      <section className="mx-auto max-w-[1100px] px-4 pt-16">
        <h2 className="text-center text-[18px] font-semibold text-white/90">
          Välj din kurs
        </h2>
      </section>

      {/* Ämneskort */}
      <section className="mx-auto max-w-[1100px] px-4 pt-6">
        <div className="grid grid-cols-1 place-items-center gap-x-16 gap-y-10 sm:grid-cols-2">
          {subjectCards.map((s) => {
            const isSelected = selected?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected({ id: s.id, name: s.label })}
                aria-pressed={isSelected}
                className="relative w-full max-w-[460px] text-left"
                disabled={loading}
              >
                {isSelected && (
                  <div className="pointer-events-none absolute -inset-[6px] rounded-[26px] ring-2 ring-white/95 shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" />
                )}
                <article className="relative h-[140px] w-full rounded-[26px] border border-[#1E2A49] bg-[#0E1629] px-7 py-6 shadow-[0_22px_48px_rgba(0,0,0,0.5)]">
                  <div className="flex h-full items-center gap-6">
                    <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E1A34] to-[#0B152A] ring-1 ring-white/5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                      <img src={s.icon} alt={s.label} className="h-[56px] w-[56px]" />
                    </div>
                    <div className="translate-y-[-2px]">
                      <h3 className="text-[20px] font-semibold">{s.label}</h3>
                      <p className="mt-1 text-[13px] text-white/65">{s.sub}</p>
                    </div>
                  </div>
                </article>
              </button>
            );
          })}

          {/* Fallback om inga kurser */}
          {!loading && subjectCards.length === 0 && (
            <div className="col-span-full text-center text-white/75 text-sm">
              Du har inga kurser inlagda ännu.
            </div>
          )}
        </div>

        {/* Bekräfta-knapp */}
        <div className="mt-12 flex justify-center pb-20">
          <button
            type="button"
            disabled={!selected || loading}
            onClick={handleConfirm}
            className="inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_26px_70px_rgba(34,197,94,0.45)] hover:brightness-110 active:scale-[0.99] disabled:bg-[#22C55E]/50 disabled:cursor-not-allowed"
          >
            Bekräfta val
          </button>
        </div>
      </section>
    </div>
  );
}
