
import { useState } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Protected } from "./auth/Protected";
import { useAuth } from "./auth/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage/HomePage";
import QuizNivåVy from "./pages/QuizNivåVy/QuizNivåVy";
import QuizPage from "./pages/QuizPage/QuizPage";
import QuizVyStudent from "./pages/QuizVyStudent/QuizVyStudent";

function Home() {
  const [count, setCount] = useState(0);
  const { user, logout } = useAuth();
  return (
    <>
      <h1 className="text-2xl font-bold text-white">Vite + React</h1>
      <p className="text-white/90">
        Logged in as: <b>{user?.email ?? user?.id}</b>
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
        <Route index element={<HomePage />} />
        <Route path="quizniva" element={<QuizNivåVy />} />
        <Route path="kurs/geografi" element={<QuizNivåVy />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="QuizVyStudent" element={<QuizVyStudent />} />
        <Route
          path="app"
          element={
            <Protected>
              <Home />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
