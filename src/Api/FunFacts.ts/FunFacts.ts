// Random Useless Facts API
// https://uselessfacts.jsph.pl/random.json?language=en

export type FunFact = {
  id: string;
  text: string;
  source?: string;
  source_url?: string;
  language?: string;
  permalink?: string;
};

export async function getRandomFunFact(): Promise<FunFact> {
  const res = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
  if (!res.ok) throw new Error(`FunFact API error: ${res.status}`);
  const data = (await res.json()) as FunFact;
  return data;
}