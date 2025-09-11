import {describe, it, expect, vi, beforeEach, type Mock} from 'vitest';
import {SubjectsApi} from '../SubjectsApi';
import { http } from '../../../lib/http';
import type { SubjectDetails } from '../SubjectsApi';


//Mockar http modulen
vi.mock('../../../lib/http', () => ({
    http: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

//Rensar mockar innan varje test
beforeEach(() => {
    vi.clearAllMocks();
});

//Förklaring describe = grupperar tester för en specifik funktionalitet
// it = definierar ett enskilt testfall
// expect = förväntat resultat av ett test
//


//Testar getAllSubjects metoden
describe("SubjectsApi.getAllSubjects", () => {
    it("should fetch a summary for all subjects available", async () => {
        const mockSubjects = [
      {    
        id:"1",
        name: "Matte",
        description: "Grundläggande matematik",
        topicsCount: 5,
        levelsCount: 3,
        quizzesCount: 10,
        questionsCount: 50,
        createdAt: "2023-10-01T12:00:00Z"
      },
      {
        id: "2",
        name: "Historia",
        description: "Världshistoria",
        topicsCount: 2,
        levelsCount: 1,
        quizzesCount: 3,
        questionsCount: 6,
        createdAt: "2023-02-01",
        createdById: "user2",
        createdByName: "Sara"
      }
    ];            

    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: mockSubjects });
        
    const result = await SubjectsApi.getAllSubjects();

    expect(mockGet).toHaveBeenCalledWith("/subjects");
    expect(result).toEqual(mockSubjects);
    });

    it("should throw error if request fails", async () => {
    const mockGet = http.get as Mock;
    mockGet.mockRejectedValue(new Error("Network Error"));

    await expect(SubjectsApi.getAllSubjects()).rejects.toThrow("Network Error");
  });
});

//testar createSubject metoden
describe("SubjectsApi.createSubject", () => {
    it("should create a new subject and return its details", async () => {
        const newSubject = {
            name: "idrott",
            description: "Fysisk aktivitet och hälsa"
        };
        const createdSubject = {
            id: "3",
            name: "idrott",
            description: "Fysisk aktivitet och hälsa",
            topicsCount: 0,
            levelsCount: 0,
            quizzesCount: 0,
            questionsCount: 0,
            createdAt: "2024-01-01T10:00:00Z"
        };

        const mockPost = http.post as Mock;
        mockPost.mockResolvedValue({ data: createdSubject });
        const result = await SubjectsApi.createSubject(newSubject.name, newSubject.description);

        
        expect(mockPost).toHaveBeenCalledWith("/subjects", { 
          name: newSubject.name, 
          description: newSubject.description });

          expect(result).toEqual(createdSubject);
   });
        
    });
    
//Testar felhantering vid skapande av ämne
    it("should throw error if creation fails", async () => {
  const newSubject = {
    name: "idrott",
    description: "Fysisk aktivitet och hälsa"
  };

  const mockPost = http.post as Mock;
  mockPost.mockRejectedValue(new Error("Creation Error"));

  await expect(
    SubjectsApi.createSubject(newSubject.name, newSubject.description)
  ).rejects.toThrow("Creation Error");
})

//testar vad som händer om namn är tomt
it("should throw error if name is empty", async () => {
  const newSubject = { name: "", description: "Fysisk aktivitet och hälsa" };
  const mockPost = http.post as Mock;
  mockPost.mockRejectedValue(new Error("Name is required"));

  await expect(
    SubjectsApi.createSubject(newSubject.name, newSubject.description)
  ).rejects.toThrow("Name is required");
});

//testar vad som händer om beskrivning är tomt
it("should throw error if description is empty", async () => {
  const newSubject = { name: "idrott", description: "" };
  const mockPost = http.post as Mock;
  mockPost.mockRejectedValue(new Error("Description is required"));

  await expect(
    SubjectsApi.createSubject(newSubject.name, newSubject.description)
  ).rejects.toThrow("Description is required");
});

//testar vad som händer om både namn och beskrivning är tomt
it("should throw error if both name and description are missing", async () => {
  const newSubject = { name: "", description: "" };
  const mockPost = http.post as Mock;
  mockPost.mockRejectedValue(new Error("Name and description are required"));

  await expect(
    SubjectsApi.createSubject(newSubject.name, newSubject.description)
  ).rejects.toThrow("Name and description are required");
});

//Testar getSubjectById metoden
describe("SubjectsApi.getSubjectById", () => {
  it("should fetch subject details by id", async () => {
  const subjectId = "1";
  const mockSubject = {
    id: "1",
    name: "Matte",
    description: "Grundläggande matematik",
    topicsCount: 5,
    levelsCount: 3,
    quizzesCount: 10,
    questionsCount: 50,
    createdAt: "2023-10-01T12:00:00Z"
  };

  const mockGet = http.get as Mock;
  mockGet.mockResolvedValue({ data: mockSubject });

  const result = await SubjectsApi.getSubjectById(subjectId);

  expect(mockGet).toHaveBeenCalledWith(`/subjects/${subjectId}`);
  expect(result).toEqual(mockSubject);
});

//Testar felhantering vid hämtning av ämne med id som inte finns
it("should throw error if subject not found", async () => {
  const subjectId = "999";
  const mockGet = http.get as Mock;
  mockGet.mockRejectedValue(new Error("Subject not found"));

  await expect(SubjectsApi.getSubjectById(subjectId)).rejects.toThrow("Subject not found");
  });

//Testar UpdateSubject metoden
describe ("SubjectsApi.updateSubject", () => {
  it("should update subject details and return updated details", async () => {
    const subjectId = "1";
    const updateName = "Matematik";
    const updateDescription = "Avancerad matematik";
    const updatedSubject = {
      id: subjectId,
      name: updateName,
      description: updateDescription,
      topicsCount: 5,
      levelsCount: 3,
      quizzesCount: 10,
      questionsCount: 50,
      createdAt: "2023-10-01T12:00:00Z"
    };
    const mockPut = http.put as Mock;
    mockPut.mockResolvedValue({ data: updatedSubject });

    const result = await SubjectsApi.updateSubject(subjectId, updateName, updateDescription);

    expect(mockPut).toHaveBeenCalledWith(`/subjects/${subjectId}`, {
      name: updateName,
      description: updateDescription
    });
    expect(result).toEqual(updatedSubject);
  });

//Testar felhantering vid uppdatering av ämne
  it("should throw error if update fails", async () => {
    const subjectId = "1";
        const updatedName = "Matematik";
        const updatedDescription = "Avancerad matematik";

        const mockPut = http.put as Mock;
        mockPut.mockRejectedValue(new Error("Update Error"));

        await expect(
            SubjectsApi.updateSubject(subjectId, updatedName, updatedDescription)
        ).rejects.toThrow("Update Error");
    });

//Testar vad som händer om namn är tomt vid uppdatering
  it("should throw error if name is empty", async () => {
        const subjectId = "1";
        const updatedName = "";
        const updatedDescription = "Avancerad matematik";

        const mockPut = http.put as Mock;
        mockPut.mockRejectedValue(new Error("Name is required"));

        await expect(
            SubjectsApi.updateSubject(subjectId, updatedName, updatedDescription)
        ).rejects.toThrow("Name is required");
    });

//Testar vad som händer om beskrivning är tomt vid uppdatering
  it("should throw error if description is empty", async () => {
        const subjectId = "1";
        const updatedName = "Matematik";
        const updatedDescription = "";

        const mockPut = http.put as Mock;
        mockPut.mockRejectedValue(new Error("Description is required"));

        await expect(
            SubjectsApi.updateSubject(subjectId, updatedName, updatedDescription)
        ).rejects.toThrow("Description is required");
    });
});

//Testar deleteSubject metoden
describe("SubjectsApi.deleteSubject", () => {
    it("should delete subject by id", async () => {
        const subjectId = "1";
        const mockDelete = http.delete as Mock;
        mockDelete.mockResolvedValue({});

        await SubjectsApi.deleteSubject(subjectId);

        expect(mockDelete).toHaveBeenCalledWith(`/subjects/${subjectId}`);
    });

//Testar felhantering vid borttagning av ämne
    it("should throw error if deletion fails", async () => {
        const subjectId = "1";
        const mockDelete = http.delete as Mock;
        mockDelete.mockRejectedValue(new Error("Delete Error"));

        await expect(SubjectsApi.deleteSubject(subjectId)).rejects.toThrow("Delete Error");
    });
});

//Testar getSubjectDetails metoden
describe("SubjectsApi.getSubjectDetails", () => {
  it("should fetch subject details from /details endpoint", async () => {
    const subjectId = "1";

    const mockDetails: SubjectDetails = {
      id: "1",
      name: "Matte",
      description: "Grundläggande matematik",
      createdById: "user1",
      createdByName: "Anna",
      createdAt: "2023-10-01T12:00:00Z",
      topicsCount: 2,
      levelsCount: 2,
      quizzesCount: 10,
      questionsCount: 50,
      topics: [
        { id: "t1", name: "Algebra", questionsCount: 20 },
        { id: "t2", name: "Geometri", questionsCount: 30 }
      ],
      levels: [
        {
          id: "l1",
          name: "Nivå 1",
          quizzesCount: 5,
          level: {
            id: "lvl1",
            levelNumber: 1,
            minXpUnlock: 0,
            quizzesCount: 5
          }
        },
        {
          id: "l2",
          name: "Nivå 2",
          quizzesCount: 5,
          level: {
            id: "lvl2",
            levelNumber: 2,
            minXpUnlock: 100,
            quizzesCount: 5
          }
        }
      ]
    };

    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: mockDetails });

    const result = await SubjectsApi.getSubjectDetails(subjectId);

    expect(mockGet).toHaveBeenCalledWith(`/subjects/${subjectId}/details`);
    expect(result).toEqual(mockDetails);
  });

  it("should throw error if fetching details fails", async () => {
    const subjectId = "1";
    const mockGet = http.get as Mock;
    mockGet.mockRejectedValue(new Error("Failed to fetch subject details"));

    await expect(SubjectsApi.getSubjectDetails(subjectId)).rejects.toThrow("Failed to fetch subject details");
  });
});

//Testar getMySubjects metoden
describe("SubjectsApi.getMySubjects", () => {
    it("should fetch subjects created by the logged-in user", async () => {
        const mockSubjects = [
            { id: "1", name: "Matte", description: "Grundläggande matematik", topicsCount: 5, levelsCount: 3, quizzesCount: 10, questionsCount: 50, createdAt: "2023-10-01T12:00:00Z" },
            { id: "2", name: "Biologi", description: "Cellbiologi och ekologi", topicsCount: 3, levelsCount: 2, quizzesCount: 5, questionsCount: 20, createdAt: "2023-05-01T08:00:00Z" }
        ];

        const mockGet = http.get as Mock;
        mockGet.mockResolvedValue({ data: mockSubjects });

        const result = await SubjectsApi.getMySubjects();

        expect(mockGet).toHaveBeenCalledWith("/subjects/my");
        expect(result).toEqual(mockSubjects);
    });
    
//Testar felhantering vid hämtning av användarens ämnen
    it("should throw error if request fails", async () => {
        const mockGet = http.get as Mock;
        mockGet.mockRejectedValue(new Error("Network Error"));

        await expect(SubjectsApi.getMySubjects()).rejects.toThrow("Network Error");
    });
});
});
