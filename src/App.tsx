import { useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";
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
import TopicList from "./pages/TopicList/TopicList";
import { PublicOnlyOutlet } from "./auth/PublicOnly";
import MyPagePage from "./pages/MypagePage/MyPagePage";
import QuizStatsPage from "./pages/teacherQuizStatistics/teacherQuizStatistics";
import RoleRoute from "./auth/RoleRoute";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import TeacherQuizÄmne from "./pages/TeacherQuizÄmne/TeacherQuizÄmne";
import WsLab from "./pages/WsLab/WsLab";
import { AuthApi } from "./Api";


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

// bjud in toast
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
          {subject ? <> till en duell i <b>{subject}</b></> : null}
          {typeof bestOf === "number" ? <> • Bäst av {bestOf}</> : null}
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
  const wsRef = useRef<WebSocket | null>(null);
  const [toast, setToast] = useState<InviteToastData | null>(null);

  // Öppna en websocket för inbjudna användaren och skicka en notis
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
              bestOf: typeof msg.payload.bestOf === "number" ? msg.payload.bestOf : undefined,
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

      {/* Global toast notifikation */}
      <InviteToast data={toast} onClose={() => setToast(null)} />
    </div>
  );
}


export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>

        <Route path="quizzes/:quizId/questions" element={<QuizPage />} />
        <Route path="quizzes/start" element={<QuizPage />} />

        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="/socket-lab" element={<WsLab />} />

        <Route path="class/join/:joinCode" element={<JoinClassPage />} />
        <Route path="duel" element={<DuelRoom />} />

        <Route path="skapa-quiz" element={<SkapaQuizPage />} />
        <Route path="klassvy" element={<TeacherKlassVy />} />

        <Route path="mypage" element={<MyPagePage />} />
        <Route path="teachertopic" element={<TeacherQuizÄmne />} />
        <Route path="Api-test" element={<ApiPlayground />} />

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
          <Route path="duel/:duelId" element={<DuelRoom />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
