import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { QuizzesApi } from '../Quizzes';
import { http } from '../../../lib/http';

//Mockar http modulen
vi.mock('../../../lib/http', () => ({
    http: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        head: vi.fn(),
    },
}));

//Rensar mockar innan varje test
beforeEach(() => {
    vi.clearAllMocks();
});

//Förklaring describe = grupperar tester för en specifik funktionalitet
// it = definierar ett enskilt testfall
// expect = förväntat resultat av ett test

//Testar getFiltered metoden

describe("QuizzesApi.getFiltered", () => {
    it("should fetch quizzes with filters", async () => {
        const filters: { SubjectId?: string; LevelId?: string; IsPublished?: boolean; SearchTerm?: string; PageNumber?: number; PageSize?: number } = {
            SubjectId: "sub1",
            LevelId: "lvl1",
            IsPublished: true,
            SearchTerm: "math",
            PageNumber: 1,
            PageSize: 10
        };
        const mockQuizzes = [{ id: "q1", title: "Quiz 1" }];
        const mockGet = http.get as Mock;
        mockGet.mockResolvedValue({ data: mockQuizzes });

        const result = await QuizzesApi.getFiltered(filters);

        expect(mockGet).toHaveBeenCalledWith("/quizzes", { params: filters });
        expect(result).toEqual(mockQuizzes);
    });

    it("should throw error if request fails", async () => {
        const filters: { SubjectId?: string; LevelId?: string; IsPublished?: boolean; SearchTerm?: string; PageNumber?: number; PageSize?: number } = {
            SubjectId: "sub1",
            LevelId: "lvl1",
            IsPublished: true,
            SearchTerm: "math",
            PageNumber: 1,
            PageSize: 10
        };
        const mockGet = http.get as Mock;
        mockGet.mockRejectedValue(new Error("Network Error"));

        await expect(QuizzesApi.getFiltered(filters)).rejects.toThrow("Network Error");
    });
});

//Testar create metoden

describe("QuizzesApi.create", () => {
    it("should create a new quiz", async () => {
        const data: { title: string; description: string; applicationUserId: string; subjectId: string; levelId: string; isPublished: boolean } = {
            title: "Quiz om algebra",
            description: "Testa dina kunskaper i grundläggande algebra",
            applicationUserId: "user123",
            subjectId: "math101",
            levelId: "level1",
            isPublished: false
        };
        const createdQuiz = { id: "q1", ...data };
        const mockPost = http.post as Mock;
        mockPost.mockResolvedValue({ data: createdQuiz });

        const result = await QuizzesApi.create(data);

        expect(mockPost).toHaveBeenCalledWith("/quizzes", data);
        expect(result).toEqual(createdQuiz);
    });

    //Testar felhantering vid skapande
    
    it("should throw error if creation fails", async () => {
        const data: { title: string; description: string; applicationUserId: string; subjectId: string; levelId: string; isPublished: boolean } = {
            title: "Quiz",
            description: "Desc",
            applicationUserId: "user1",
            subjectId: "subj1",
            levelId: "level1",
            isPublished: false
        };
        const mockPost = http.post as Mock;
        mockPost.mockRejectedValue(new Error("Creation Error"));

        await expect(QuizzesApi.create(data)).rejects.toThrow("Creation Error");
    });
});

//Testar getPublished metoden

describe("QuizzesApi.getPublished", () => {
    it("should fetch published quizzes", async () => {
        const filters: { SubjectId?: string; LevelId?: string } = {
            SubjectId: "subj1",
            LevelId: "level1"
        };
        const mockQuizzes = [{ id: "q1", title: "Quiz 1" }];
        const mockGet = http.get as Mock;
        mockGet.mockResolvedValue({ data: mockQuizzes });

        const result = await QuizzesApi.getPublished(filters);

        expect(mockGet).toHaveBeenCalledWith("/quizzes/published", { params: filters });
        expect(result).toEqual(mockQuizzes);
    });

    //Testar felhantering vid hämtning av publicerade quizzar
    
    it("should throw error if request fails", async () => {
        const filters: { SubjectId?: string; LevelId?: string } = {
            SubjectId: "subj1",
            LevelId: "level1"
        };
        const mockGet = http.get as Mock;
        mockGet.mockRejectedValue(new Error("Network Error"));

        await expect(QuizzesApi.getPublished(filters)).rejects.toThrow("Network Error");
    });
});