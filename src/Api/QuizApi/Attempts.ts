// src/Api/QuizApi/Attempts.ts
import { http } from "../../lib/http";
import { UUID, StartAttemptRequest, StartAttemptResponse, SubmitAnswerRequest, SubmitAnswerResponse, FinishAttemptResponse, QuizStatusResponse } from "./Quizzes";

export const AttemptsApi = {
    // Start a new attempt
    async startAttempt(quizId: UUID, request: StartAttemptRequest = {}): Promise<StartAttemptResponse> {
        const res = await http.post<StartAttemptResponse>(`/quizzes/${quizId}/attempts`, request);
        return res.data;
    },

    // Submit an answer for a question
    async submitAnswer(attemptId: UUID, request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
        const res = await http.post<SubmitAnswerResponse>(`/attempts/${attemptId}/answers`, request);
        return res.data;
    },

    // Finish an attempt and get results
    async finishAttempt(attemptId: UUID): Promise<FinishAttemptResponse> {
        const res = await http.post<FinishAttemptResponse>(`/attempts/${attemptId}/finish`);
        return res.data;
    },

    // Get quiz status for current user (can they access it, have they completed it, etc.)
    async getQuizStatus(quizId: UUID): Promise<QuizStatusResponse> {
        const res = await http.get<QuizStatusResponse>(`/quizzes/${quizId}/status`);
        return res.data;
    },

    // Helper method to check if user can start an attempt
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

    // Helper method for complete attempt flow
    async completeAttemptFlow(
        quizId: UUID,
        answers: { questionId: UUID; selectedOptionId: UUID; timeMs: number }[],
        onAnswerSubmitted?: (questionIndex: number, isCorrect: boolean) => void
    ): Promise<FinishAttemptResponse> {
        // Start attempt
        const { attemptId } = await this.startAttempt(quizId);

        // Submit all answers
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