import React, { useState } from "react";

//styr om den är öppen och hanterar stängning
interface SkapaQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

//ämnen
type Subject = "Geografi" | "Matte" | "Svenska" | "Historia";
//lista med ämnen + emojis --> byta till iconer?
const subjects: { name: Subject; icon: string }[] = [
  { name: "Geografi", icon: "🌍" },
  { name: "Matte", icon: "➗" },
  { name: "Svenska", icon: "📖" },
  { name: "Historia", icon: "📚" },
];

const SkapaQuizModal: React.FC<SkapaQuizModalProps> = ({ isOpen, onClose }) => {
  const [quizName, setQuizName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [text, setText] = useState("");
  const [numQuestions, setNumQuestions] = useState(8);
  const [level, setLevel] = useState(3);

  if (!isOpen) return null;
  //Funktion som hanterar "Generera frågor", behöver bytas ut när vi lägger till AI?
  const handleGenerate = () => {
    console.log("Genererar quiz:", {
      quizName,
      selectedSubject,
      text,
      numQuestions,
      level,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0b0d2a] rounded-lg shadow-2xl w-full max-w-lg mx-4 relative text-white">
        {/* Stäng-knapp */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-white text-xl hover:text-gray-300"
          type="button"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center py-6">
          <h2 className="text-3xl font-extrabold text-yellow-400">
            SKAPA QUIZ
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 space-y-6">
          {/* Quiz-namn */}
          <div>
            <label className="block text-sm mb-1">Döp ditt quiz</label>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="Skriv titel här..."
              className="w-full px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Ämne */}
          <div>
            <label className="block text-sm mb-2">Ämne</label>
            <div className="flex gap-3">
              {subjects.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedSubject(s.name)}
                  type="button"
                  className={`flex flex-col items-center px-4 py-3 rounded-lg w-20 ${
                    selectedSubject === s.name
                      ? "bg-green-600"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-sm mt-1">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm mb-1">Fyll i din text här</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Skriv din text..."
              className="w-full h-28 px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Antal frågor */}
          <div className="flex items-center justify-between">
            <span>Antal frågor</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNumQuestions((n) => Math.max(1, n - 1))}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                -
              </button>
              <span>{numQuestions}</span>
              <button
                onClick={() => setNumQuestions((n) => n + 1)}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Nivå */}
          <div className="flex items-center justify-between">
            <span>Välj nivå</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLevel((l) => Math.max(1, l - 1))}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                -
              </button>
              <span>{level}</span>
              <button
                onClick={() => setLevel((l) => l + 1)}
                className="px-3 py-1 bg-gray-700 rounded"
              >
                +
              </button>
            </div>
          </div>

          {/* Generera-knapp */}
          <button
            onClick={handleGenerate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md"
          >
            Generera frågor
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkapaQuizModal;
