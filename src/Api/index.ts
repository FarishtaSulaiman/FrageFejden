//Index filer för att exportera alla API-klienter från en plats
export { AuthApi } from "./AuthApi/auth";
export { SystemApi } from "./SystemApi/system";
export { Classes } from "./ClassApi/Classes";
export { ClassMemberShips } from "./ClassApi/ClassMemberships";
export { ClassAccess } from "./ClassApi/ClassAccess";
export { QuizzesApi } from "./QuizApi/Quizzes";
export { SubjectsApi, type SubjectDto } from "./SubjectApi/SubjectsApi";
export { topicApi } from "./TopicsApi/topics";
export { getFunFact, type FunFact } from "./FunFacts/FunFacts";
export { DailyApi } from "./DailyApi/Daily";

export { TeacherClasses } from "./ClassApi/teacherClasses";
export { StatisticsApi } from "./StatisticsApi/StatisticsApi";
export type { ClassAverageScoreDto } from "./StatisticsApi/StatisticsApi";
export type { StudentResponseDto } from "./StatisticsApi/StatisticsApi";

export { DuelApi } from "./DuelApi/Duel";
