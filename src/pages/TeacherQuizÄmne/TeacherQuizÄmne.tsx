import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthApi, Classes, SubjectsApi } from "../../Api/index";

type UINormalizedSubject = {
  id: string;
  name: string;
  iconUrl?: string | null;
  levelsCount?: number;
  topicsCount?: number;
};

function resolveIconUrl(s: any): string {
  const url = s?.iconUrl ?? s?.IconUrl ?? s?.iconURL ?? s?.icon ?? null;
  if (typeof url === "string" && url.trim()) return url;
  return "/icons/open-book.png";
}

export default function QuizVyTeacher(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Get class info from URL params
  const urlClassId = searchParams.get("classId");
  const urlClassName = searchParams.get("className") || "Okänd klass";

  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );
  const [classInfo, setClassInfo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      let me: any = null;
      try {
        me = await AuthApi.getMe();
      } catch { }

      let pickedClassId: string | null = null;
      let pickedClassName: string | null = null;

      // ✅ Use URL params if available, otherwise fallback to first class
      if (urlClassId) {
        pickedClassId = urlClassId;
        pickedClassName = decodeURIComponent(urlClassName);
        setClassInfo({ id: pickedClassId, name: pickedClassName });
      } else {
        // Fallback: get first class from user's classes
        try {
          const myClasses = await Classes.GetUsersClasses();
          if (Array.isArray(myClasses) && myClasses.length > 0) {
            const first = myClasses[0];
            pickedClassId =
              first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id ?? null;
            pickedClassName = first?.name ?? first?.Name ?? "Okänd klass";
            setClassInfo({
              id: pickedClassId || "",
              name: pickedClassName
            });
          }
        } catch { }
      }
      
      // ✅ Load subjects for the selected class
      try {
        if (pickedClassId) {
          const list = await SubjectsApi.getForClass(pickedClassId);
          if (!alive) return;

          const normalized: UINormalizedSubject[] = (
            Array.isArray(list) ? list : []
          ).map((s: any) => ({
            id: s.id ?? s.subjectId,
            name: s.name ?? "Ämne",
            iconUrl: resolveIconUrl(s),
            levelsCount: s.levelsCount ?? s.levelCount ?? undefined,
            topicsCount: s.topicCount ?? s.topicsCount ?? undefined,
          }));

          normalized.sort((a, b) => a.name.localeCompare(b.name));
          setSubjects(normalized);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
        setSubjects([]);
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [urlClassId, urlClassName]);

  const subjectCards = useMemo(() => {
    if (!subjects.length) return [];
    return subjects.map((s) => {
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

  function handleCreateQuiz() {
    if (!selected || !classInfo) return;
    navigate(`/skapa-quiz?subjectId=${selected.id}&classId=${classInfo.id}`);
  }

  // ✅ Go back to class overview
  function handleGoBack() {
    navigate("/klassvy");
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white">
      {/* ✅ Header with back button and class info */}
      <section className="mx-auto max-w-[1100px] px-4 pt-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tillbaka till klassvy
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Skapa quiz för klass: {classInfo?.name || "Laddar..."}
          </h1>
          <h2 className="text-[18px] font-semibold text-white/90">
            Välj ämne för ditt nya quiz
          </h2>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pt-6">
        {loading && (
          <div className="text-center text-white/75 text-sm">
            Laddar ämnen...
          </div>
        )}

        {!loading && subjectCards.length === 0 && (
          <div className="text-center text-white/75 text-sm">
            <p className="mb-4">Denna klass har inga ämnen inlagda ännu.</p>
            <p className="text-xs text-white/60">
              Kontakta en administratör för att lägga till ämnen i klassen.
            </p>
          </div>
        )}

        {!loading && subjectCards.length > 0 && (
          <>
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
            </div>

            <div className="mt-12 flex justify-center pb-20">
              <button
                type="button"
                disabled={!selected || loading}
                onClick={handleCreateQuiz}
                className="inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_26px_70px_rgba(34,197,94,0.45)] hover:brightness-110 active:scale-[0.99] disabled:bg-[#22C55E]/50 disabled:cursor-not-allowed"
              >
                {selected
                  ? `Skapa quiz i ${selected.name}`
                  : "Välj ett ämne först"
                }
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}