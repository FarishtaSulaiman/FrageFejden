import { http } from "../../../lib/http";
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { ClassMemberShips } from "../ClassMemberships";


vi.mock('../../../lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

//Testar GetClassMembers
describe('ClassMemberShips.GetClassMembers', () => {
  it('should fetch class members with pagination', async () => {
    const mockMembers = [{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }];
    const mockGet = http.get as Mock;
    mockGet.mockResolvedValue({ data: { items: mockMembers } });

    const result = await ClassMemberShips.GetClassMembers('class1', 1, 50);

    expect(mockGet).toHaveBeenCalledWith('/Class/class1/members', { params: { page: 1, pageSize: 50 } });
    expect(result).toEqual(mockMembers);
  });


  //Testar felhantering för GetClassMembers
  it('should throw error if request fails', async () => {
    const mockGet = http.get as Mock;
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(ClassMemberShips.GetClassMembers('class1')).rejects.toThrow('Network Error');
  });
});

//Testar AddMember
describe('ClassMemberShips.AddMember', () => {
  it('should add member to class', async () => {
    const mockPost = http.post as Mock;
    mockPost.mockResolvedValue({});

    await ClassMemberShips.AddMember('class1', 'user1');

    expect(mockPost).toHaveBeenCalledWith('/Class/user1/members');
  });

  //testar felhantering för AddMember
  it('should throw error if request fails', async () => {
    const mockPost = http.post as Mock;
    mockPost.mockRejectedValue(new Error('Add Error'));

    await expect(ClassMemberShips.AddMember('class1', 'user1')).rejects.toThrow('Add Error');
  });
});

//Testar RemoveMember
describe('ClassMemberShips.RemoveMember', () => {
  it('should remove member from class', async () => {
    const mockDelete = http.delete as Mock;
    mockDelete.mockResolvedValue({});

    await ClassMemberShips.RemoveMember('class1', 'user1');

    expect(mockDelete).toHaveBeenCalledWith('/Class/class1/members/user1');
  });

    //testar felhantering för RemoveMember
  it('should throw error if request fails', async () => {
    const mockDelete = http.delete as Mock;
    mockDelete.mockRejectedValue(new Error('Remove Error'));

    await expect(ClassMemberShips.RemoveMember('class1', 'user1')).rejects.toThrow('Remove Error');
  });
});