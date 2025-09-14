import { useEffect, useState } from 'react';
import { Classes } from '../../Api/ClassApi/Classes';
import { http } from '../../lib/http';
import styles from './ClassLeaderboard.module.css';

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
  <ul className={styles.userList}>
    {users.map((user) => (
      <li key={user.userId} className={styles.userItem}>
        <span className={styles.rank}>
          {user.rank === 1 && '🥇 '}
          {user.rank === 2 && '🥈 '}
          {user.rank === 3 && '🥉 '}
          {user.rank > 3 && `${user.rank}. `}
        </span>
        <strong className={styles.userId}>{user.userId}</strong> –
        <span className={styles.score}> {user.score} poäng</span>
      </li>
    ))}
  </ul>
);
}