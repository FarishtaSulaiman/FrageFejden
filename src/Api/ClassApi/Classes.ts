// src/Api/ClassApi/Classes.ts
import { http } from "../../lib/http";


// Funktion för ranking: 1,1,3,4... (lika poäng => samma plats)
function addCompetitionRank(rows: any[]) {
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  let lastScore: number | null = null;
  let currentRank = 0;

  return sorted.map((row, idx) => {
    if (lastScore === null || row.score !== lastScore) {
      currentRank = idx + 1;  // ny poängnivå => ny rank
      lastScore = row.score;
    }
    return { ...row, rank: currentRank };
  });
}

export const Classes = {
  // Hämtar alla klasser!! OBS ALLA INTE BARA ANVÄNDARENS
  async MyClasses(page: number = 1, pageSize: number = 50): Promise<any[]> {
    const res = await http.get(`/Class`, {
      params: { page, pageSize },
    });
    return res.data.items;
  },

  // Skapar en ny klass
  async CreateClass(
    name: string,
    gradeLabel: string,
    makeMeTeacher: boolean,
    description?: string
  ): Promise<any> {
    const res = await http.post("/Class", {
      name,
      gradeLabel,
      description: description?.trim() ?? "",
      makeMeTeacher,
    });
    return res.data;
  },

  // Hämtar en specifik klass med ID
  async GetClassById(classId: string): Promise<any> {
    const res = await http.get(`/Class/${classId}`);
    return res.data;
  },

  // Uppdaterar en klass
  async UpdateClass(
    classId: string,
    name: string,
    gradeLabel: string,
    description?: string
  ): Promise<any> {
    const res = await http.put(`/Class/${classId}`, {
      name,
      gradeLabel,
      description: description?.trim() ?? "",
    });
    return res.data;
  },

  // Tar bort en klass
  async DeleteClass(classId: string): Promise<void> {
    await http.delete(`/Class/${classId}`);
  },

  // Hämta inloggad användares klass(er)
  async GetUsersClasses(): Promise<any> {
    const res = await http.get("/Class/me");
    return res.data;
  },

  // Hämta en användares poäng
  async GetLoggedInUserScore(userId: string): Promise<any> {
    const res = await http.get(`/Class/user/${userId}/points`);
    return res.data;
  },

  // Hämta scoreboard för en klass
  async GetClassScores(classId: string, userId: string): Promise<any[]> {
    const res = await http.get(`/Class/class/${classId}/scores`, {
      params: { userId },
    });
    return res.data;
  },

  // Leadrboard och inloggad användares rank (återanvändbar)
  async GetClassLeaderboard(
    classId: string,
    userId: string
  ): Promise<{
    leaderboard: Array<any & { rank: number }>;
    myRank: number | null;
  }> {
    const scores = await Classes.GetClassScores(classId, userId);
    const leaderboard = addCompetitionRank(scores);
    const me = leaderboard.find((r) => r.userId === userId);
    return { leaderboard, myRank: me?.rank ?? null };
  },

  // Hämta inloggade användarens rank i den specifika klassen
  async GetUserRankInClass(
    classId: string,
    userId: string
  ): Promise<number | null> {
    // 1) Hämta hela klassens scoreboard (alla elevers poäng)
    const scores = await Classes.GetClassScores(classId, userId);

    // 2) Räkna ut rank på listan
    const ranked = addCompetitionRank(scores);

    // 3) Hitta min rad och returnera min plats
    const me = ranked.find((r) => r.userId === userId);
    return me?.rank ?? null;
  },
};

