import { http } from "../../lib/http";

// ===== Shared =====
export type UUID = string;

// ===== Quizzes types (existing) =====
export type Quiz = {
  id: UUID;
  title: string;
  description?: string | null;
  subjectId: UUID;
  subjectName?: string | null;
  levelId?: UUID | null;
  levelTitle?: string | null;
  levelNumber?: number | null;
  classId?: UUID | null;
  className?: string | null;
  isPublished: boolean;
  createdById: UUID;
  createdByName?: string | null;
  questionCount: number;
  attemptCount: number;
  averageScore?: number | null;
  createdAt: string;
};

export type QuizFilter = {
  subjectId?: UUID;
  levelId?: UUID;
  classId?: UUID;
  isPublished?: boolean;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
};

export type CreateQuizDto = {
  topicId: UUID;
  subjectId?: UUID;  // Optional (server derives from topicId) — ignored by client payload
  levelId?: UUID | null;
  classId?: UUID | null;
  title: string;
  description?: string;
  isPublished: boolean;
  questionIds?: UUID[];
};

export type UpdateQuizDto = {
  title: string;
  description?: string;
  isPublished: boolean;
  levelId?: UUID | null;
  classId?: UUID | null;
};

export type PublishQuizDto = { isPublished: boolean };

export type UpdateQuizQuestionsDto = {
  questions: { questionId: UUID; sortOrder: number }[];
};

export type QuizSummaryDto = {
  id: UUID;
  title: string;
  description?: string | null;
  subjectName?: string | null;
  levelTitle?: string | null;
  levelNumber?: number | null;
  className?: string | null;
  isPublished: boolean;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
};

export type QuizWithQuestionsDto = {
  id: UUID;
  subjectId: UUID;
  subjectName: string;
  levelId?: UUID | null;
  levelTitle?: string | null;
  levelNumber?: number | null;
  classId?: UUID | null;
  className?: string | null;
  title: string;
  description?: string | null;
  isPublished: boolean;
  createdById: UUID;
  createdByName?: string | null;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
  averageScore: number;
  questions: QuizQuestionDto[];
};

export type QuizQuestionDto = {
  id: UUID;
  questionId: UUID;
  sortOrder: number;
  questionStem: string;
  questionType: string;
  difficulty: string;
  options: QuestionOptionDto[];
  correctOptionId?: UUID | null;
};

export type QuestionOptionDto = {
  id: UUID;
  optionText: string;
  sortOrder: number;
};

export type QuizStatsDto = {
  id: UUID;
  title: string;
  totalAttempts: number;
  averageScore: number;
  highestScore?: number | null;
  lowestScore?: number | null;
  passRate: number;
  lastAttempt?: string | null;
  recentAttempts: QuizAttemptSummaryDto[];
};

export type QuizAttemptSummaryDto = {
  id: UUID;
  userName: string;
  startedAt: string;
  completedAt?: string | null;
  score?: number | null;
  xpEarned: number;
};

// Legacy Question type for compatibility helpers
export type Question = {
  id: UUID;
  text: string;
  answers: { id: UUID; text: string }[];
  correctAnswerId?: UUID;
};

// Attempts
export type StartAttemptRequest = { bypassLock?: boolean };
export type StartAttemptResponse = { attemptId: UUID };

export type SubmitAnswerRequest = {
  questionId: UUID;
  selectedOptionId: UUID;
  timeMs: number;
};

export type SubmitAnswerResponse = {
  isCorrect: boolean;
  correctOptionId?: UUID | null;
};

export type FinishAttemptResponse = {
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationMs: number;
  xpEarned: number;
  passed: boolean;
  nextLevelId?: UUID | null;
};

export type QuizStatusResponse = {
  canAccess: boolean;
  reason: string;
  requiresUnlock: boolean;
  canRetry: boolean;
  hasCompleted: boolean;
  bestScore?: number | null;
  isLevelCompleted: boolean;
  lastAttemptAt?: string | null;
};

export type UserQuizStatusDto = {
  quizId: UUID;
  canAccess: boolean;
  hasCompleted: boolean;
  bestScore?: number | null;
  isLevelCompleted: boolean;
  canRetry: boolean;
  retryCount: number;
  lastAttemptAt?: string | null;
  xpEarned: number;
};

export type AllowRetryRequest = { userId: UUID; canRetry: boolean };

/* ============ NEW: Question creation types ============ */
export type CreateQuestionDto = {
  topicId: UUID;
  levelId: UUID;
  stem: string;
  explanation?: string | null;
  options: { text: string; isCorrect: boolean }[];
};

export type CreatedQuestionDto = { id: UUID };

/* =========================
 * API
 * ========================= */
export const QuizzesApi = {
  async getQuizzes(filter?: QuizFilter): Promise<QuizSummaryDto[]> {
    const res = await http.get<QuizSummaryDto[]>("/quizzes", {
      params: filter,
    });
    return res.data;
  },


  async getPublishedQuizzes(subjectId?: UUID, topicId?: UUID, levelId?: UUID): Promise<QuizSummaryDto[]> {
    const params: Record<string, unknown> = {};
    if (subjectId) params.subjectId = subjectId;
    if (topicId) params.topicId = topicId;
    if (levelId) params.levelId = levelId;

    const res = await http.get<QuizSummaryDto[]>("/quizzes/published", { params });

  // Mina quiz (skapade av inloggad lärare/admin)
  async getMyQuizzes(params?: {
    page?: number;
    pageSize?: number;
    isPublished?: boolean;
    classId?: UUID;
    searchTerm?: string;
  }): Promise<QuizSummaryDto[]> {
    const res = await http.get("/Quizzes/my-quizzes", { params });
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.items)) return (data as any).items;
    return [];
  },

  async getPublishedQuizzes(
    subjectId?: UUID,
    topicId?: UUID,
    levelId?: UUID
  ): Promise<QuizSummaryDto[]> {
    const params = { subjectId, topicId, levelId };
    const res = await http.get<QuizSummaryDto[]>("/quizzes/published", {
      params,
    });

    return res.data;
  },

  async getQuiz(id: UUID): Promise<Quiz> {
    const res = await http.get<Quiz>(`/quizzes/${id}`);
    return res.data;
  },

  async getQuizWithQuestions(
    id: UUID,
    includeAnswers = false
  ): Promise<QuizWithQuestionsDto> {
    const res = await http.get<QuizWithQuestionsDto>(
      `/quizzes/${id}/questions`,
      {
        params: { includeAnswers },
      }
    );
    return res.data;
  },

  async createQuiz(createDto: CreateQuizDto): Promise<Quiz> {
    // Don’t send undefined keys. Also: DO NOT forward subjectId; server derives from topicId.
    const payload: Record<string, unknown> = {
      topicId: createDto.topicId,
      title: createDto.title,
      isPublished: createDto.isPublished,
    };
    if (createDto.description !== undefined) payload.description = createDto.description;
    // if (createDto.subjectId) payload.subjectId = createDto.subjectId; // ❌ omit for safety
    if (createDto.levelId !== undefined) payload.levelId = createDto.levelId;
    if (createDto.classId !== undefined) payload.classId = createDto.classId;
    if (createDto.questionIds?.length) payload.questionIds = createDto.questionIds;

    const res = await http.post<Quiz>("/quizzes", payload);
    return res.data;
  },

  async updateQuiz(id: UUID, updateDto: UpdateQuizDto): Promise<Quiz> {
    const payload: Record<string, unknown> = {
      title: updateDto.title,
      isPublished: updateDto.isPublished,
    };
    if (updateDto.description !== undefined) payload.description = updateDto.description;
    if (updateDto.levelId !== undefined) payload.levelId = updateDto.levelId;
    if (updateDto.classId !== undefined) payload.classId = updateDto.classId;

    const res = await http.put<Quiz>(`/quizzes/${id}`, payload);
    return res.data;
  },

  async deleteQuiz(id: UUID): Promise<void> {
    await http.delete(`/quizzes/${id}`);
  },

  async publishQuiz(id: UUID, publishDto: PublishQuizDto): Promise<void> {
    await http.patch(`/quizzes/${id}/publish`, publishDto);
  },

  async updateQuizQuestions(
    id: UUID,
    updateDto: UpdateQuizQuestionsDto
  ): Promise<void> {
    await http.put(`/quizzes/${id}/questions`, updateDto);
  },

  async getQuizStats(id: UUID): Promise<QuizStatsDto> {
    const res = await http.get<QuizStatsDto>(`/quizzes/${id}/stats`);
    return res.data;
  },

  async checkQuizAccess(id: UUID): Promise<boolean> {
    try {
      await http.get(`/quizzes/${id}/access`);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 403) return false;
      throw error;
    }
  },

  async getMyQuizStatus(id: UUID): Promise<UserQuizStatusDto> {
    const res = await http.get<UserQuizStatusDto>(`/quizzes/${id}/my-status`);
    return res.data;
  },

  async allowRetry(id: UUID, request: AllowRetryRequest): Promise<void> {
    await http.post(`/quizzes/${id}/allow-retry`, request);
  },


  async getQuestions(
    quizId: UUID,
    includeAnswers = false
  ): Promise<Question[]> {

    const dto = await this.getQuizWithQuestions(quizId, includeAnswers);
    return dto.questions.map((q) => ({
      id: q.questionId,
      text: q.questionStem,
      answers: q.options.map((o) => ({ id: o.id, text: o.optionText })),
      correctAnswerId: q.correctOptionId || undefined,
    }));
  },

  async exists(id: UUID): Promise<boolean> {
    try {
      await this.getQuiz(id);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) return false;
      throw error;
    }
  },

  async canAccess(quizId: UUID): Promise<boolean> {
    return this.checkQuizAccess(quizId);
  },

  async setPublishedStatus(quizId: UUID, isPublished: boolean): Promise<void> {
    await this.publishQuiz(quizId, { isPublished });
  },


  /* ========== Questions endpoints ========== */

  async createQuestion(body: CreateQuestionDto) {
    const res = await http.post(`/topics/${body.topicId}/levels/${body.levelId}/questions`, {
      stem: body.stem,
      explanation: body.explanation ?? null,
      options: body.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
    });
    return res.data as CreatedQuestionDto;
  },

  async createQuestions(items: CreateQuestionDto[]) {
    const out: CreatedQuestionDto[] = [];
    for (const item of items) {
      const created = await this.createQuestion(item);
      out.push(created);
    }
    return out;
  },

  async createQuizWithNewQuestions(args: {
    topicId: UUID;
    levelId: UUID;
    title: string;
    description?: string;
    isPublished: boolean;
    subjectId?: UUID; // kept in type for compatibility
    classId?: UUID;
    questions: { stem: string; explanation?: string | null; options: { text: string; isCorrect: boolean }[]; }[];
  }) {
    const created = await this.createQuestions(
      args.questions.map(q => ({
        topicId: args.topicId,
        levelId: args.levelId,
        stem: q.stem,
        explanation: q.explanation ?? null,
        options: q.options,
      }))
    );

    const questionIds = created.map(c => c.id);

    return this.createQuiz({
      topicId: args.topicId,
      levelId: args.levelId,
      classId: args.classId,
      title: args.title,
      description: args.description,
      isPublished: args.isPublished,
      questionIds,
    });
  }
};

