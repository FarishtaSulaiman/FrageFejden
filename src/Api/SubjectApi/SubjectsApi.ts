import { http } from "../../lib/http";

/* ===== DTO:er som matchar SubjectsController ===== */

export type SubjectDto = {
  id: string;
  name: string;
  description?: string | null;
  classId?: string | null;
  createdById: string;
  createdAt: string;
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

export const subjectsApi = {
  // Hämtar alla ämnen i en viss klass
  async getForClass(classId: string): Promise<SubjectDto[]> {
    const res = await http.get<SubjectDto[]>(`/subjects/classes/${classId}`);
    return res.data;
  },

  // Hämtar ett specifikt ämne i en klass
  async getInClass(classId: string, subjectId: string): Promise<SubjectDto> {
    const res = await http.get<SubjectDto>(`/subjects/classes/${classId}/${subjectId}`);
    return res.data;
  },

  // Skapar ett nytt ämne i en klass
  async createForClass(classId: string, body: SubjectCreateDto): Promise<SubjectDto> {
    const res = await http.post<SubjectDto>(`/subjects/classes/${classId}`, body);
    return res.data;
  },

  // Uppdaterar ett ämne i en klass
  async updateInClass(classId: string, subjectId: string, body: SubjectUpdateDto): Promise<SubjectDto> {
    const res = await http.put<SubjectDto>(`/subjects/classes/${classId}/${subjectId}`, body);
    return res.data;
  },

  // Tar bort ett ämne från en klass
  async deleteInClass(classId: string, subjectId: string): Promise<void> {
    await http.delete(`/subjects/classes/${classId}/${subjectId}`);
  },
};
