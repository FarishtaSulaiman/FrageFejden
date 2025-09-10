import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { ClassAccess } from '../ClassAccess';
import { http } from '../../../lib/http';

vi.mock('../../../lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

//Testar validateJoinCode
describe('ClassAccess.validateJoinCode', () => {
  it('should return parsed response from raw keys', async () => {
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: { IsValid: true, ClassId: 'c1', ClassName: 'Math', Message: 'OK' } });

    const result = await ClassAccess.validateJoinCode('abc');

    expect(result).toEqual({ isValid: true, classId: 'c1', className: 'Math', message: 'OK' });
    expect(mockGet).toHaveBeenCalledWith('/Class/validate-joincode/abc');
  });

  it('should return parsed response from lowercase keys', async () => {
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: { isValid: true, classId: 'c2', className: 'Science', message: 'Valid' } });

    const result = await ClassAccess.validateJoinCode('def');

    expect(result).toEqual({ isValid: true, classId: 'c2', className: 'Science', message: 'Valid' });
    expect(mockGet).toHaveBeenCalledWith('/Class/validate-joincode/def');
  });

  it('should default to false if no valid keys', async () => {
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: {} });

    const result = await ClassAccess.validateJoinCode('xyz');

    expect(result).toEqual({ isValid: false, classId: undefined, className: undefined, message: undefined });
    expect(mockGet).toHaveBeenCalledWith('/Class/validate-joincode/xyz');
  });
});

//Testar join
describe('ClassAccess.join', () => {
  it('should return join response', async () => {
    const mockPost = http.post as Mock;
    mockPost.mockResolvedValue({ data: { id: 'u1', classId: 'c1' } });

    const result = await ClassAccess.join('abc');

    expect(result).toEqual({ id: 'u1', classId: 'c1' });
    expect(mockPost).toHaveBeenCalledWith('/Class/join', { joinCode: 'abc' });
  });
});