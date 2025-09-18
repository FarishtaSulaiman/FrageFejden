import { useEffect, useState } from 'react';
import { http } from '../../lib/http';
import styles from './SubjectLeaderboard.module.css';

type Subject = {
  id: string;
  name: string;
};

type LeaderboardUser = {
  userId: string;
  fullName: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

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
      .sort((a, b) => b.totalExp - a.totalExp)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        score: user.totalExp,
      }));

    setUsers(sorted);
  };

  fetchLeaderboard();
}, [subjectId]);

  if (!subjectId) return <div>Laddar ämnesdata...</div>;

  // Huvudkomponenten renderar en dropdown för att välja ämne och visar 
  // topplistan med sidnavigering
  return (
    <div className={styles.leaderboardContainer}>
      <h1>ÄMNE</h1>
<select className={styles.select} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
  {subjects.map((subject) => (
    <option key={subject.id} value={subject.id}>
      {subject.name}
    </option>
  ))}
</select>

     <ul className={styles.userList}>
  {users.length === 0 && (
    <li className={styles.empty}>Inga resultat ännu för detta ämne.</li>
  )}
  {Array.from({ length: usersPerPage }).map((_, index) => {
    const user = currentUsers[index];
    return (
      <li key={user?.userId ?? `empty-${index}`} className={styles.userItem}>
        <span className={styles.rank}>
          {user
            ? user.rank === 1
              ? '🥇'
              : user.rank === 2
              ? '🥈'
              : user.rank === 3
              ? '🥉'
              : `${user.rank}.`
            : `${index + 1}.`}
        </span>
        <span className={styles.userId}>
          {user ? user.fullName : <em>–</em>}
        </span>
        <span className={styles.score}>
          {user ? `${user.score} poäng` : <em>-</em>}
        </span>
      </li>
    );
  })}
</ul>

{users.length > usersPerPage && (
  <div className={styles.pagination}>
    <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
    >
      Föregående
    </button>
    <span>Sida {currentPage}</span>
    <button
      onClick={() =>
        setCurrentPage((prev) =>
          indexOfLastUser < users.length ? prev + 1 : prev
        )
      }
      disabled={indexOfLastUser >= users.length}
    >
      Nästa
    </button>
  </div>
)}
    </div>
  );
}