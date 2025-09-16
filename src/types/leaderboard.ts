//Användarens poäng
export type UserScore = {
  userId: string;
  score: number;
};

//Data till usercard i leaderboard
export type UserResult = {
  avatarUrl: string;
  username: string;
  score: number;
  placement: number;
};