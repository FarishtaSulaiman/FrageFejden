import { http } from "../../../lib/http";
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { ClassAccess } from '../ClassAccess';

// Mockar http-modulen
vi.mock('../../../lib/http', () => ({
  http: {
    get: vi.fn(),
  },
}));

// Rensar mockar innan varje test
beforeEach(() => {
  vi.clearAllMocks();
});

// Testar Mask-metoden
describe('ClassAccess.Mask', () => {
  it('should fetch all classes with pagination', async () => {
    const mockClasses = [{ id: 'c1', name: 'Matte' }, { id: 'c2', name: 'Fysik' }];
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: { items: mockClasses } });

    const result = await ClassAccess.Mask(1, 50);

    expect(mockGet).toHaveBeenCalledWith('/Class', { params: { page: 1, pageSize: 50 } });
    expect(result).toEqual(mockClasses);
  });

  it('should throw error if request fails', async () => {
    const mockGet = http.get as Mock;
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(ClassAccess.Mask()).rejects.toThrow('Network Error');
  });
});