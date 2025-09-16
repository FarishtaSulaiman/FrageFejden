// src/Api/QuizApi/Quizzes.ts
import { http } from "../../lib/http";

// Typdefinitioner

// Hämtar alla quizzar med filter
export type Quiz = {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
};

export type QuizFilter = {
  SubjectId?: string;
  LevelId?: string;
  IsPublished?: boolean;
  SearchTerm?: string;
  PageNumber?: number;
  PageSize?: number;
};

export type QuizListRes = {
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  items: Quiz[];
};

// Skapa quiz
export type QuizCreateDto = {
  applicationUserId: string;
  title: string;
  subjectId: string;
  levelId: string;
  isPublished: boolean;
};

// Hämtar publicerade quizzar med filter
export type PublishedQuizFilter = {
  topicId?: string;   
  levelId?: string;   
};

// Uppdaterar quiz baserat på id
export type QuizUpdateDto = {
  id: string;
  title?: string;
  isPublished: boolean;
  createdAt: string;
  subjectId: string;
  levelId: string;
};

// Hämta frågor med svar baserat på quiz id
export type Question = {
  id: string;
  text: string;
  answers: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
};

// Uppdaterar ordningen i ett quiz
export type QuestionOrderUpdateDto = {
  questions: string[];
};

// API-Metoder
export const QuizzesApi = {
  // Hämtar alla quizzar med filter
  async getFiltered(filters: QuizFilter): Promise<QuizListRes> {
    const res = await http.get("/quizzes", {
      params: filters,
    });
    return res.data;
  },

  // Skapar ett nytt quiz
  async create(data: QuizCreateDto): Promise<Quiz> {
    const res = await http.post("/quizzes", data);
    return res.data;
  },

  // Hämtar publicerade quizzar med filter (topicId + levelId)
  async getPublished(filters: PublishedQuizFilter): Promise<Quiz[]> {
    const res = await http.get("/quizzes/published", {
      params: filters,
    });
    return res.data;
  },

  // Hämtar quiz baserat på id
  async getById(id: string): Promise<Quiz> {
    const res = await http.get(`/quizzes/${id}`);
    return res.data;
  },

  // Uppdaterar quiz baserat på id
  async update(id: string, data: QuizUpdateDto): Promise<Quiz> {
    const res = await http.put(`/quizzes/${id}`, data);
    return res.data;
  },

  // Tar bort quiz baserat på id
  async deleteById(id: string): Promise<void> {
    await http.delete(`/quizzes/${id}`);
  },

  // Kollar om quiz existerar baserat på id
  async exists(id: string): Promise<boolean> {
    try {
      await http.head(`/quizzes/${id}`);
      return true;
    } catch (error) {
      if ((error as any).response?.status === 404) return false;
      throw error;
    }
  },

  // Hämta quiz med frågor baserat på id
  async getQuestions(id: string, includeAnswers = false): Promise<Question[]> {
    const res = await http.get(`/quizzes/${id}/questions`, {
      params: { includeAnswers },
    });
    return res.data;
  },

  // Uppdaterar ordningen av frågor i ett quiz
  async updateQuestionOrder(
    quizId: string,
    data: QuestionOrderUpdateDto
  ): Promise<void> {
    await http.put(`/quizzes/${quizId}/questions`, data);
  },

  // Publicerar eller avpublicerar ett quiz
  async setPublishedStatus(
    quizId: string,
    isPublished: boolean
  ): Promise<void> {
    await http.patch(`/quizzes/${quizId}/publish`, { isPublished });
  },

  // Hämtar statistik för ett quiz baserat på id
  async getStatistics(quizId: string): Promise<any> {
    const res = await http.get(`/quizzes/${quizId}/statistics`);
    return res.data;
  },

  // Hämtar alla quiz skapade av den inloggade användaren
  async getMyQuizzes(): Promise<Quiz[]> {
    const res = await http.get("/quizzes/my");
    return res.data;
  },

  // Kollar om man har access till quiz
  async canAccess(quizId: string): Promise<boolean> {
    try {
      await http.get(`/quizzes/${quizId}/access`);
      return true;
    } catch (error) {
      if ((error as any).response?.status === 403) return false;
      throw error;
    }
  },

  // Hämtar alla quiz för ett topic
  async getForTopic(topicId: string, onlyPublished = true): Promise<Quiz[]> {
    const res = await http.get(`/topics/${topicId}/quizzes`, {
      params: { onlyPublished },
    });
    return res.data;
  },
};
