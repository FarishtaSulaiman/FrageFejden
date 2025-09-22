import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthApi, SubjectsApi, TeacherClasses } from "../../Api/index";

//typ för ämne
type UINormalizedSubject = {
  id: string;
  name: string;
  topicsCount?: number;
};

// ikoner för ämnen
import geografiIcon from "../../assets/images/icons/geografy-icon.png";
import historyIcon from "../../assets/images/icons/history-icon.png";
import mathIcon from "../../assets/images/icons/math-transparent.png";
import bookIcon from "../../assets/images/icons/open-book.png";

// koppla ämnesnamn till ikon
const SUBJECT_ICON_BY_NAME: Record<string, string> = {
  geografi: geografiIcon,
  historia: historyIcon,
  matematik: mathIcon,
  svenska: bookIcon,
};

// hämta rätt ikon för ämnet
function subjectIconFor(name?: string) {
  const key = (name ?? "").trim().toLowerCase();
  return SUBJECT_ICON_BY_NAME[key] ?? bookIcon; // om inget matchar, ta bok-ikonen
}

export default function QuizVyTeacher() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // hämta klassId från URL
  const queryClassId = searchParams.get("classId");

  // state för klassinfo, ämnen, valt ämne och laddning
  const [classInfo, setClassInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [selected, setSelected] = useState<UINormalizedSubject | null>(null);
  const [loading, setLoading] = useState(true);

  // hämta klassinfo
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const myClasses = await TeacherClasses.GetCreatedClasses();
        if (!Array.isArray(myClasses) || myClasses.length === 0) return;

        // ta klassen från URL eller första klassen om ingen matchar
        const pickedClass =
          myClasses.find((c) => c.id === queryClassId) || myClasses[0];
        if (!alive) return;

        setClassInfo({ id: pickedClass.id, name: pickedClass.name });
      } catch (err) {
        console.error("Kunde inte hämta klasser:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [queryClassId]);

  // hämta ämnen när klassen är vald
  useEffect(() => {
    if (!classInfo?.id) return;

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await AuthApi.getMe(); // kontrollera användare

        const list = await SubjectsApi.getForClass(classInfo.id);
        if (!alive) return;

        const normalized: UINormalizedSubject[] = (
          Array.isArray(list) ? list : []
        ).map((s) => ({
          id: s.id,
          name: s.name ?? "Ämne",
          topicsCount: s.topicCount ?? undefined,
        }));

        // sortera alfabetiskt
        normalized.sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(normalized);

        // väljer första ämnet automatiskt
        setSelected(normalized[0] || null);
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
        setSubjects([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [classInfo]);

  // gör om ämnen till kort för visning, så det blir snyggt
  const subjectCards = useMemo(() => {
    if (!subjects.length) return [];
    return subjects.map((s) => ({
      id: s.id,
      label: s.name,
      sub: s.topicsCount ? `${s.topicsCount} områden` : "Inga nivåer ännu",
      icon: subjectIconFor(s.name),
    }));
  }, [subjects]);

  // gå till skapa quiz-sidan när man trycker på knappen
  const handleCreateQuiz = () => {
    if (!selected || !classInfo) return;
    navigate(`/skapa-quiz?subjectId=${selected.id}&classId=${classInfo.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
      {/* rubrik */}
      <h2 className="text-center text-[18px] font-semibold text-white/90 mb-6">
        Välj ämne för nytt quiz för{" "}
        <span className="font-bold">{classInfo?.name ?? "—"}</span>
      </h2>

      {loading && <p>Laddar...</p>}

      {/* Visa ämneskort */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[1100px] mx-auto">
          {subjectCards.map((s) => {
            const isSelected = selected?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected({ id: s.id, name: s.label })}
                disabled={loading}
                className="relative w-full text-left"
              >
                {/* markera valt ämne */}
                {isSelected && (
                  <div className="absolute -inset-[6px] rounded-[26px] ring-2 ring-white/95" />
                )}
                <article className="relative h-[140px] w-full rounded-[26px] border border-[#1E2A49] bg-[#0E1629] px-7 py-6 flex items-center gap-6">
                  <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E1A34] to-[#0B152A]">
                    <img
                      src={s.icon}
                      alt={s.label}
                      className="h-[56px] w-[56px] object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold">{s.label}</h3>
                    <p className="mt-1 text-[13px] text-white/65">{s.sub}</p>
                  </div>
                </article>
              </button>
            );
          })}

          {/* om inga ämnen finns */}
          {!loading && subjectCards.length === 0 && (
            <div className="col-span-full text-center text-white/75 text-sm">
              Du har inga ämnen inlagda ännu.
            </div>
          )}
        </div>
      )}

      {/* knapp för att skapa nytt quiz */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={handleCreateQuiz}
          disabled={!selected || loading}
          className="bg-[#22C55E] px-8 py-3 rounded-xl font-semibold text-white disabled:bg-[#22C55E]/50"
        >
          Skapa nytt quiz
        </button>
      </div>
    </div>
  );
}
