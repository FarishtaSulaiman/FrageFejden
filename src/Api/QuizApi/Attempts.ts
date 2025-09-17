// src/Api/QuizApi/Attempts.ts
import { http } from "../../lib/http";
import { UUID, StartAttemptRequest, StartAttemptResponse, SubmitAnswerRequest, SubmitAnswerResponse, FinishAttemptResponse, QuizStatusResponse } from "./Quizzes";

export const AttemptsApi = {
    async startAttempt(quizId: UUID, request: StartAttemptRequest = {}): Promise<StartAttemptResponse> {
        const res = await http.post<StartAttemptResponse>(`/quizzes/${quizId}/attempts`, request);
        return res.data;
    },

    async submitAnswer(attemptId: UUID, request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
        const res = await http.post<SubmitAnswerResponse>(`/attempts/${attemptId}/answers`, request);
        return res.data;
    },

    async finishAttempt(attemptId: UUID): Promise<FinishAttemptResponse> {
        const res = await http.post<FinishAttemptResponse>(`/attempts/${attemptId}/finish`);
        return res.data;
    },

    async getQuizStatus(quizId: UUID): Promise<QuizStatusResponse> {
        const res = await http.get<QuizStatusResponse>(`/quizzes/${quizId}/status`);
        return res.data;
    },

    async canStartAttempt(quizId: UUID): Promise<{ canStart: boolean; reason?: string }> {
        try {
            const status = await this.getQuizStatus(quizId);
            if (!status.canAccess) {
                return {
                    canStart: false,
                    reason: status.reason || "Access denied"
                };
            }
            return { canStart: true };
        } catch (error: any) {
            return {
                canStart: false,
                reason: error?.response?.data?.message || "Unable to check access"
            };
        }
    },

    async completeAttemptFlow(
        quizId: UUID,
        answers: { questionId: UUID; selectedOptionId: UUID; timeMs: number }[],
        onAnswerSubmitted?: (questionIndex: number, isCorrect: boolean) => void
    ): Promise<FinishAttemptResponse> {
        const { attemptId } = await this.startAttempt(quizId);

        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            const result = await this.submitAnswer(attemptId, answer);

            if (onAnswerSubmitted) {
                onAnswerSubmitted(i, result.isCorrect);
            }
        }

        // Finish attempt
        return await this.finishAttempt(attemptId);
    }
};