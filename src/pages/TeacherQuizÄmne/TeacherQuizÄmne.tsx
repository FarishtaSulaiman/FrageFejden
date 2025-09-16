// src/pages/QuizVyTeacher/QuizVyTeacher.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      let me: any = null;
      try {
        me = await AuthApi.getMe();
      } catch {}

      let pickedClassId: string | null = null;
      try {
        const myClasses = await Classes.GetUsersClasses();
        if (Array.isArray(myClasses) && myClasses.length > 0) {
          const first = myClasses[0];
          pickedClassId =
            first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id ?? null;
          setClassId(pickedClassId);
        }
      } catch {}

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
        setSubjects([]);
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

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
    if (!selected) return;
    const cid = classId ?? "";
    navigate(`/skapa-quiz?subjectId=${selected.id}&classId=${cid}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white">
      <section className="mx-auto max-w-[1100px] px-4 pt-16">
        <h2 className="text-center text-[18px] font-semibold text-white/90">
          Välj ämne för nytt quiz
        </h2>
      </section>

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

          {!loading && subjectCards.length === 0 && (
            <div className="col-span-full text-center text-white/75 text-sm">
              Du har inga ämnen inlagda ännu.
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center pb-20">
          <button
            type="button"
            disabled={!selected || loading}
            onClick={handleCreateQuiz}
            className="inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_26px_70px_rgba(34,197,94,0.45)] hover:brightness-110 active:scale-[0.99] disabled:bg-[#22C55E]/50 disabled:cursor-not-allowed"
          >
            Skapa nytt quiz
          </button>
        </div>
      </section>
    </div>
  );
}
