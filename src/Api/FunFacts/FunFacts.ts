// Importerar vår "http"-klient (Axios-instans) som vet vilken server (baseURL) den ska prata med.
// Det är denna som skickar nätverksanrop till vårt backend-projekt.
import { http } from "../../lib/http";

// Typ/interface som beskriver hur en FunFact ska se ut i vår frontend.
export type FunFact = {
  text: string;
};

// Typ som beskriver de olika "råa" format vi kan få tillbaka från backend eller externa API:er.
type RawFunFact =
  | string
  | {
      text?: string;
      fact?: string;
      value?: string;
      [k: string]: any; // tillåter andra fält vi inte bryr oss om
    }
  | { data?: any };

// Huvudfunktionen som frontend använder för att hämta en fun fact från backend.
export async function getFunFact(): Promise<FunFact> {
  // Skickar GET-anrop till backend-endpointen /FunFact dvs http://localhost:5173/api/FunFact
  const res = await http.get<RawFunFact>("/FunFact");

  // Plocka ut datan (ibland ligger den direkt, ibland inuti "data").
  const raw = (res.data as any)?.data ?? res.data;

  // Om svaret är en ren sträng, returneras sträng direkt
  if (typeof raw === "string") return { text: raw };

  // Annars försöker vi plocka text från olika fält: text, fact eller value
  const text = raw?.text ?? raw?.fact ?? raw?.value ?? "";

  // Om inget textfält hittades kastas ett fel (så vi ser att API:t inte gav oss något användbart).
  if (!text) throw new Error("Tomt svar från /FunFact");

  // Returnera ett objekt med text (som sträng).
  return { text: String(text) };
}
