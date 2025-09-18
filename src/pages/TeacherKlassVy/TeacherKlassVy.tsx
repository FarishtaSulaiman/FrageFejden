import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import avatar from "../../assets/images/avatar/default-avatar.png";
import { AuthApi, MeResp } from "../../Api/AuthApi/auth";
import { TeacherClasses, SubjectsApi, SubjectDto } from "../../Api";

// typdefinition för användare
type User = {
  id: string;
  fullName: string;
  userName: string;
  level?: number;
  avgScore?: number;
};

//typdefinition för ett quiz
type Quiz = {
  id: string;
  title: string;
  questions: number;
};

//typdefinition för en klass med statistik
type ClassStat = {
  id: string;
  name?: string;
  students: number;
  avgScore: number;
  readingCompliance: number;
  quizzesThisWeek: number;
  levelAvg: number;
  weeklyActivity: number[];
  streakDays: number;
  subjects: SubjectDto[];
  topStudents: User[];
  users: User[];
  quizzes: Quiz[];
};

//typdefinition för en aktivitet
type Activity = {
  time: string;
  klass: string;
  message: string;
  badge?: string;
};

const TeacherKlassVy: React.FC = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<MeResp | null>(null);
  const [classes, setClasses] = useState<ClassStat[]>([]);
  const [className, setClassName] = useState<string>("");
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null);

  const current = useMemo(
    () => classes.find((c) => c.id === className) ?? classes[0] ?? null,
    [className, classes]
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = await AuthApi.getMe();
        setCurrentUser(user);

        const teacherClasses = await TeacherClasses.GetCreatedClasses();
        console.log("Created classes:", teacherClasses);

        // Hämta elever för varje klass
        const mappedClasses: ClassStat[] = await Promise.all(
          teacherClasses.map(async (c: any) => {
            const students = await TeacherClasses.GetClassStudents(c.id);

            return {
              id: c.id,
              name: c.name,
              students: students.length,
              avgScore: c.avgScore ?? 0,
              readingCompliance: c.readingCompliance ?? 0,
              quizzesThisWeek: c.quizzesThisWeek ?? 0,
              levelAvg: c.levelAvg ?? 0,
              weeklyActivity: c.weeklyActivity ?? [],
              streakDays: c.streakDays ?? 0,
              subjects: [],
              topStudents: c.topStudents ?? [],
              users: students,
              quizzes: c.quizzes ?? [],
            };
          })
        );

        setClasses(mappedClasses);
        setClassName(mappedClasses[0]?.id ?? "");
      } catch (err) {
        console.error(err);
        setError("Kunde inte ladda data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      if (!className) return;
      try {
        const subjectsForClass = await SubjectsApi.getForClass(className);
        setSubjects(subjectsForClass);
      } catch (err) {
        console.error(err);
      }
    }

    loadSubjects();
  }, [className]);

  //öppna modal för att ta bort en elev
  const openDeleteUserModal = (user: User) => setDeleteUser(user);

  //öppna modal för att ta bort ett quiz
  const openDeleteQuizModal = (quiz: Quiz) => setDeleteQuiz(quiz);

  //stäng alla modaler
  const closeModals = () => {
    setDeleteUser(null);
    setDeleteQuiz(null);
  };

  //bekräfta borttagning av elev
  const confirmDeleteUser = () => {
    if (deleteUser && current) {
      current.users = current.users.filter((u) => u.id !== deleteUser.id);
      current.students = current.users.length;
    }
    closeModals();
  };

  //bekräfta borttagning av quiz
  const confirmDeleteQuiz = () => {
    if (deleteQuiz && current) {
      current.quizzes = current.quizzes.filter((q) => q.id !== deleteQuiz.id);
    }
    closeModals();
  };

  //visa laddning eller felmeddelande om behövs
  if (loading) return <div>Laddar...</div>;
  if (error) return <div>{error}</div>;
  if (!current) return <div>Ingen klass vald</div>;

  return (
    <div className="h-screen bg-[#0A0F1F] text-white flex flex-col">
      {/* header med titel och avatar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight text-yellow-400">
            FRÅGEFEJDEN
          </span>
          <span className="text-white/60 text-sm">Lärarvy</span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src={currentUser?.avatarUrl ?? avatar}
            className="w-9 h-9 rounded-full ring-1 ring-white/20"
            alt="Avatar"
          />
        </div>
      </header>

      {/* huvudområde */}
      <main className="flex-1 flex flex-col gap-6 px-6 py-4 min-h-0">
        {/* välj klass och knapp för nytt quiz */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm text-white/70">Välj klass</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="px-4 py-2 rounded-md bg-white text-black font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id}
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

        {/* statistikkort */}
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

        {/* huvudsektion med topp-elever, aktivitet, elevlista och quizlista */}
        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          {/* topp-elever och senaste händelser */}
          <div className="flex-1 flex flex-col gap-6 overflow-auto">
            {/* topp-elever */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Topp-elever</h3>
              <ul className="space-y-3">
                {current.topStudents.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-3 ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {s.fullName}
                        </div>
                        <div className="text-xs text-white/60 truncate">
                          @{s.userName}
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

            {/* senaste händelser */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">Senaste händelser</h3>
              <ul className="space-y-3">
                {recentActivity.map((a, idx) => (
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

          {/* elevlista och quizlista */}
          <div className="flex-1 flex flex-col gap-6 overflow-auto">
            {/* elevlista */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">
                Elever – {current.name ?? current.id}
              </h3>
              <ul className="divide-y divide-white/10">
                {current.users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
                        {u.fullName
                          .split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{u.fullName}</div>
                        <div className="text-xs text-white/60">
                          @{u.userName}
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

            {/* quizlista */}
            <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10 overflow-auto max-h-80">
              <h3 className="text-lg font-bold mb-4">
                Quiz – {current.name ?? current.id}
              </h3>
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

      {/* modaler för borttagning */}
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

// StatCard component - visar ett litet statistikkort
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
