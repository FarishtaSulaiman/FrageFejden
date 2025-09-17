// src/Api/AdminApi/Admin.ts
import { http } from "../../lib/http";
import { UUID } from "../QuizApi/Quizzes";

// Admin Types
export type AdminUserProgressDto = {
    progressId: UUID;
    userId: UUID;
    userName: string;
    subjectName: string;
    topicName?: string | null;
    levelTitle?: string | null;
    levelNumber: number;
    xp: number;
    isCompleted: boolean;
    completedAt?: string | null;
    canRetry: boolean;
    retryCount: number;
    bestScore?: number | null;
    lastActivity?: string | null;
};

export type AdminProgressStatsDto = {
    totalUsers: number;
    activeUsers: number;
    completedLevels: number;
    totalLevels: number;
    completionRate: number;
    topPerformers: TopPerformerDto[];
};

export type TopPerformerDto = {
    userId: UUID;
    userName: string;
    totalXp: number;
    completedLevels: number;
};

export type SetRetryRequest = {
    canRetry: boolean;
};

export const AdminApi = {
    async getUserProgress(userId: UUID): Promise<AdminUserProgressDto[]> {
        const res = await http.get<AdminUserProgressDto[]>(`/api/admin/users/${userId}/progress`);
        return res.data;
    },

    async resetUserProgress(userId: UUID, levelId: UUID): Promise<void> {
        await http.post(`/admin/users/${userId}/progress/${levelId}/reset`);
    },

    async setUserRetryPermission(userId: UUID, levelId: UUID, canRetry: boolean): Promise<void> {
        const request: SetRetryRequest = { canRetry };
        await http.post(`/admin/users/${userId}/progress/${levelId}/allow-retry`, request);
    },

    async getProgressStats(): Promise<AdminProgressStatsDto> {
        const res = await http.get<AdminProgressStatsDto>("/admin/progress/stats");
        return res.data;
    },

    async deleteUserAttempt(userId: UUID, attemptId: UUID): Promise<void> {
        await http.delete(`/admin/users/${userId}/attempts/${attemptId}`);
    },

    
    async getAllowRetryUsers(levelId: UUID): Promise<AdminUserProgressDto[]> {
        
        throw new Error("Not implemented - would need custom backend endpoint");
    },

    async bulkResetProgress(userIds: UUID[], levelId: UUID): Promise<void> {
        
        const promises = userIds.map(userId => this.resetUserProgress(userId, levelId));
        await Promise.all(promises);
    },

    async bulkSetRetryPermission(userIds: UUID[], levelId: UUID, canRetry: boolean): Promise<void> {
       
        const promises = userIds.map(userId => this.setUserRetryPermission(userId, levelId, canRetry));
        await Promise.all(promises);
    }
};