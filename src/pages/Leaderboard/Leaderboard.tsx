import { useEffect, useState } from 'react';
import { UserCard } from '../../components/Leaderboard/UserCard';
import { ClassLeaderboard } from '../../components/Leaderboard/ClassLeaderboard';
import { Classes } from '../../Api/ClassApi/Classes';
import { SubjectLeaderboard } from '../../components/Leaderboard/SubjectLeaderboard';
import styles from '../../components/Leaderboard/LeaderboardLayout.module.css';
import leaderboardTitle from '../../assets/images/titles/leaderboard-title.png';

export const Leaderboard = () => {
  const [classId, setClassId] = useState<string | null>(null);
  

  useEffect(() => {
    const fetchClass = async () => {
      const classes = await Classes.GetUsersClasses();
      if (classes.length > 0) {
        setClassId(classes[0].id); // Välj första klass, eller filtrera efter roll
      }
    };
    fetchClass();
  }, []);

  if (!classId) return <div>Laddar klassdata...</div>;

  return (
    <div>
      <img src={leaderboardTitle} alt="Leaderboard Title" className={styles.titleImage} />
    <div className={styles.wrapper}>
  <div className={styles.box}><UserCard classId={classId} /></div>
  <div className={styles.box}><SubjectLeaderboard classId={classId} /></div>
  <div className={styles.box}><ClassLeaderboard classId={classId} /></div>
  </div>
</div>
  );
};
export default Leaderboard;