import { useEffect, useState } from 'react';
import { UserCard } from '../../components/Leaderboard/UserCard';
import { ClassLeaderboard } from '../../components/Leaderboard/ClassLeaderboard';
import { Classes } from '../../Api/ClassApi/Classes';
import { SubjectLeaderboard } from '../../components/Leaderboard/SubjectLeaderboard';

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
    <div className="page-layout">
      <UserCard classId={classId} />
      <ClassLeaderboard classId={classId} />
      <SubjectLeaderboard classId={ classId }/>
    </div>
  );
};
export default Leaderboard;