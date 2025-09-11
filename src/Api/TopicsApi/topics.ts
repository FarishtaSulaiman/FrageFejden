import { http } from "../../lib/http";

/* ===== DTO:er som matchar TopicsController ===== */

export type TopicSummaryDto = {
    topicId: string;
    subjectId: string;
    name: string;
    description?: string | null;
    sortOrder: number;
    levelCount: number;
};

export type TopicDto = {
    id: string;
    subjectId: string;
    name: string;
    description?: string | null;
    sortOrder: number;
    levelCount: number;
};

export type TopicCreateDto = {
    subjectId: string;
    name: string;
    description?: string;
    sortOrder?: number;
};

export type TopicUpdateDto = {
    name?: string;
    description?: string | null;
    sortOrder?: number;
};

export type LevelRowDto = {
    levelId: string;
    topicId: string;
    levelNumber: number;
    title?: string | null;
    minXpUnlock: number;
};

export type LevelCreateDto = {
    levelNumber: number;
    title?: string;
    minXpUnlock: number;
};

export type LevelUpdateDto = {
    levelNumber?: number;
    title?: string | null;
    minXpUnlock?: number;
};

export type TopicLevelStatusDto = {
    levelId: string;
    levelNumber: number;
    title?: string | null;
    minXpUnlock: number;
    isUnlocked: boolean;
    isCompleted: boolean;
};

export type TopicProgressDto = {
    subjectId: string;
    subjectName: string;
    topicId: string;
    topicName: string;
    totalLevels: number;
    completedLevels: number;
    userXp: number;
    levels: TopicLevelStatusDto[];
};

/* =======================
 * Topics API (frontend)
 * ======================= */

export const topicApi = {
    // Hämtar alla kurser (topics) för ett ämne
    async listBySubject(subjectId: string): Promise<TopicSummaryDto[]> {
        const res = await http.get<TopicSummaryDto[]>(`/topics/by-subject/${subjectId}`);
        return res.data;
    },

    // Hämtar en specifik kurs (topic)
    async get(topicId: string): Promise<TopicDto> {
        const res = await http.get<TopicDto>(`/topics/${topicId}`);
        return res.data;
    },

    // Skapar en ny kurs (topic)
    async create(body: TopicCreateDto): Promise<TopicDto> {
        const res = await http.post<TopicDto>(`/topics`, body);
        return res.data;
    },

    // Uppdaterar en kurs (topic)
    async update(topicId: string, body: TopicUpdateDto): Promise<TopicDto> {
        const res = await http.put<TopicDto>(`/topics/${topicId}`, body);
        return res.data;
    },

    // Tar bort en kurs (topic)
    async remove(topicId: string): Promise<void> {
        await http.delete(`/topics/${topicId}`);
    },

    // Hämtar alla nivåer under en kurs (topic)
    async listLevels(topicId: string): Promise<LevelRowDto[]> {
        const res = await http.get<LevelRowDto[]>(`/topics/${topicId}/levels`);
        return res.data;
    },

    // Skapar en nivå under en kurs (topic)
    async createLevel(topicId: string, body: LevelCreateDto): Promise<LevelRowDto> {
        const res = await http.post<LevelRowDto>(`/topics/${topicId}/levels`, body);
        return res.data;
    },

    // Uppdaterar en nivå
    async updateLevel(levelId: string, body: LevelUpdateDto): Promise<LevelRowDto> {
        const res = await http.put<LevelRowDto>(`/topics/levels/${levelId}`, body);
        return res.data;
    },

    // Tar bort en nivå
    async deleteLevel(levelId: string): Promise<void> {
        await http.delete(`/topics/levels/${levelId}`);
    },

    // Hämtar progression för aktuell användare i en kurs (topic)
    async getProgress(topicId: string): Promise<TopicProgressDto> {
        // OBS: matchar GET /api/topics/{topicId}/progress
        const res = await http.get<TopicProgressDto>(`/topics/${topicId}/progress`);
        return res.data;
    },
};
