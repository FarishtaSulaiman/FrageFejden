import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import avatar1 from "../../assets/images/avatar/avatar1.png";

type User = {
  name: string;
  username: string;
  level?: number;
  avgScore?: number;
};

type Quiz = {
  id: string;
  title: string;
  questions: number;
};

type SubjectStat = {
  name: string;
  unitsRead: number;
  unitsTotal: number;
  avgScore: number;
};

type ClassStat = {
  id: string;
  students: number;
  avgScore: number;
  readingCompliance: number;
  quizzesThisWeek: number;
  levelAvg: number;
  weeklyActivity: number[];
  streakDays: number;
  subjects: SubjectStat[];
  topStudents: User[];
  users: User[];
  quizzes: Quiz[];
};

type Activity = {
  time: string;
  klass: string;
  message: string;
  badge?: string;
};

const ALL_CLASSES: ClassStat[] = [
  {
    id: "8A",
    students: 5,
    avgScore: 74,
    readingCompliance: 81,
    quizzesThisWeek: 4,
    levelAvg: 2.9,
    weeklyActivity: [2, 5, 3, 6, 4, 2, 1],
    streakDays: 6,
    subjects: [
      { name: "Svenska", unitsRead: 19, unitsTotal: 24, avgScore: 76 },
      { name: "Engelska", unitsRead: 17, unitsTotal: 24, avgScore: 72 },
    ],
    topStudents: [
      { name: "Sara Olsson", username: "sara_o", level: 4, avgScore: 88 },
      { name: "Lukas Berg", username: "l_berg", level: 3, avgScore: 84 },
    ],
    users: [
      { name: "Sara Olsson", username: "sara_o", level: 4, avgScore: 88 },
      { name: "Lukas Berg", username: "l_berg", level: 3, avgScore: 84 },
      { name: "Mei Chen", username: "mei_chen", level: 4, avgScore: 83 },
      { name: "Ali Hassan", username: "ali_h", level: 3, avgScore: 80 },
      { name: "Nils Ek", username: "nils_ek", level: 2, avgScore: 76 },
    ],
    quizzes: [
      { id: "q1", title: "Svenska Kungahuset", questions: 5 },
      { id: "q2", title: "Engelska Veckans ord", questions: 6 },
    ],
  },
  {
    id: "8C",
    students: 6,
    avgScore: 81,
    readingCompliance: 88,
    quizzesThisWeek: 6,
    levelAvg: 3.2,
    weeklyActivity: [4, 7, 3, 6, 6, 4, 3],
    streakDays: 13,
    subjects: [
      { name: "Svenska", unitsRead: 21, unitsTotal: 24, avgScore: 83 },
      { name: "Engelska", unitsRead: 19, unitsTotal: 24, avgScore: 80 },
    ],
    topStudents: [
      { name: "Lina Larsson", username: "Lina4ever", level: 4, avgScore: 90 },
      { name: "Kalle Svensson", username: "Kokokalle", level: 3, avgScore: 85 },
    ],
    users: [
      { name: "Lina Larsson", username: "Lina4ever", level: 4, avgScore: 90 },
      { name: "Kalle Svensson", username: "Kokokalle", level: 3, avgScore: 85 },
      { name: "Amina Ali", username: "amina", level: 3, avgScore: 82 },
      { name: "Oskar Lund", username: "oskarl", level: 3, avgScore: 81 },
      { name: "Sofia Nguyen", username: "sofiann", level: 3, avgScore: 83 },
      { name: "Hanna Persson", username: "hannap", level: 4, avgScore: 91 },
    ],
    quizzes: [
      { id: "q3", title: "Svenska Grammatik", questions: 7 },
      { id: "q4", title: "Engelska Grammatik", questions: 8 },
    ],
  },
  {
    id: "9B",
    students: 4,
    avgScore: 79,
    readingCompliance: 87,
    quizzesThisWeek: 5,
    levelAvg: 3.2,
    weeklyActivity: [3, 5, 4, 5, 6, 3, 2],
    streakDays: 8,
    subjects: [
      { name: "Svenska", unitsRead: 20, unitsTotal: 24, avgScore: 81 },
      { name: "Engelska", unitsRead: 19, unitsTotal: 24, avgScore: 80 },
    ],
    topStudents: [
      { name: "Jonas Pettersson", username: "jonas_p", level: 3, avgScore: 87 },
      { name: "Leah Ahmad", username: "leah", level: 3, avgScore: 84 },
    ],
    users: [
      { name: "Jonas Pettersson", username: "jonas_p", level: 3, avgScore: 87 },
      { name: "Leah Ahmad", username: "leah", level: 3, avgScore: 84 },
      { name: "Victor Yi", username: "victory", level: 3, avgScore: 84 },
      { name: "Ali Hassan", username: "ali_h", level: 3, avgScore: 80 },
    ],
    quizzes: [
      { id: "q5", title: "Svenska Litteratur", questions: 5 },
      { id: "q6", title: "Engelska Glosor", questions: 6 },
    ],
  },
];

const RECENT_ACTIVITY: Activity[] = [
  {
    time: "Idag 10:24",
    klass: "8C",
    message: "Lina slutförde läsnivå 3 i Svenska 📘",
    badge: "+10 XP",
  },
  {
    time: "Idag 09:55",
    klass: "9B",
    message: "Leah fick 9/10 på NO-quiz 🧪",
    badge: "+1 nivå",
  },
  {
    time: "Igår 16:12",
    klass: "8A",
    message: "Mei höjde snitt till 83%",
    badge: "⭐",
  },
  {
    time: "Igår 12:03",
    klass: "8C",
    message: "Ali klarade Eng. Unit 5",
    badge: "+8 XP",
  },
];

const TeacherKlassVy: React.FC = () => {
  const navigate = useNavigate();
  const [className, setClassName] = useState("8C");
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);

  const current = useMemo(
    () => ALL_CLASSES.find((c) => c.id === className) ?? ALL_CLASSES[0],
    [className]
  );

  const openDeleteUserModal = (user: User) => setDeleteUser(user);
  const openDeleteQuizModal = (quiz: Quiz) => setDeleteQuiz(quiz);
  const closeModals = () => {
    setDeleteUser(null);
    setDeleteQuiz(null);
  };
  const confirmDeleteUser = () => {
    if (deleteUser) {
      current.users = current.users.filter(
        (u) => u.username !== deleteUser.username
      );
      current.students = current.users.length;
    }
    closeModals();
  };
  const confirmDeleteQuiz = () => {
    if (deleteQuiz) {
      current.quizzes = current.quizzes.filter((q) => q.id !== deleteQuiz.id);
    }
    closeModals();
  };

  return (
    <div className="h-screen bg-[#0A0F1F] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight text-yellow-400">
            FRÅGEFEJDEN
          </span>
          <span className="text-white/60 text-sm">Lärarvy</span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={avatar1}
            className="w-9 h-9 rounded-full ring-1 ring-white/20"
            alt="Admin"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col gap-6 px-6 py-4 min-h-0">
        {/* Klassval + Skapa quiz */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70">Välj klass</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="px-4 py-2 rounded-md bg-white text-black font-semibold"
            >
              {ALL_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate("/teachertopic")}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold"
          >
            Skapa quiz
          </button>
        </div>

        {/* Statistikkort */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Elever"
            value={current.students.toString()}
            sub="i klassen"
          />
          <StatCard
            label="Snittresultat"
            value={`${current.avgScore}%`}
            tone="blue"
            sub="senaste 30 dagar"
          />
          <StatCard
            label="Läsning klar"
            value={`${current.readingCompliance}%`}
            tone="green"
            sub="före quiz"
          />
          <StatCard
            label="Quiz denna vecka"
            value={`${current.quizzesThisWeek}`}
            tone="yellow"
            sub="planerade/genomförda"
          />
        </div>

        {/* Huvudsektion */}
        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col gap-6 overflow-auto">
            {/* Topp-elever */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Topp-elever</h3>
              <ul className="space-y-3">
                {current.topStudents.map((s, i) => (
                  <li
                    key={s.username}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{s.name}</div>
                        <div className="text-xs text-white/60 truncate">
                          @{s.username}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/60">Level</div>
                      <div className="font-semibold">{s.level ?? "-"}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/60">Snitt</div>
                      <div className="font-semibold">{s.avgScore ?? "-"}%</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Senaste händelser */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Senaste händelser</h3>
              <ul className="space-y-3">
                {RECENT_ACTIVITY.map((a, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-3 ring-1 ring-white/10"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{a.message}</div>
                      <div className="text-xs text-white/60">
                        {a.time} • {a.klass}
                      </div>
                    </div>
                    {a.badge && (
                      <span className="text-xs bg-white/10 px-2 py-1 rounded shrink-0">
                        {a.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 overflow-auto">
            {/* Elevlista */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Elever – {current.id}</h3>
              <ul className="divide-y divide-white/10">
                {current.users.map((u) => (
                  <li
                    key={u.username}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
                        {u.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-white/60">
                          @{u.username}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => openDeleteUserModal(u)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Ta bort
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quizlista */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Quiz – {current.id}</h3>
              <ul className="divide-y divide-white/10">
                {current.quizzes.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between p-2"
                  >
                    <div>
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-xs text-white/60">
                        {q.questions} frågor
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate("/skapa-quiz", { state: { quiz: q } })
                        }
                        className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => openDeleteQuizModal(q)}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                      >
                        Ta bort
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modaler */}
      {(deleteUser || deleteQuiz) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-2">
              {deleteUser
                ? "Bekräfta borttagning av elev"
                : "Bekräfta borttagning av quiz"}
            </h3>
            <p className="text-sm text-black/70 mb-6">
              Är du säker på att du vill{" "}
              {deleteUser ? "ta bort eleven" : "ta bort quizet"}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModals}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Avbryt
              </button>
              <button
                onClick={deleteUser ? confirmDeleteUser : confirmDeleteQuiz}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard component
function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "green" | "blue" | "yellow";
}) {
  const toneClass =
    tone === "green"
      ? "from-emerald-500/20 to-emerald-500/0"
      : tone === "blue"
      ? "from-sky-500/20 to-sky-500/0"
      : tone === "yellow"
      ? "from-yellow-500/20 to-yellow-500/0"
      : "from-white/15 to-white/0";

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 ring-1 ring-white/10 bg-white/5">
      <div
        className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${toneClass}`}
      />
      <div className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
      {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
    </div>
  );
}

export default TeacherKlassVy;
