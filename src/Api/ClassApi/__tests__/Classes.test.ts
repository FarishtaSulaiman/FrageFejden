import { http } from '../../../lib/http';
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { Classes } from '../Classes';

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

beforeEach(() => {
  vi.clearAllMocks();
});

//Testar Classes API
describe('Classes.MyClasses', () => {
  it('should fetch classes with pagination', async () => {
    const mockClasses = [{ id: 'c1', name: 'Matte' }];
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: { items: mockClasses } });

    const result = await Classes.MyClasses(1, 50);

    expect(mockGet).toHaveBeenCalledWith('/Class', { params: { page: 1, pageSize: 50 } });
    expect(result).toEqual(mockClasses);
  });
});

//Testar att skapa en klass
describe('Classes.CreateClass', () => {
  it('should create a class', async () => {
    const mockClass = { id: 'c1', name: 'Matte' };
    const mockPost = http.post as Mock;
    mockPost.mockResolvedValue({ data: mockClass });

    const result = await Classes.CreateClass('Matte', 'ÅK9', true, 'Beskrivning');

    expect(mockPost).toHaveBeenCalledWith('/Class', { name: 'Matte', gradeLabel: 'ÅK9', description: 'Beskrivning', makeMeTeacher: true });
    expect(result).toEqual(mockClass);
  });
});

//Testar att hämta en klass med ID
describe('Classes.GetClassById', () => {
  it('should fetch class by ID', async () => {
    const mockClass = { id: 'c1', name: 'Matte' };
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: mockClass });

    const result = await Classes.GetClassById('c1');

    expect(mockGet).toHaveBeenCalledWith('/Class/c1');
    expect(result).toEqual(mockClass);
  });
});

//Testar att uppdatera en klass
describe('Classes.UpdateClass', () => {
  it('should update class', async () => {
    const mockClass = { id: 'c1', name: 'Matte' };
    const mockPut = http.put as Mock;
    mockPut.mockResolvedValue({ data: mockClass });

    const result = await Classes.UpdateClass('c1', 'Matte', 'ÅK9', 'Beskrivning');

    expect(mockPut).toHaveBeenCalledWith('/Class/c1', { name: 'Matte', gradeLabel: 'ÅK9', description: 'Beskrivning' });
    expect(result).toEqual(mockClass);
  });
});

//Testar att ta bort en klass
describe('Classes.DeleteClass', () => {
  it('should delete class', async () => {
    const mockDelete = http.delete as Mock;
    mockDelete.mockResolvedValue({});

    await Classes.DeleteClass('c1');

    expect(mockDelete).toHaveBeenCalledWith('/Class/c1');
  });
});

//Testar att hämta inloggad användares klasser
describe('Classes.GetUsersClasses', () => {
  it('should fetch user\'s classes', async () => {
    const mockData = [{ id: 'c1', name: 'Matte' }];
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({data: mockData});

    const result = await Classes.GetUsersClasses();

    expect(mockGet).toHaveBeenCalledWith('/Class/me');
    expect(result).toEqual(mockData);
  });

  //Testar att hämta inloggad användares poäng
  describe('Classes.GetLoggedInUserScore', () => {
    it('should fetch logged-in user\'s score', async () => {
      const mockData = { points: 42 };
      const mockGet = http.get as Mock;
      mockGet.mockResolvedValue({ data: mockData });

      const result = await Classes.GetLoggedInUserScore('user123');

      expect(mockGet).toHaveBeenCalledWith('/Class/user/user123/points');
      expect(result).toEqual(mockData);
    });

    //Test för felhantering
    it('should throw error if request fails', async () => {
      const mockGet = http.get as Mock;
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(Classes.GetLoggedInUserScore('user123')).rejects.toThrow('Network Error');
    });
  });
});