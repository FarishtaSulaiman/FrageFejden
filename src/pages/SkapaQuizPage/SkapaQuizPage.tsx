import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { SubjectsApi } from "../../Api";

// ämnen
type UINormalizedSubject = { id: string; name: string };

// fråga (flervals)
type Question = {
  q: string;
  options: string[];
  correctIndex: number | null;
};

// nivå
type Level = {
  id: number;
  text: string;
  isOpen: boolean;
  questions: Question[];
  createdAt: string;
};

// modal-state
type ConfirmState = {
  open: boolean;
  message: string;
  onConfirm: () => void;
};

export default function CreateQuizPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId");
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    subjectId || ""
  );
  const [levels, setLevels] = useState<Level[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // hårdkodat klassnamn
  const className = "8C";

  // modal
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  // hämta ämnen
  useEffect(() => {
    if (!classId) return;
    (async () => {
      try {
        const list = await SubjectsApi.getForClass(classId);
        const normalized = (Array.isArray(list) ? list : []).map((s: any) => ({
          id: s.id ?? s.subjectId,
          name: s.name ?? "Ämne",
        }));
        normalized.sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(normalized);

        if (subjectId) setSelectedSubject(subjectId);
        else if (normalized.length > 0) setSelectedSubject(normalized[0].id);
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
        setSubjects([]);
      }
    })();
  }, [classId, subjectId]);

  // modal helper
  function openConfirm(message: string, onConfirm: () => void) {
    setConfirm({ open: true, message, onConfirm });
  }
  function closeConfirm() {
    setConfirm({ ...confirm, open: false });
  }

  // lägg till nivå
  function addLevel() {
    if (levels.length >= 10) return;
    const newLevel: Level = {
      id: Date.now(),
      text: "",
      isOpen: true,
      questions: [],
      createdAt: new Date().toISOString(),
    };
    setLevels((p) => [...p, newLevel]);
  }

  // ta bort nivå
  function removeLevel(levelId: number) {
    openConfirm("Är du säker på att du vill ta bort den här nivån?", () =>
      setLevels((p) => p.filter((l) => l.id !== levelId))
    );
  }

  // lägg till fråga
  function addQuestion(levelId: number) {
    setLevels((p) =>
      p.map((l) =>
        l.id === levelId
          ? {
              ...l,
              questions: [
                ...l.questions,
                { q: "", options: ["", ""], correctIndex: null },
              ],
            }
          : l
      )
    );
  }

  // ta bort fråga
  function removeQuestion(levelId: number, questionIndex: number) {
    openConfirm("Är du säker på att du vill ta bort den här frågan?", () =>
      setLevels((p) =>
        p.map((l) =>
          l.id === levelId
            ? {
                ...l,
                questions: l.questions.filter((_, i) => i !== questionIndex),
              }
            : l
        )
      )
    );
  }

  // ta bort alternativ
  function removeOption(levelId: number, qIndex: number, optIndex: number) {
    openConfirm(
      "Är du säker på att du vill ta bort det här alternativet?",
      () =>
        setLevels((p) =>
          p.map((l) => {
            if (l.id !== levelId) return l;
            const questions = l.questions.map((qq, idx) => {
              if (idx !== qIndex) return qq;
              if (qq.options.length <= 1) {
                alert("Minst ett svarsalternativ måste finnas kvar.");
                return qq;
              }
              const newOptions = qq.options.filter((_, oi) => oi !== optIndex);
              let newCorrect = qq.correctIndex;
              if (qq.correctIndex === optIndex) newCorrect = null;
              else if (
                typeof qq.correctIndex === "number" &&
                qq.correctIndex > optIndex
              )
                newCorrect = qq.correctIndex - 1;
              return { ...qq, options: newOptions, correctIndex: newCorrect };
            });
            return { ...l, questions };
          })
        )
    );
  }

  // toggle nivå
  function toggleLevel(levelId: number) {
    setLevels((p) =>
      p.map((l) => (l.id === levelId ? { ...l, isOpen: !l.isOpen } : l))
    );
  }

  // spara quiz
  function saveQuiz() {
    openConfirm("Är du säker att du är klar och vill spara?", () => {
      const quizData = {
        subjectId: selectedSubject,
        levels,
        createdAt: new Date().toISOString(),
      };
      setCreatedAt(quizData.createdAt);
      console.log("Quiz sparat:", quizData);

      // navigerar till klassvy
      navigate("/klassvy");
    });
  }

  // avbryt
  function cancelQuiz() {
    openConfirm(
      "Är du säker på att du vill avbryta? Inget sparas och du återgår till klassvyn.",
      () => {
        // navigerar till klassvy
        navigate(`/klassvy`);
      }
    );
  }

  const currentSubjectName =
    subjects.find((s) => s.id === selectedSubject)?.name || "—";

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
      {/* rubrik */}
      <h1 className="text-2xl font-bold mb-6">
        Skapa ett quiz {currentSubjectName} till klass {className}
      </h1>

      {/* välj ämne */}
      <div className="mb-4">
        <label className="block mb-1">Välj topic</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-200 text-black"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* knappar */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={addLevel}
          disabled={levels.length >= 10}
          className={`px-4 py-2 rounded ${
            levels.length >= 10
              ? "bg-gray-500"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Skapa ny nivå ({levels.length}/10)
        </button>
        <button
          onClick={saveQuiz}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded ml-auto"
        >
          Spara quiz
        </button>
        <button
          onClick={cancelQuiz}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
        >
          Avbryt
        </button>
      </div>

      {/* nivåer */}
      <div className="space-y-4">
        {levels.map((level, index) => (
          <div
            key={level.id}
            className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl overflow-hidden"
          >
            {/* header */}
            <div className="flex justify-between items-center px-4 py-3">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={level.isOpen}
                onClick={() => toggleLevel(level.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleLevel(level.id);
                  }
                }}
                className="flex-1 cursor-pointer flex justify-between items-center select-none"
              >
                <span className="font-semibold">Nivå {index + 1}</span>
                <span className="text-lg">{level.isOpen ? "−" : "+"}</span>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLevel(level.id);
                  }}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Ta bort nivå
                </button>
              </div>
            </div>

            {/* innehåll */}
            {level.isOpen && (
              <div className="p-4 space-y-4">
                <textarea
                  value={level.text}
                  onChange={(e) =>
                    setLevels((p) =>
                      p.map((l) =>
                        l.id === level.id ? { ...l, text: e.target.value } : l
                      )
                    )
                  }
                  placeholder="Fyll i din text här"
                  className="w-full h-24 px-3 py-2 rounded bg-gray-200 text-black"
                />

                {level.questions.map((q, qi) => (
                  <div key={qi} className="space-y-2 bg-black/20 p-3 rounded">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-white/60">
                        Fråga {qi + 1}:
                      </span>
                      <input
                        type="text"
                        value={q.q}
                        onChange={(e) =>
                          setLevels((p) =>
                            p.map((l) =>
                              l.id === level.id
                                ? {
                                    ...l,
                                    questions: l.questions.map((qq, idx) =>
                                      idx === qi
                                        ? { ...qq, q: e.target.value }
                                        : qq
                                    ),
                                  }
                                : l
                            )
                          )
                        }
                        placeholder="Fyll i fråga"
                        className="flex-1 px-3 py-2 rounded bg-gray-200 text-black"
                      />
                      <button
                        onClick={() => removeQuestion(level.id, qi)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                      >
                        Ta bort
                      </button>
                    </div>

                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 pl-4">
                        <input
                          type="radio"
                          name={`q-${level.id}-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() =>
                            setLevels((p) =>
                              p.map((l) =>
                                l.id === level.id
                                  ? {
                                      ...l,
                                      questions: l.questions.map((qq, idx) =>
                                        idx === qi
                                          ? { ...qq, correctIndex: oi }
                                          : qq
                                      ),
                                    }
                                  : l
                              )
                            )
                          }
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            setLevels((p) =>
                              p.map((l) =>
                                l.id === level.id
                                  ? {
                                      ...l,
                                      questions: l.questions.map((qq, idx) =>
                                        idx === qi
                                          ? {
                                              ...qq,
                                              options: qq.options.map(
                                                (o, oidx) =>
                                                  oidx === oi
                                                    ? e.target.value
                                                    : o
                                              ),
                                            }
                                          : qq
                                      ),
                                    }
                                  : l
                              )
                            )
                          }
                          placeholder={`Svarsalternativ ${oi + 1}`}
                          className="flex-1 px-2 py-1 rounded bg-gray-200 text-black"
                        />
                        <button
                          onClick={() => removeOption(level.id, qi, oi)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                        >
                          Ta bort
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        setLevels((p) =>
                          p.map((l) =>
                            l.id === level.id
                              ? {
                                  ...l,
                                  questions: l.questions.map((qq, idx) =>
                                    idx === qi
                                      ? { ...qq, options: [...qq.options, ""] }
                                      : qq
                                  ),
                                }
                              : l
                          )
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm mt-2"
                    >
                      Lägg till alternativ
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <button
                    onClick={() => addQuestion(level.id)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Lägg till fråga
                  </button>
                </div>

                <p className="text-sm text-white/50">
                  Skapad: {new Date(level.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* sparad info */}
      {createdAt && (
        <p className="mt-6 text-sm text-white/70">
          Quizet sparades: {new Date(createdAt).toLocaleString()}
        </p>
      )}

      {/* Modal */}
      {confirm.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1F36] p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
            <p className="mb-6">{confirm.message}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  confirm.onConfirm();
                  closeConfirm();
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Ja
              </button>
              <button
                onClick={closeConfirm}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Nej
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
