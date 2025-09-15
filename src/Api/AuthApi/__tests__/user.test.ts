import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import { AuthApi } from '../user';
import { http } from '../../../lib/http';

vi.mock('../../../lib/http', () => ({
  http: {
    post: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

//Testar AuthApi.editUser
describe('AuthApi.editUser', () => {
  it('should send edit user request', async () => {
    const mockPost = http.post as Mock;
    mockPost.mockResolvedValue({});

    const data = {
      UserName: 'alex',
      CurrentPassword: 'oldpass',
      NewPassword: 'newpass',
      Email: 'alex@example.com',
      AvatarUrl: 'http://avatar.com/alex.png',
    };

    await AuthApi.editUser(data);

    expect(mockPost).toHaveBeenCalledWith('user/edit', data);
  });

  it('should throw error if request fails', async () => {
    const mockPost = http.post as Mock;
    mockPost.mockRejectedValue(new Error('Edit Error'));

    const data = {
      UserName: 'alex',
      CurrentPassword: 'oldpass',
      NewPassword: 'newpass',
      Email: 'alex@example.com',
      AvatarUrl: 'http://avatar.com/alex.png',
    };

    await expect(AuthApi.editUser(data)).rejects.toThrow('Edit Error');
  });
});