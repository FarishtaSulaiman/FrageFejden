import { useState } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ProtectedOutlet } from "./auth/Protected";
import { useAuth } from "./auth/AuthContext";
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
import TeacherKlassVyDemo from "./pages/TeacherKlassVy/TeacherKlassVyDemo";
import DuelInvitePage from "./pages/DuelPage/DuelInvitePage";
import TopicList from "./pages/TopicList/TopicList";
import { PublicOnlyOutlet } from "./auth/PublicOnly";
import MyPagePage from "./pages/MypagePage/MyPagePage";
import QuizStatsPage from "./pages/teacherQuizStatistics/teacherQuizStatistics";
import RoleRoute from "./auth/RoleRoute"; 

function Home() {
  const [count, setCount] = useState(0);
  const { user, logout } = useAuth();

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Vite + React</h1>
      <p className="text-white/90">
        Logged in as: <b>{user?.userName ?? user?.email ?? user?.id}</b>
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:brightness-110"
        >
          count is {count}
        </button>
        <p className="mt-3 text-sm text-white/80">
          Edit <code className="rounded bg-black/30 px-1 py-0.5">src/App.tsx</code> and save to test HMR
        </p>
        <p className="mt-3">
          <button
            onClick={logout}
            className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </p>
      </div>
    </>
  );
}

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

        {/* QUIZ routes */}
        <Route path="quizzes/:quizId/questions" element={<QuizPage />} />
        <Route path="quizzes/start" element={<QuizPage />} /> {/* ⭐ NY RAD */}

        <Route path="quizDuel" element={<DuelRoom />} />
        <Route path="class/join/:joinCode" element={<JoinClassPage />} />
        <Route path="duel" element={<DuelRoom />} />
        <Route path="klassvy" element={<TeacherKlassVyDemo />} />
        <Route path="mypage" element={<MyPagePage />} />

        <Route element={<PublicOnlyOutlet />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Teacher-routes */}
        <Route element={<RoleRoute allowedRoles={["Lärare"]} />}>
          <Route path="skapa-quiz" element={<SkapaQuizPage />} />
          <Route path="teacher/klassvy" element={<TeacherKlassVy />} />
          <Route path="teacherQuizStatistics" element={<QuizStatsPage />} />
        </Route>

        {/* Student-routes */}
        <Route element={<RoleRoute allowedRoles={["Student"]} />}>
          <Route path="studentDashboard" element={<StudentDashboardPage />} />
          <Route path="QuizVyStudent" element={<QuizVyStudent />} />
          <Route path="subjects/:subjectId/topics" element={<TopicList />} />
          <Route path="topics/:topicId" element={<QuizNivåVy />} />
        </Route>

        {/* Admin-routes */}
        <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
          <Route path="app/current-user" element={<CurrentUser />} />
          <Route path="Api-test" element={<ApiPlayground />} />
        </Route>

        {/* Skyddade för alla inloggade */}
        <Route element={<ProtectedOutlet />}>
          <Route path="app" element={<Home />} />
          <Route path="duelinvite" element={<DuelInvitePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
