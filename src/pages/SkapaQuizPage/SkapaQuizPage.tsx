import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SubjectsApi } from "../../Api";

//  ämnen
type UINormalizedSubject = { id: string; name: string };

// fråga
type Question = { q: string; a: string };

// level
type Level = {
  id: number;
  text: string; // Text för level
  isOpen: boolean; // Om level är öppen
  questions: Question[]; // Lista med frågor
  createdAt: string; // Tidpunkt när level skapades
};

export default function CreateQuizPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId");

  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    subjectId || ""
  );
  const [levels, setLevels] = useState<Level[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null); // När quiz sparades

  // Hämta ämnen för klassen
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

        // Välj subject
        if (subjectId) setSelectedSubject(subjectId);
        else if (normalized.length > 0) setSelectedSubject(normalized[0].id);
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
        setSubjects([]);
      }
    })();
  }, [classId, subjectId]);

  // Lägg till ny level
  function addLevel() {
    if (levels.length >= 10) return;
    const newLevel: Level = {
      id: levels.length + 1,
      text: "",
      isOpen: true,
      questions: [],
      createdAt: new Date().toISOString(), // Spara tid
    };
    setLevels([...levels, newLevel]);
  }

  // Lägg till fråga i level
  function addQuestion(levelId: number) {
    setLevels(
      levels.map((l) =>
        l.id === levelId
          ? { ...l, questions: [...l.questions, { q: "", a: "" }] }
          : l
      )
    );
  }

  // Ta bort fråga från level
  function removeQuestion(levelId: number, index: number) {
    setLevels(
      levels.map((l) =>
        l.id === levelId
          ? { ...l, questions: l.questions.filter((_, i) => i !== index) }
          : l
      )
    );
  }

  // Växla öppen/stängd state för level
  function toggleLevel(levelId: number) {
    setLevels(
      levels.map((l) => (l.id === levelId ? { ...l, isOpen: !l.isOpen } : l))
    );
  }

  // Spara quiz
  function saveQuiz() {
    const quizData = {
      subjectId: selectedSubject,
      levels,
      createdAt: new Date().toISOString(),
    };
    setCreatedAt(quizData.createdAt);
    console.log("Quiz sparat:", quizData);
  }

  const currentSubjectName =
    subjects.find((s) => s.id === selectedSubject)?.name || "—";

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
      {/* Ämne */}
      <p className="text-white/80 mb-6">
        Ämne: <span className="font-semibold">{currentSubjectName}</span>
      </p>

      {/* Välj ämne */}
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

      {/* Knappar */}
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
          Skapa ny level ({levels.length}/10)
        </button>
        <button
          onClick={saveQuiz}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded ml-auto"
        >
          Spara quiz
        </button>
      </div>

      {/* Lista med levels */}
      <div className="space-y-4">
        {levels.map((level) => (
          <div
            key={level.id}
            className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl overflow-hidden"
          >
            {/* Level header */}
            <button
              onClick={() => toggleLevel(level.id)}
              className="w-full text-left px-4 py-3 font-semibold hover:bg-purple-800/70 flex justify-between items-center"
            >
              <span>Level {level.id}</span>
              <span>{level.isOpen ? "−" : "+"}</span>
            </button>

            {/* Level content */}
            {level.isOpen && (
              <div className="p-4 space-y-4">
                {/* Level text */}
                <textarea
                  value={level.text}
                  onChange={(e) =>
                    setLevels(
                      levels.map((l) =>
                        l.id === level.id ? { ...l, text: e.target.value } : l
                      )
                    )
                  }
                  placeholder="Fyll i din text här"
                  className="w-full h-24 px-3 py-2 rounded bg-gray-200 text-black"
                />

                {/* Frågor */}
                {level.questions.map((q, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={q.q}
                      onChange={(e) =>
                        setLevels(
                          levels.map((l) =>
                            l.id === level.id
                              ? {
                                  ...l,
                                  questions: l.questions.map((qq, idx) =>
                                    idx === i
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
                    <input
                      type="text"
                      value={q.a}
                      onChange={(e) =>
                        setLevels(
                          levels.map((l) =>
                            l.id === level.id
                              ? {
                                  ...l,
                                  questions: l.questions.map((qq, idx) =>
                                    idx === i
                                      ? { ...qq, a: e.target.value }
                                      : qq
                                  ),
                                }
                              : l
                          )
                        )
                      }
                      placeholder="Fyll i svar"
                      className="flex-1 px-3 py-2 rounded bg-gray-200 text-black"
                    />
                    <button
                      onClick={() => removeQuestion(level.id, i)}
                      className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                    >
                      Ta bort
                    </button>
                  </div>
                ))}

                {/* Lägg till frågor */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addQuestion(level.id)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Lägg till fråga
                  </button>
                </div>

                {/* Visar när level skapades */}
                <p className="text-sm text-white/50">
                  Skapad: {new Date(level.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* När quiz sparades */}
      {createdAt && (
        <p className="mt-6 text-sm text-white/70">
          Quizet skapades: {new Date(createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
