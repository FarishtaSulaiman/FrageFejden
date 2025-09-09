<<<<<<< HEAD
=======

>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthApi, Classes, SubjectsApi } from "../../Api";

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
  const getMe = AuthApi.getMe;


  const [displayName, setDisplayName] = useState<string>("Användare");
  const [className, setClassName] = useState<string>("—");
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);


<<<<<<< HEAD
=======
  // Ämnen hämtade från profilen
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
  const [subjects, setSubjects] = useState<
    Awaited<ReturnType<typeof SubjectsApi.getMySubjects>>
  >([]);

<<<<<<< HEAD
 
=======
  // Val av ämne 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

<<<<<<< HEAD
  
=======
 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // Hämtar inloggad användare → poäng → klasser/rank → ämnen
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) Inloggad användare
        const me = await getMe();

<<<<<<< HEAD
        
        const fullName =
          (me as any).FullName?.trim?.() ||
          (me as any).fullName?.trim?.() ||
          "";
        const nameFromUserName = me.userName?.split("@")[0]?.trim() || "";
        const nameFromEmail = me.email?.split("@")[0]?.trim() || "";

        const name =
          fullName ||
          nameFromUserName ||
          nameFromEmail ||
          "Användare";

=======
        //  visningsnamn - om inget = "Användare"
        const name =
          me.userName?.trim() || me.email?.split("@")[0] || "Användare";
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        if (!alive) return;
        setDisplayName(name);

        // 2) Poäng
        const xp = await Classes.GetLoggedInUserScore(me.id);
        if (!alive) return;
        setPoints(typeof xp === "number" ? xp : 0);

<<<<<<< HEAD
        // 3) Mina klasser
=======
        // 3) Mina klasser 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        const myClasses = await Classes.GetUsersClasses();
        if (!alive) return;
        const first = myClasses?.[0];

<<<<<<< HEAD
        // Klass-id (robust fältupplock)
        const classId =
          first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id;

        // Klassnamn
=======
        // Klass-id 
        const classId =
          first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id;

        // Klassnamn 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        const clsName =
          first?.name ?? first?.className ?? first?.Name ?? "—";
        setClassName(clsName || "—");

<<<<<<< HEAD
        // 4) Rank (om classId finns)
=======
        // 4) Rank 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        if (classId) {
          const { myRank } = await Classes.GetClassLeaderboard(classId, me.id);
          if (!alive) return;
          setRankNum(myRank ?? null);
        } else {
          setRankNum(null);
        }

        // 5) Mina ämnen
        const mySubjects = await SubjectsApi.getMySubjects();
        if (!alive) return;
        setSubjects(Array.isArray(mySubjects) ? mySubjects : []);
      } catch (e: any) {
        console.error("Kunde inte hämta profil/poäng/klass/ämnen:", e);
        if (!alive) return;

<<<<<<< HEAD
        // Visa tydlig feltext
=======
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        const status = e?.response?.status ?? "—";
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.title ||
          e?.message ||
          "Okänt fel";
<<<<<<< HEAD
        setErr(`Kunde inte ladda data (${status}). ${msg}`);
=======
        
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248

        // fallbacks
        setDisplayName("Användare");
        setClassName("—");
        setPoints(0);
<<<<<<< HEAD
        setRankNum(null); // visa "—" i UI
=======
        setRankNum(0);
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
        setSubjects([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

<<<<<<< HEAD
  
=======
 
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
  const subjectCards = useMemo(() => {
    if (!subjects?.length) return [];
    return subjects.map((s) => ({
      id: s.id,
      label: s.name,
      sub: "10 nivåer kvar",
      icon: subjectIconFor(s.name),
    }));
  }, [subjects]);

<<<<<<< HEAD
  // Navigering med ENDAST subjectId
=======

>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
  function handleConfirm() {
    if (!selected) return;
    navigate(`/quiz?subjectId=${selected.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white">
<<<<<<< HEAD
   
      <section className="relative">
        <div className="relative h-[230px] overflow-hidden bg-gradient-to-r from-[#5E2FD7] via-[#5B2ED6] to-[#3E1BB2]">
     
=======
      <section className="relative">
        <div className="relative h-[230px] overflow-hidden bg-gradient-to-r from-[#5E2FD7] via-[#5B2ED6] to-[#3E1BB2]">

>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
          <div
            aria-hidden
            className="absolute -left-40 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.12),transparent_72%)]"
          />
          <div
            aria-hidden
            className="absolute -right-48 -bottom-44 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.08),transparent_72%)]"
          />

<<<<<<< HEAD
          
=======
          {/* Navbar */}
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
          <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
            <img
              src={titleImg}
              alt="FRÅGEFEJDEN"
              className="h-[96px] sm:h-[112px] w-auto -ml-3 sm:-ml-6 lg:-ml-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
            />

            <div className="flex items-center gap-3">
              <div className="mr-1 text-right leading-tight">
<<<<<<< HEAD
                <div className="text-[13px] text-white/85">
                  {loading ? "Laddar…" : `Hej ${displayName}!`}
                </div>
=======
                {/* Namn på inloggad */}
                <div className="text-[13px] text-white/85">
                  {loading ? "Laddar…" : `Hej ${displayName}!`}
                </div>
                {/* Klassnamn */}
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
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

<<<<<<< HEAD
         
=======
          {/* ranking + poäng */}
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
          <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-5">
              <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                <img src={rankingIcon} alt="Ranking" className="h-7 w-7" />
                <div className="leading-tight">
                  <div className="text-[13px] text-white/85">Ranking</div>
                  <div className="text-[17px] font-semibold">
                    {loading ? "…" : (rankNum ?? "—")}
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

<<<<<<< HEAD
      
=======
  
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
      <section className="mx-auto max-w-[1100px] px-4 pt-16">
        <h2 className="text-center text-[18px] font-semibold text-white/90">
          Välj din kurs
        </h2>
      </section>

<<<<<<< HEAD
    
=======
   
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
      {err && (
        <section className="mx-auto max-w-[1100px] px-4 pt-6">
          <div className="mx-auto mb-4 max-w-[700px] rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/30">
            {err}
          </div>
        </section>
      )}
<<<<<<< HEAD
=======

>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248

      
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
<<<<<<< HEAD
              
=======
            
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
                {isSelected && (
                  <div className="pointer-events-none absolute -inset-[6px] rounded-[26px] ring-2 ring-white/95 shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" />
                )}

                <article className="relative h-[140px] w-full rounded-[26px] border border-[#1E2A49] bg-[#0E1629] px-7 py-6 shadow-[0_22px_48px_rgba(0,0,0,0.5)]">
                  <div className="flex h-full items-center gap-6">
                    <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E1A34] to-[#0B152A] ring-1 ring-white/5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                      <img
                        src={s.icon}
                        alt={s.label}
                        className="h-[56px] w-[56px]"
                      />
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

         
          {!loading && subjectCards.length === 0 && (
            <div className="col-span-full text-center text-white/75 text-sm">
<<<<<<< HEAD
              Du har inga kurser inlagda ännu.
=======
              Inga ämnen i din profil ännu.
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
            </div>
          )}
        </div>

<<<<<<< HEAD
      
=======
        {/* Bekräfta-knapp */}
>>>>>>> e4bdbfceafeed8b91786c089973ad0a9e9483248
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
