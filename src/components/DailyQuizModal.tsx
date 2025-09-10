import React, { useEffect, useState } from "react";
import { DailyApi } from "../Api";

type DailyQuestion = {
  date?: string;
  questionId?: number | string;
  category?: string;
  question?: string;
  alternativ?: string[];
  answered?: boolean;
};

export function DailyQuizModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(false); // medan vi hämtar frågan (GET).
  const [submitting, setSubmitting] = useState(false); // medan vi skickar svaret (POST).
  const [error, setError] = useState<string | null>(null); // felmeddelande om GET/POST fallerar

  // Det valda alternativet
  const [selected, setSelected] = useState<string | null>(null);

  // Meddelande från servern efter POST (t.ex. “Rätt svar!”)
  const [serverMsg, setServerMsg] = useState<string | null>(null);

  // Hämta frågan när modalen öppnas
  useEffect(() => {
    fetchQuestion();
  }, []);

  // Hämtar dagens fråga (GET /api/daily)
  async function fetchQuestion() {
    setLoading(true);
    setError(null);
    setServerMsg(null);
    setSelected(null);

    try {
      const res = await DailyApi.getDailyQuiz();
      const normalized = normalize(res);
      setQ(normalized);
      // Om redan besvarad: lås val/knapp
      if (normalized.answered) {
        setServerMsg("Du har redan svarat idag.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Kunde inte hämta dagens fråga.");
    } finally {
      setLoading(false);
    }
  }

  // Skicka svaret (POST /api/daily/answer)
  async function submit() {
    if (!q || !selected) return;
    setSubmitting(true);
    setError(null);
    setServerMsg(null);

    try {
      const res = await DailyApi.submitAnswer({
        answer: selected,
        questionId: q.questionId,
        date: q.date,
      });
      // Visa serverns svar
      setServerMsg(res?.message ?? "Svar skickat.");

      // Lås UI eftersom backend tillåter 1 svar/dag
      setQ({ ...q, answered: true });
    } catch (e: any) {
      // Backend kan svara 400 med { message: "Du har redan svarat idag." }
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Kunde inte skicka svaret.";
      setServerMsg(msg);
      // Lås UI om den säger att det redan är svarat
      if (
        typeof msg === "string" &&
        msg.toLowerCase().includes("redan svarat")
      ) {
        setQ((prev) => (prev ? { ...prev, answered: true } : prev));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // --- Hjälpare ---

  // Liten fix för mojibake (”Vad ï¿½r …”). Ofarlig om text redan är korrekt.
  function fixEncoding(s?: string) {
    if (!s) return s;
    try {
      // @ts-ignore legacy workaround
      return decodeURIComponent(escape(s));
    } catch {
      return s;
    }
  }

  // Mappa API-svaret till enkla fält som UI:t använder
  function normalize(raw: any): DailyQuestion {
    if (!raw || typeof raw !== "object") return {};
    return {
      date: raw.date,
      questionId: raw.questionId ?? raw.id,
      category: fixEncoding(raw.category),
      question: fixEncoding(raw.question ?? raw.text),
      alternativ: (raw.alternativ ??
        raw.options ??
        raw.choices ??
        []) as string[],
      answered: !!raw.answered,
    };
  }

  // --- Render ---

  const disabled = submitting || q?.answered === true;

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
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm hover:bg-black/5"
            aria-label="Stäng"
          >
            ✕
          </button>
        </div>

        {/* Fel / Laddar */}
        {error && (
          <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && <div className="mb-3 text-gray-600">Hämtar…</div>}

        {/* Frågevy */}
        {!loading && q && (
          <>
            {/* Meta */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {q.category && (
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  {q.category}
                </span>
              )}
              {q.date && <span>• {q.date}</span>}
              {q.answered && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                  Redan besvarad
                </span>
              )}
            </div>

            {/* Frågetext */}
            <div className="text-lg font-semibold">
              {q.question || "— Ingen frågetext —"}
            </div>

            {/* Alternativ (radio) */}
            {Array.isArray(q.alternativ) && q.alternativ.length > 0 && (
              <div className="mt-4 space-y-2">
                {q.alternativ.map((opt, i) => {
                  const value = fixEncoding(opt) || String(opt);
                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        disabled
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:bg-black/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="daily-option"
                        value={value}
                        checked={selected === value}
                        onChange={() => setSelected(value)}
                        disabled={disabled}
                      />
                      <span>{value}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Serverns svar/feedback */}
            {serverMsg && (
              <div className="mt-4 rounded bg-black/5 p-3 text-sm">
                {serverMsg}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-5 py-2 text-sm hover:bg-black/10"
                disabled={submitting}
              >
                Stäng
              </button>
              <button
                onClick={submit}
                disabled={disabled || !selected}
                className="rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? "Skickar…" : "Skicka svar"}
              </button>
            </div>
          </>
        )}

        {/* Ingen data */}
        {!loading && !error && !q && (
          <div className="text-sm text-gray-600">Ingen data att visa.</div>
        )}
      </div>
    </div>
  );
}
