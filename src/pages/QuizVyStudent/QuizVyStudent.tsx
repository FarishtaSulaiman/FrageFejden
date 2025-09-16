//Src/pages/QuizVyStudent/QuizVyStudent.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi, Classes, SubjectsApi } from "../../Api/index";

import titleImg from "../../assets/images/titles/frageFejden-title-pic.png";
import rankingIcon from "../../assets/images/icons/ranking-icon.png";
import scoreIcon from "../../assets/images/icons/score-icon.png";
import avatarImg from "../../assets/images/avatar/avatar1.png";


type UINormalizedSubject = {
  id: string;
  name: string;
  iconUrl?: string | null;
  // valfri metadata att visa under titeln
  levelsCount?: number;
  topicsCount?: number;
};

/** Försök hitta ikon-URL på olika fältnamn + fallback till lokal ikon */
function resolveIconUrl(s: any): string {
  const url =
    s?.iconUrl ??
    s?.IconUrl ??
    s?.iconURL ??
    s?.icon ??
    null;

  // Om backend returnerar absolut URL → använd den
  if (typeof url === "string" && url.trim()) return url;

  // Om ni lagrar ikoner lokalt i /public/icons/...
  return "/icons/open-book.png";
}

export default function QuizVyStudent(): React.ReactElement {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("Användare");
  const [className, setClassName] = useState("—");
  const [classId, setClassId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);

  // 🔹 Nu hämtar vi ÄMNEN (subjects) – inte topics
  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // Vald subject
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      // 1) Hämta användare
      let me: any = null;
      try {
        me = await AuthApi.getMe(); // hämtar inloggad användare
        if (!alive) return;
        setDisplayName(me?.fullName?.trim() || "Användare");
      } catch {
        setDisplayName("Användare");
      }

      // 2) Hämta poäng
      try {
        if (me?.id) {
          const xp = await Classes.GetLoggedInUserScore(me.id);
          if (!alive) return;
          setPoints(typeof xp === "number" ? xp : 0);
        }
      } catch {
        setPoints(0);
      }

      // 3) Hämta klasser & ranking (vi använder första klassen)
      let pickedClassId: string | null = null;
      try {
        const myClasses = await Classes.GetUsersClasses();
        if (!alive) return;

        if (Array.isArray(myClasses) && myClasses.length > 0) {
          const first = myClasses[0];
          pickedClassId =
            first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id ?? null;
          const clsName = first?.name ?? first?.className ?? "—";
          setClassName(clsName || "—");
          setClassId(pickedClassId);

          if (pickedClassId && me?.id) {
            const { myRank } = await Classes.GetClassLeaderboard(
              pickedClassId,
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
      } catch {
        setClassName("—");
        setRankNum(null);
      }

      // 4) 🔁 HÄMTA ÄMNEN I KLASSEN (inte topics)
      try {
        if (!pickedClassId) {
          setSubjects([]);
        } else {
          const list = await SubjectsApi.getForClass(pickedClassId); // ämnen i klassen
          if (!alive) return;

          const normalized: UINormalizedSubject[] = (Array.isArray(list)
            ? list
            : []
          ).map((s: any) => ({
            id: s.id ?? s.subjectId,
            name: s.name ?? "Ämne",
            iconUrl: resolveIconUrl(s),
            // försök visa vettig siffra i undertexten
            levelsCount:
              s.levelsCount ?? s.levelCount ?? undefined,
            topicsCount:
              s.topicCount ?? s.topicsCount ?? undefined,
          }));

          // sortera alfabetiskt
          normalized.sort((a, b) => a.name.localeCompare(b.name));
          setSubjects(normalized);
        }
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

  // Mappa ÄMNEN till kort (samma design som tidigare)
  const subjectCards = useMemo(() => {
    if (!subjects.length) return [];
    return subjects.map((s) => {
      // välj en undertext
      const sub =
        typeof s.levelsCount === "number" && s.levelsCount > 0
          ? `${s.levelsCount} nivåer`
          : typeof s.topicsCount === "number" && s.topicsCount > 0
            ? `${s.topicsCount} områden`
            : "Inga nivåer ännu";

      return {
        id: s.id,
        label: s.name,
        sub,
        iconUrl: s.iconUrl,
      };
    });
  }, [subjects]);

  // Bekräfta val -> gå till SUBJECTS TOPIC-LISTA
  function handleConfirm() {
    if (!selected) return;
    const cid = classId ?? "";
    navigate(`/subjects/${selected.id}/topics?classId=${cid}`);
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

      {/* Ämneskort (samma design, men renderar subjects) */}
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
                      <img
                        src={s.iconUrl || "/icons/open-book.png"}
                        alt={s.label}
                        className="h-[56px] w-[56px] object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/icons/open-book.png";
                        }}
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
