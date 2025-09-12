import { useEffect, useState } from 'react';
import { UserCard } from '../../components/Leaderboard/UserCard';
import { Classes } from '../../Api/ClassApi/Classes';
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
      {/* Andra komponenter */}
    </div>
  );
};
export default Leaderboard;