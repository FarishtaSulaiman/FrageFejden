import { http } from "../../lib/http";
import type { TopicSummaryDto } from "../TopicsApi/topics";

/* ===== DTO:er som matchar SubjectsController ===== */

export type SubjectDto = {
  id: string;
  name: string;
  description?: string | null;
  classId?: string | null;
  createdById: string;
  createdAt: string;
  iconUrl: string;
  topicCount: number;
  quizCount: number;
  questionCount: number;
};


export type SubjectCreateDto = {
  name: string;
  description?: string;
};

export type SubjectUpdateDto = {
  name?: string;
  description?: string | null;
};



/* =========================
 * Subjects API (frontend)
 * ========================= */

export const SubjectsApi = {
  // Hämtar alla ämnen i en viss klass
  async getForClass(classId: string): Promise<SubjectDto[]> {
    const res = await http.get<SubjectDto[]>(`/subjects/classes/${classId}`);
    return res.data;
  },

  // Hämtar ett specifikt ämne i en klass
  async getInClass(classId: string, subjectId: string): Promise<SubjectDto> {
    const res = await http.get<SubjectDto>(
      `/subjects/classes/${classId}/${subjectId}`
    );
    return res.data;
  },

  // Skapar ett nytt ämne i en klass
  async createForClass(
    classId: string,
    body: SubjectCreateDto
  ): Promise<SubjectDto> {
    const res = await http.post<SubjectDto>(
      `/subjects/classes/${classId}`,
      body
    );
    return res.data;
  },

  // Uppdaterar ett ämne i en klass
  async updateInClass(
    classId: string,
    subjectId: string,
    body: SubjectUpdateDto
  ): Promise<SubjectDto> {
    const res = await http.put<SubjectDto>(
      `/subjects/classes/${classId}/${subjectId}`,
      body
    );
    return res.data;
  },

  // Tar bort ett ämne från en klass
  async deleteInClass(classId: string, subjectId: string): Promise<void> {
    await http.delete(`/subjects/classes/${classId}/${subjectId}`);
  },

  // GET /api/subjects/mine – ämnen skapade av inloggad lärare/admin
  async listMine(): Promise<SubjectDto[]> {
    const res = await http.get<SubjectDto[]>("/subjects/mine");
    const data = res.data as any;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  // GET /api/subjects/{subjectId}/topics/mine – topics i ett ämne, skapade av mig/lärare
  async listMyTopics(subjectId: string): Promise<TopicSummaryDto[]> {
    if (!subjectId) return [];
    const res = await http.get<TopicSummaryDto[]>(
      `/subjects/${subjectId}/topics/mine`
    );
    const data = res.data as any;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  // Helper om man bara vill ha id + namn
  async listMyTopicNames(
    subjectId: string
  ): Promise<Array<{ topicId: string; name: string }>> {
    const items = await this.listMyTopics(subjectId);
    return items.map((t) => ({ topicId: t.topicId, name: t.name }));
  },
};
