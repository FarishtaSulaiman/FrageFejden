// src/Api/FunFact.ts
import { http } from "../../lib/http";

// Svaren kan variera (text/fact/value). Normalisera till { text, source?, permalink? }.
export type FunFact = {
  text: string;
  source?: string;
  permalink?: string;
};

type RawFunFact =
  | string
  | {
      id?: string;
      text?: string;
      fact?: string;
      value?: string;
      source?: string;
      source_url?: string;
      permalink?: string;
      [k: string]: any;
    }
  | { data?: any };

export async function getFunFact(): Promise<FunFact> {
  const res = await http.get<RawFunFact>("/FunFact");
  const raw = (res.data as any)?.data ?? res.data;

  if (typeof raw === "string") return { text: raw };

  const text = raw?.text ?? raw?.fact ?? raw?.value ?? "";
  const source = raw?.source ?? raw?.source_url;
  const permalink = raw?.permalink ?? raw?.source_url;

  if (!text) throw new Error("Tomt svar från /FunFact");
  return { text: String(text), source, permalink };
}
