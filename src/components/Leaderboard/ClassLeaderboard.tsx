import { useEffect, useState } from 'react';
import { Classes } from '../../Api/ClassApi/Classes';
import { http } from '../../lib/http';
import styles from './ClassLeaderboard.module.css';

type LeaderboardUser = {
  userId: string;
  score: number;
  rank: number;
  fullName: string;
  
};

type Props = {
  classId: string;
};

export function ClassLeaderboard({ classId }: Props) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
const usersPerPage = 10;

const indexOfLastUser = currentPage * usersPerPage;
const indexOfFirstUser = indexOfLastUser - usersPerPage;
const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: user } = await http.get('/Auth/me');
      const { leaderboard } = await Classes.GetClassLeaderboard(classId, user.id);
      setUsers(leaderboard);
      setCurrentPage(1);
    }
    fetchLeaderboard();
  }, [classId]);


return (
  <div className={styles.userList}>
    <h1>TOPPLISTA</h1>

    <ul className={styles.userList}>
{Array.from({ length: usersPerPage }).map((_, index) => {
          const user = currentUsers[index];
          return (
            <li
              key={user?.userId ?? `empty-${index}`}
              className={`${styles.userItem} ${!user ? styles.emptyRow : ''}`}
            >
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
          Föreg.
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