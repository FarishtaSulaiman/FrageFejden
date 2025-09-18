// src/Api/ProgressApi/Progress.ts
import { http } from "../../lib/http";
import { UUID } from "../QuizApi/Quizzes";

// Progress Types
export type UserProgressOverviewDto = {
    userId: UUID;
    totalXp: number;
    completedLevels: number;
    totalLevels: number;
    subjects: SubjectProgressDto[];
};

export type SubjectProgressDto = {
    subjectId: UUID;
    subjectName: string;
    totalXp: number;
    completedLevels: number;
    totalLevels: number;
    topics: TopicProgressDto[];
};

export type TopicProgressDto = {
    topicId: UUID;
    topicName: string;
    completedLevels: number;
    totalLevels: number;
};

export type LevelProgressDto = {
    levelId: UUID;
    levelTitle?: string | null;
    levelNumber: number;
    topicName?: string | null;
    subjectName?: string | null;
    xp: number;
    isCompleted: boolean;
    completedAt?: string | null;
    canRetry: boolean;
    retryCount: number;
    bestScore?: number | null;
    canAccess: boolean;
};

export type LearningPathDto = {
    topicId: UUID;
    topicName: string;
    subjectName?: string | null;
    totalLevels: number;
    completedLevels: number;
    levels: PathLevelDto[];
};

export type PathLevelDto = {
    levelId: UUID;
    levelNumber: number;
    title: string;
    description?: string | null;
    canAccess: boolean;
    isCompleted: boolean;
    bestScore?: number | null;
    xp: number;
    status: "locked" | "available" | "completed";
    studyText?: string | null;

};

export const ProgressApi = {
    async getProgressOverview(): Promise<UserProgressOverviewDto> {
        const res = await http.get<UserProgressOverviewDto>("/progress/overview");
        return res.data;
    },

    async getLevelProgress(levelId: UUID): Promise<LevelProgressDto> {
        const res = await http.get<LevelProgressDto>(`/progress/level/${levelId}`);
        return res.data;
    },

    async getLearningPath(topicId: UUID): Promise<LearningPathDto> {
        const res = await http.get<LearningPathDto>(`/progress/topic/${topicId}/path`);
        return res.data;
    },

    async markStudyTextAsRead(levelId: UUID): Promise<void> {
        await http.post(`/progress/mark-study-text/${levelId}`);
    },

    async canAccessLevel(levelId: UUID): Promise<boolean> {
        try {
            const progress = await this.getLevelProgress(levelId);
            return progress.canAccess;
        } catch (error) {
            return false;
        }
    },

    async isLevelCompleted(levelId: UUID): Promise<boolean> {
        try {
            const progress = await this.getLevelProgress(levelId);
            return progress.isCompleted;
        } catch (error) {
            return false;
        }
    },

    async getSubjectProgress(subjectId: UUID): Promise<SubjectProgressDto | null> {
        try {
            const overview = await this.getProgressOverview();
            return overview.subjects.find(s => s.subjectId === subjectId) || null;
        } catch (error) {
            return null;
        }
    },

    async getTopicProgress(topicId: UUID): Promise<TopicProgressDto | null> {
        try {
            const overview = await this.getProgressOverview();
            for (const subject of overview.subjects) {
                const topic = subject.topics.find(t => t.topicId === topicId);
                if (topic) return topic;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
};