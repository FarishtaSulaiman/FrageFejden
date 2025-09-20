import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SubjectsApi } from "../../Api";
import { topicApi, TopicSummaryDto } from "../../Api/TopicsApi/topics";
import { TeacherClasses } from "../../Api/index";

// ämnen
type UINormalizedSubject = { id: string; name: string };

// fråga
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
  const [searchParams] = useSearchParams();
  const queryClassId = searchParams.get("classId");
  const querySubjectId = searchParams.get("subjectId") || "";
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState<TopicSummaryDto[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    message: "",
    onConfirm: () => {},
  });
  const [loading, setLoading] = useState(true);

  //hämtar lärarens klass
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const myClasses = await TeacherClasses.GetCreatedClasses();
        if (!Array.isArray(myClasses) || myClasses.length === 0) return;
        const pickedClass =
          myClasses.find((c: any) => c.id === queryClassId) || myClasses[0];
        if (!alive) return;
        setClassInfo({ id: pickedClass.id, name: pickedClass.name });
      } catch (err) {
        console.error("Kunde inte hämta lärarens klasser:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [queryClassId]);

  // hämtar ämnen
  useEffect(() => {
    if (!classInfo?.id) return;
    (async () => {
      try {
        const list = await SubjectsApi.getForClass(classInfo.id);
        const normalized: UINormalizedSubject[] = (
          Array.isArray(list) ? list : []
        ).map((s: any) => ({
          id: s.id ?? s.subjectId,
          name: s.name ?? "Ämne",
        }));
        normalized.sort((a, b) => a.name.localeCompare(b.name));
        setSubjects(normalized);
        const firstSubjectId = querySubjectId || normalized[0]?.id || "";
        setSelectedSubject(firstSubjectId);
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [classInfo, querySubjectId]);

  // hämtarr topics
  useEffect(() => {
    if (!selectedSubject) return;
    (async () => {
      try {
        const list = await topicApi.listBySubject(selectedSubject);
        list.sort((a, b) => a.sortOrder - b.sortOrder);
        setTopics(list);
        if (list.length > 0) setSelectedTopic(list[0].topicId);
      } catch (err) {
        console.error("Kunde inte hämta topics:", err);
        setTopics([]);
      }
    })();
  }, [selectedSubject]);

  // modal-hjälpare
  const openConfirm = (message: string, onConfirm: () => void) =>
    setConfirm({ open: true, message, onConfirm });
  const closeConfirm = () => setConfirm({ ...confirm, open: false });

  //nivåhantering
  const addLevel = () => {
    if (levels.length >= 10) return;
    const newLevel: Level = {
      id: Date.now(),
      text: "",
      isOpen: true,
      questions: [],
      createdAt: new Date().toISOString(),
    };
    setLevels((prev) => [...prev, newLevel]);
  };
  const toggleLevel = (levelId: number) =>
    setLevels((prev) =>
      prev.map((l) => (l.id === levelId ? { ...l, isOpen: !l.isOpen } : l))
    );
  const removeLevel = (levelId: number) =>
    openConfirm("Är du säker på att du vill ta bort den här nivån?", () =>
      setLevels((prev) => prev.filter((l) => l.id !== levelId))
    );

  //frågehantering
  const addQuestion = (levelId: number) => {
    setLevels((prev) =>
      prev.map((l) =>
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
  };
  const addOption = (levelId: number, qIndex: number) => {
    setLevels((prev) =>
      prev.map((l) =>
        l.id === levelId
          ? {
              ...l,
              questions: l.questions.map((q, idx) =>
                idx === qIndex ? { ...q, options: [...q.options, ""] } : q
              ),
            }
          : l
      )
    );
  };
  const removeQuestion = (levelId: number, qIndex: number) =>
    openConfirm("Är du säker på att du vill ta bort den här frågan?", () =>
      setLevels((prev) =>
        prev.map((l) =>
          l.id === levelId
            ? { ...l, questions: l.questions.filter((_, i) => i !== qIndex) }
            : l
        )
      )
    );
  const removeOption = (levelId: number, qIndex: number, optIndex: number) =>
    openConfirm("Är du säker på att du vill ta bort alternativet?", () =>
      setLevels((prev) =>
        prev.map((l) => {
          if (l.id !== levelId) return l;
          const questions = l.questions.map((q, i) => {
            if (i !== qIndex) return q;
            if (q.options.length <= 1) {
              alert("Minst ett alternativ måste finnas kvar.");
              return q;
            }
            let newCorrect = q.correctIndex;
            if (q.correctIndex === optIndex) {
              newCorrect = null;
            } else if (
              typeof q.correctIndex === "number" &&
              q.correctIndex > optIndex
            ) {
              newCorrect = q.correctIndex - 1;
            }
            return {
              ...q,
              options: q.options.filter((_, oi) => oi !== optIndex),
              correctIndex: newCorrect,
            };
          });
          return { ...l, questions };
        })
      )
    );

  // “spara” lokalt
  const handleSaveQuiz = () => {
    openConfirm("Är du säker på att du vill spara quizet?", () => {
      console.log({ quizTitle, quizDescription, selectedTopic, levels });
      navigate("/klassvy");
    });
  };
  const cancelQuiz = () =>
    openConfirm("Är du säker på att du vill avbryta? Inget sparas.", () =>
      navigate("/klassvy")
    );

  const currentSubjectName =
    subjects.find((s) => s.id === selectedSubject)?.name || "—";
  const currentClassName = classInfo?.name || "—";

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Skapa ett quiz {currentSubjectName} till klass {currentClassName}
      </h1>

      {loading && <p>Laddar...</p>}

      {!loading && (
        <>
          {/* topic */}
          <div className="mb-4">
            <label className="block mb-1 text-white">Välj topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-200 text-black"
            >
              {topics.map((t) => (
                <option key={t.topicId} value={t.topicId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

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
              onClick={handleSaveQuiz}
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
                <div className="flex justify-between items-center px-4 py-3">
                  <div
                    onClick={() => toggleLevel(level.id)}
                    className="flex-1 cursor-pointer flex justify-between items-center select-none"
                  >
                    <span className="font-semibold">Nivå {index + 1}</span>
                    <span className="text-lg">{level.isOpen ? "−" : "+"}</span>
                  </div>
                  <button
                    onClick={() => removeLevel(level.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Ta bort nivå
                  </button>
                </div>

                {level.isOpen && (
                  <div className="p-4 space-y-4">
                    <textarea
                      value={level.text}
                      onChange={(e) =>
                        setLevels((p) =>
                          p.map((l) =>
                            l.id === level.id
                              ? { ...l, text: e.target.value }
                              : l
                          )
                        )
                      }
                      placeholder="Fyll i din text här"
                      className="w-full h-24 px-3 py-2 rounded bg-gray-200 text-black"
                    />
                    {level.questions.map((q, qi) => (
                      <div
                        key={qi}
                        className="space-y-2 bg-black/20 p-3 rounded"
                      >
                        <div className="flex gap-2 items-center">
                          <input
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
                            placeholder={`Fråga ${qi + 1}`}
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
                          <div
                            key={oi}
                            className="flex items-center gap-2 pl-4"
                          >
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
                                          questions: l.questions.map(
                                            (qq, idx) =>
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
                                          questions: l.questions.map(
                                            (qq, idx) =>
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
                          onClick={() => addOption(level.id, qi)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm mt-2"
                        >
                          Lägg till alternativ
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addQuestion(level.id)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Lägg till fråga
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* modal */}
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
