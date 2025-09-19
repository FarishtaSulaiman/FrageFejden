// src/App.tsx
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ProtectedOutlet } from "./auth/Protected";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage/HomePage";
import QuizNivåVy from "./pages/QuizNivåVy/QuizNivåVy";
import QuizPage from "./pages/QuizPage/QuizPage";
import QuizVyStudent from "./pages/QuizVyStudent/QuizVyStudent";
import StudentDashboardPage from "./pages/studentDashboard/studentDashboard";
import CurrentUser from "./pages/apiHealth/CurrentUser";
import ApiPlayground from "./pages/apiHealth/ApiTest";
import DuelRoom from "./pages/DuelPage/DuelRoom";
import JoinClassPage from "./pages/JoinClass/JoinClass";
import SkapaQuizPage from "./pages/SkapaQuizPage/SkapaQuizPage";
import TeacherKlassVy from "./pages/TeacherKlassVy/TeacherKlassVy";
import TopicList from "./pages/TopicList/TopicList";
import { PublicOnlyOutlet } from "./auth/PublicOnly";
import MyPagePage from "./pages/MypagePage/MyPagePage";
import QuizStatsPage from "./pages/teacherQuizStatistics/teacherQuizStatistics";
import RoleRoute from "./auth/RoleRoute";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import TeacherQuizÄmne from "./pages/TeacherQuizÄmne/TeacherQuizÄmne";
import WsLab from "./pages/WsLab/WsLab";

// ✅ Admin pages
import AdminLandingPage from "./pages/AdminLandingPage/AdminLandingPage";
import AdminPage from "./pages/AdminPage/AdminPage";

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1F] text-white">
      <Navbar />
      <main className="flex-1 pt-[46px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Publik */}
        <Route element={<PublicOnlyOutlet />}>
          <Route index element={<HomePage />} />
        </Route>



        {/* Admin */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          {/* Landingpage för admin */}
          <Route path="admin" element={<AdminLandingPage />} />
          <Route path="admin/details" element={<AdminPage />} />
          <Route index element={<Navigate to="/admin" replace />} />
          
        </Route>

        {/* Student */}
        <Route element={<RoleRoute allowedRoles={["student"]} />}>
          <Route path="studentDashboard" element={<StudentDashboardPage />} />
          <Route path="QuizVyStudent" element={<QuizVyStudent />} />
          <Route path="subjects/:subjectId/topics" element={<TopicList />} />
          <Route path="topics/:topicId" element={<QuizNivåVy />} />
          <Route index element={<Navigate to="/studentDashboard" replace />} />
        </Route>

     {/* Teacher */}
<Route element={<RoleRoute allowedRoles={["teacher"]} />}>
  <Route path="teacher/klassvy" element={<TeacherKlassVy />} />
  <Route path="skapa-quiz" element={<SkapaQuizPage />} />
  <Route path="teacherQuizStatistics" element={<QuizStatsPage />} />
  <Route path="teachertopic" element={<TeacherQuizÄmne />} />
  <Route index element={<Navigate to="/teacher/klassvy" replace />} />
</Route>


        {/* Gemensamt skyddat */}
        <Route element={<ProtectedOutlet />}>
          <Route path="app/current-user" element={<CurrentUser />} />
          <Route path="Api-test" element={<ApiPlayground />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="duel/:duelId" element={<DuelRoom />} />
          <Route path="class/join/:joinCode" element={<JoinClassPage />} />
        </Route>

        {/* Quiz routes (öppna för alla inloggade) */}
        <Route path="quizzes/:quizId/questions" element={<QuizPage />} />
        <Route path="quizzes/start" element={<QuizPage />} />

        {/* Websocket-lab */}
        <Route path="socket-lab" element={<WsLab />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
