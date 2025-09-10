import React, { useEffect, useState } from "react";
import { DailyApi } from "../Api";

type DailyQuizQuestion = {
  date?: string;
  questionId?: number | string;
  category?: string;
  question?: string;
  options?: string[];
  answered?: boolean;
};

// Försök att reparera å/ä/ö-problem i inkommande text
function fixEncoding(input?: string) {
  if (!input) return input;
  try {
    return decodeURIComponent(escape(input));
  } catch {
    return input;
  }
}

// Tar rådata från Daily API och normaliserar till vårt gränssnitt
function normalizeDailyApiResponse(raw: unknown): DailyQuizQuestion | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const rawOptions =
    (obj["options"] as unknown) ?? obj["alternativ"] ?? obj["choices"] ?? [];

  const optionsArray: string[] = Array.isArray(rawOptions)
    ? rawOptions.map((v) => fixEncoding(String(v)) ?? String(v))
    : [];

  return {
    date: obj["date"] as string | undefined,
    questionId: (obj["questionId"] ?? obj["id"]) as number | string | undefined,
    category: fixEncoding(obj["category"] as string | undefined),
    question: fixEncoding(
      (obj["question"] as string | undefined) ??
        (obj["text"] as string | undefined)
    ),
    options: optionsArray,
    answered: Boolean(obj["answered"]),
  };
}

export function DailyQuizModal({
  onClose,
  onAnswered,
}: {
  onClose: () => void;
  onAnswered?: () => void;
}) {
  const [quizQuestion, setQuizQuestion] = useState<DailyQuizQuestion | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false); // GET /daily
  const [isSubmitting, setIsSubmitting] = useState(false); // POST /daily/answer
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyQuestion();
  }, []);

  // Hämtar dagens fråga från backend
  async function fetchDailyQuestion() {
    setIsLoading(true);
    setErrorMessage(null);
    setServerMessage(null);
    setSelectedOption(null);

    try {
      const res = await DailyApi.getDailyQuiz(); // GET /api/daily
      const normalized = normalizeDailyApiResponse(res);

      setQuizQuestion(normalized);

      if (normalized?.answered) {
        setServerMessage("Du har redan svarat idag.");
        onAnswered?.();
      }
    } catch (error: any) {
      setErrorMessage(error?.message ?? "Kunde inte hämta dagens fråga.");
    } finally {
      setIsLoading(false);
    }
  }

  // Skickar in valt svar till backend 
  async function submitAnswer() {
    if (!quizQuestion || !selectedOption) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setServerMessage(null);

    try {
      const res = await DailyApi.submitAnswer({
        answer: selectedOption,
        questionId: quizQuestion.questionId,
        date: quizQuestion.date,
      });

      setServerMessage(res?.message ?? "Svar skickat.");
      setQuizQuestion({ ...quizQuestion, answered: true }); // lås efter svar
      onAnswered?.(); // uppdatera ev. statistik
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Kunde inte skicka svaret.";
      setServerMessage(msg);

      // Om backend säger att användaren redan svarat, markera som besvarad lokalt
      if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("redan svarat")
      ) {
        setQuizQuestion((prev) => (prev ? { ...prev, answered: true } : prev));
        onAnswered?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDisabled = isSubmitting || quizQuestion?.answered === true;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl text-[#1b1b1b]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">Dagens Quiz</h3>
          <button
            onClick={() => {
              onAnswered?.(); // om användaren stänger efter svar
              onClose();
            }}
            className="rounded-md px-3 py-1 text-sm hover:bg-black/5"
            aria-label="Stäng"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Fel / Laddning */}
        {errorMessage && (
          <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {isLoading && <div className="mb-3 text-gray-600">Hämtar…</div>}

        {/* Frågevy */}
        {!isLoading && quizQuestion && (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {quizQuestion.category && (
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  {quizQuestion.category}
                </span>
              )}
              {quizQuestion.date && <span>• {quizQuestion.date}</span>}
              {quizQuestion.answered && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                  Redan besvarad
                </span>
              )}
            </div>

            {/* Frågetext */}
            <div className="text-lg font-semibold">
              {quizQuestion.question || "— Ingen frågetext —"}
            </div>

            {/* Alternativ */}
            {Array.isArray(quizQuestion.options) &&
              quizQuestion.options.length > 0 && (
                <div className="mt-4 space-y-2">
                  {quizQuestion.options.map((option, index) => {
                    const inputId = `daily-option-${index}`;
                    return (
                      <label
                        key={inputId}
                        htmlFor={inputId}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          isDisabled
                            ? "opacity-60 cursor-not-allowed"
                            : "cursor-pointer hover:bg-black/5"
                        }`}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name="daily-option"
                          value={option}
                          checked={selectedOption === option}
                          onChange={() => setSelectedOption(option)}
                          disabled={isDisabled}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

            {/* Serverns feedback */}
            {serverMessage && (
              <div className="mt-4 rounded bg-black/5 p-3 text-sm">
                {serverMessage}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  onAnswered?.(); // uppdatera stats även vid stäng
                  onClose();
                }}
                className="rounded-lg px-5 py-2 text-sm hover:bg-black/10"
                disabled={isSubmitting}
                type="button"
              >
                Stäng
              </button>
              <button
                onClick={submitAnswer}
                disabled={isDisabled || !selectedOption}
                className="rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                type="button"
              >
                {isSubmitting ? "Skickar…" : "Skicka svar"}
              </button>
            </div>
          </>
        )}

        {/* Ingen data */}
        {!isLoading && !errorMessage && !quizQuestion && (
          <div className="text-sm text-gray-600">Ingen data att visa.</div>
        )}
      </div>
    </div>
  );
}
