// src/App.tsx
import { useEffect, useRef, useState } from "react";
import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";

import { ProtectedOutlet } from "./auth/Protected";
import { PublicOnlyOutlet } from "./auth/PublicOnly";

import RoleRoute from "./auth/RoleRoute";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage/HomePage";

// Admin
import AdminLandingPage from "./pages/AdminLandingPage/AdminLandingPage";
import AdminPage from "./pages/AdminPage/AdminPage";

// Shared / misc pages
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import TeacherQuizÄmne from "./pages/TeacherQuizÄmne/TeacherQuizÄmne";
import WsLab from "./pages/WsLab/WsLab";
import StudentDashboardPage from "./pages/studentDashboard/studentDashboard";
import QuizVyStudent from "./pages/QuizVyStudent/QuizVyStudent";
import TopicList from "./pages/TopicList/TopicList";
import QuizNivåVy from "./pages/QuizNivåVy/QuizNivåVy";
import TeacherKlassVy from "./pages/TeacherKlassVy/TeacherKlassVy";
import SkapaQuizPage from "./pages/SkapaQuizPage/SkapaQuizPage";
import QuizStatsPage from "./pages/teacherQuizStatistics/teacherQuizStatistics";
import ApiPlayground from "./pages/apiHealth/ApiTest";
import DuelRoom from "./pages/DuelPage/DuelRoom";
import JoinClassPage from "./pages/JoinClass/JoinClass";
import QuizPage from "./pages/QuizPage/QuizPage";

// API
import { AuthApi } from "./Api";

// ---------------- Invite toast + websocket support ----------------

type InviteToastData = {
  duelId: string;
  subject?: string;
  bestOf?: number;
  fromName?: string;
};

function getWsUrl(): string {
  const env = (import.meta as any)?.env?.VITE_DUEL_WS_URL as string | undefined;
  if (env) {
    if (env.startsWith("/")) {
      const scheme = location.protocol === "https:" ? "wss" : "ws";
      return `${scheme}://${location.host}${env}`;
    }
    return env;
  }
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${location.hostname}:3001`;
}

function InviteToast({
  data,
  onClose,
}: {
  data: InviteToastData | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (!data) return null;

  const { duelId, subject, bestOf, fromName } = data;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <div className="rounded-xl bg-[#0F1728] ring-1 ring-white/10 shadow-xl p-4 text-white">
        <div className="font-semibold">Du har blivit inbjuden!</div>
        <div className="mt-1 text-sm text-white/80">
          {fromName ? <b>{fromName}</b> : "En klasskamrat"} bjöd in dig
          {subject ? (
            <>
              {" "}till en duell i <b>{subject}</b>
            </>
          ) : null}
          {typeof bestOf === "number" ? (
            <>
              {" "}• Bäst av {bestOf}
            </>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold hover:brightness-110"
            onClick={() => {
              onClose();
              navigate(`/duel/${duelId}`);
            }}
          >
            Öppna duellen
          </button>
          <button
            className="h-9 rounded-lg bg-[#1C294A] px-3 text-sm font-semibold text-white/90 hover:brightness-110"
            onClick={onClose}
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const wsRef = useRef<WebSocket | null>(null);
  const [toast, setToast] = useState<InviteToastData | null>(null);

  // Open a websocket for the logged-in user and show an invite toast on INVITED
  useEffect(() => {
    let mounted = true;
    (async () => {
      let me: any = null;
      try {
        me = await AuthApi.getMe();
      } catch {
        me = null;
      }
      if (!mounted || !me?.id) return;

      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "HELLO_USER",
            user: { id: me.id, name: me.fullName || "User" },
          })
        );
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg?.type === "INVITED" && msg?.payload?.duelId) {
            setToast({
              duelId: String(msg.payload.duelId),
              subject: msg.payload.subject,
              bestOf:
                typeof msg.payload.bestOf === "number"
                  ? msg.payload.bestOf
                  : undefined,
              fromName: msg.payload.fromName,
            });
          }
        } catch { }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch { }
      };
    })();

    return () => {
      mounted = false;
      try {
        wsRef.current?.close(1000, "app unmount");
      } catch { }
      wsRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1F] text-white">
      <Navbar />
      <main className="flex-1 pt-[46px]">
        <Outlet />
      </main>
      <Footer />

      {/* Global toast notification */}
      <InviteToast data={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<PublicOnlyOutlet />}>
          <Route index element={<HomePage />} />
          <Route path="class/join/:joinCode" element={<JoinClassPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route path="admin" element={<AdminLandingPage />} />
          <Route path="admin/details" element={<AdminPage />} />
          <Route index element={<Navigate to="/admin" replace />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["student"]} />}>
          <Route path="studentDashboard" element={<StudentDashboardPage />} />
          <Route path="QuizVyStudent" element={<QuizVyStudent />} />
          <Route path="subjects/:subjectId/topics" element={<TopicList />} />
          <Route path="topics/:topicId" element={<QuizNivåVy />} />
          <Route index element={<Navigate to="/studentDashboard" replace />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["teacher"]} />}>
          <Route path="teacher/klassvy" element={<TeacherKlassVy />} />
          <Route path="skapa-quiz" element={<SkapaQuizPage />} />
          <Route path="teacherQuizStatistics" element={<QuizStatsPage />} />
          <Route path="teachertopic" element={<TeacherQuizÄmne />} />
          <Route index element={<Navigate to="/teacher/klassvy" replace />} />
        </Route>

        <Route element={<ProtectedOutlet />}>
          <Route path="Api-test" element={<ApiPlayground />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="duel/:duelId" element={<DuelRoom />} />
        </Route>

        <Route path="quizzes/:quizId/questions" element={<QuizPage />} />
        <Route path="quizzes/start" element={<QuizPage />} />


        <Route path="socket-lab" element={<WsLab />} />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
