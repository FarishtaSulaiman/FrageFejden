import { useEffect, useState } from 'react';
import { http } from '../../lib/http';
import styles from './SubjectLeaderboard.module.css';

type Subject = {
  id: string;
  name: string;
};

type LeaderboardUser = {
  userId: string;
  score: number;
  rank: number;
};

type Props = {
  classId: string;
};

export const SubjectLeaderboard = ({ classId }: Props) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await http.get(`/Subjects/classes/${classId}`);
      const subjects = data ?? [];
setSubjects(subjects);

if (subjects.length > 0) {
  setSubjectId(subjects[0].id);
} else {
  console.warn('Inga ämnen hittades i API-responsen:', data);
}
    };
    fetchSubjects();
  }, [classId]);

  useEffect(() => {
    if (!subjectId) return;
    const fetchLeaderboard = async () => {
      const { data: scores } = await http.get(`/Subject/${subjectId}/scores`);
      const sorted = scores
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));
      setUsers(sorted);
    };
    fetchLeaderboard();
  }, [subjectId]);

  if (!subjectId) return <div>Laddar ämnesdata...</div>;

  return (
    <div className={styles.leaderboardContainer}>
      <h1>Ämne - Väntar på implementation</h1>
<select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
  {subjects.map((subject) => (
    <option key={subject.id} value={subject.id}>
      {subject.name}
    </option>
  ))}
</select>

      <ul className={styles.userList}>
        {users.length === 0 && <li>Inga resultat ännu för detta ämne.</li>}
        {users.map((user) => (
          <li className={styles.userItem} key={user.userId}>
            {user.rank === 1 && '🥇 '}
            {user.rank === 2 && '🥈 '}
            {user.rank === 3 && '🥉 '}
            {user.rank > 3 && `${user.rank}. `}
            <strong>{user.userId}</strong> – {user.score} poäng
          </li>
        ))}
      </ul>
    </div>
  );
};