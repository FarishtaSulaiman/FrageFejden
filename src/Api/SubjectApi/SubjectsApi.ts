import { http } from "../../lib/http";

//Typedefinitioner

//Subject typmodell
export type Subject = {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  topicsCount: number;
  levelsCount: number;
  quizzesCount: number;
  questionsCount: number;
};

//Subject sammanställning (används vid hämtning av alla ämnen)
export type SubjectSummary = {
  id: string;
  name: string;
  description?: string;
  topicsCount: number;
  levelsCount: number;
  quizzesCount: number;
  questionsCount: number;
  createdAt: string;
};

  //Skapa ämne
export type SubjectCreateDto = {
    name: string;
    description?: string;
};

export type SubjectUpdateDto = {
    name: string;
    description?: string;
};

//Subject + TopicSummary + LevelSummary (används vid hämtning av ämne baserat på id)
export type SubjectDetails = Subject & {
  topics: TopicSummary[];
  levels: LevelSummary[];
};

export type TopicSummary = {
  id: string;
  name: string;
  description?: string;
  questionsCount: number;
};

export type LevelSummary = {
  id:string;
  name: string;
  description?: string;
  quizzesCount: number;
  level: {
    id: string;
    levelNumber: number;
    title?: string;
    minXpUnlock: number;
    quizzesCount: number;
}
};

//API metoder

//Hämtar alla ämnen
export const SubjectsApi = {

async getAllSubjects(): Promise<SubjectSummary[]> {
  const res = await http.get<SubjectSummary[]>("/subjects");
  return res.data;
},

//Skapa ett nytt ämne
async createSubject(name: string, description: string): Promise<SubjectCreateDto> {
  const res = await http.post<SubjectCreateDto>("/subjects", { name, description });
  return res.data;
},

//Hämtar ämne baserat på id
async getSubjectById(id: string): Promise<Subject> {
  const res = await http.get<Subject>(`/subjects/${id}`);
  return res.data;
},

//Uppdaterar ämne baserat på id
async updateSubject(id: string, name: string, description: string): Promise<SubjectUpdateDto> {
  const res = await http.put<SubjectUpdateDto>(`/subjects/${id}`, { name, description });
  return res.data;
},

//Tar bort ämne baserat på id
async deleteSubject(id: string): Promise<void> {
  await http.delete(`/subjects/${id}`);
},

//Hämtar alla detaljer för ett ämne inklusive dess topics och levels
async getSubjectDetails(id: string): Promise<SubjectDetails> {
  const res = await http.get<SubjectDetails>(`/subjects/${id}/details`);
  return res.data;
},

//Hämtar alla ämnen skapade av den inloggade användaren
async getMySubjects(): Promise<SubjectSummary[]> {
    const res = await http.get<SubjectSummary[]>("/subjects/my");
    return res.data;
}

};