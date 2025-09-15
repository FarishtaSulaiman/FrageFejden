import { http } from "../../lib/http";

export type DailyAnswerPayload = {
  answer: string;
  questionId?: number | string;
  date?: string;
};

export const DailyApi = {
  async getDailyQuiz(): Promise<any> {
    const res = await http.get("/daily"); // GET /api/daily
    return res.data;
  },

  async submitAnswer(payload: DailyAnswerPayload): Promise<any> {
    const res = await http.post("/daily/answer", payload); // POST /api/daily/answer
    return res.data;
  },

  // API för att hämta daily streak
  async getStats(): Promise<any> {
    const res = await http.get("/daily/stats");
    return res.data;
  },
};
