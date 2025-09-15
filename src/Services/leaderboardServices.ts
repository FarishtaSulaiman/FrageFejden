import { UserScore, UserResult } from '../types/leaderboard';
import { http } from '../lib/http';

//Hjälpfunktion för att hämta användarens resultat och placering i en klass
export async function fetchUserResult(classId: string): Promise<UserResult> {
  //Hämta inloggad användare
  const { data: user } = await http.get('/Auth/me');
  console.log('Fetched user:', user);

  //Hämta alla poäng i klassen för att räkna ut placering
  const { data: scores }: { data: UserScore[] } = await http.get(`/Class/class/${classId}/scores`);
  //Räkna ut placering
  const sorted = scores.sort((a, b) => b.score - a.score);
console.log('user.id:', user.id);
console.log('scores:', scores);
  //Beräkna användarens placering efter sortering
  const placement = sorted.findIndex((u) => u.userId === user.id) + 1;

  return {
    avatarUrl: user.avatarUrl,
    username: user.fullName,
    score: user.exp,
    placement,
  };
}