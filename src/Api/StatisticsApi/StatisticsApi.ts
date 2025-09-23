// src/Api/StatisticsApi/statistics.ts
import { http } from "../../lib/http";

export type ClassAverageScoreDto = {
  averageScore: number;
  studentsWithData: number;
  totalStudents: number;
};

export type StudentResponseDto = {
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  questionId: string;
  isCorrect: boolean;
  timeMs?: number | null;
  attemptId: string;
  completedAt?: string | null;
};

export type CompletedQuizDto = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score?: number | null;
  xpEarned: number;
  startedAt: string; // DateTime -> ISO-string
  completedAt: string; // DateTime -> ISO-string
  // duration kan förekomma som TimeSpan-string beroende på serialization – vi använder started/completed istället.
  duration?: string;
};

export type TimeAveragesDto = {
  averageQuizDurationMinutes: number;
  averageResponseTimeSeconds: number;
  totalCompletedQuizzes: number;
  totalResponses: number;
};

export const StatisticsApi = {
  // Genomsnittlig poäng för en specifik klass
  async getClassAverageScore(classId: string): Promise<ClassAverageScoreDto> {
    const res = await http.get<ClassAverageScoreDto>(
      `/statistics/class/${classId}/average-score`
    );
    return res.data;
  },

  // Alla elevsvar (rådata) för lärarens quiz
  async getStudentResponses(): Promise<StudentResponseDto[]> {
    const res = await http.get<StudentResponseDto[]>(
      `/statistics/student-responses`
    );
    return res.data;
  },

  // Genomförda quiz-försök (används för tidsgenomsnitt per elev)
  async getCompletedQuizzes(): Promise<CompletedQuizDto[]> {
    const res = await http.get<CompletedQuizDto[]>(
      `/statistics/completed-quizzes`
    );
    return res.data;
  },

  // Övergripande tidsgenomsnitt
  async getTimeAverages(): Promise<TimeAveragesDto> {
    const res = await http.get<TimeAveragesDto>(`/statistics/time-averages`);
    return res.data;
  },
};
