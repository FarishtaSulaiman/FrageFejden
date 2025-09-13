import { useEffect, useState } from 'react';
import { Classes } from '../../Api/ClassApi/Classes';
import { http } from '../../lib/http';

type LeaderboardUser = {
  userId: string;
  score: number;
  rank: number;
};

type Props = {
  classId: string;
};

export function ClassLeaderboard({ classId }: Props) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: user } = await http.get('/Auth/me');
      const { leaderboard } = await Classes.GetClassLeaderboard(classId, user.id);
      setUsers(leaderboard);
    }
    fetchLeaderboard();
  }, [classId]);

  return (
    <ul>
      {users.map((user) => (
        <li key={user.userId}>
          {user.rank === 1 && '🥇 '}
          {user.rank === 2 && '🥈 '}
          {user.rank === 3 && '🥉 '}
          {user.rank > 3 && `${user.rank}. `}
          <strong>{user.userId}</strong> – {user.score} poäng
        </li>
      ))}
    </ul>
  );
}