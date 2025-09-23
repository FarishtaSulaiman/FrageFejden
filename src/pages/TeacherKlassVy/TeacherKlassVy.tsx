//importerar React och funktioner för state, effekter och navigation
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// hämtar en standard-avatar-bild
import avatar from "../../assets/images/avatar/default-avatar.png";
// hämtar API:er
import { AuthApi, MeResp } from "../../Api/AuthApi/auth";
import { TeacherClasses, SubjectsApi, SubjectDto } from "../../Api";

// typdefinition för en användare (elev eller lärare)
type User = {
  id: string;
  fullName: string;
  userName?: string;
  level?: number;
  avgScore?: number;
};

// typdefinition för ett quiz
type Quiz = {
  id: string;
  title: string;
  questions: number;
};

// typdefinition för en klass
type ClassStat = {
  id: string;
  name?: string;
  students: number;
  users: User[];
  quizzes: Quiz[];
  joinCode?: string; 
};

// hårdkodade citat från förebilder inom matematik, vetenskap och litteratur
const quotes = [
  "Matematik är språkets poesi. – Galileo Galilei",
  "Vetenskap är organiserad kunskap. – Herbert Spencer",
  "Allt som är värdefullt kräver arbete. – Isaac Newton",
  "Fantasin är viktigare än kunskap. – Albert Einstein",
];

const TeacherKlassVy: React.FC = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<MeResp | null>(null); // den inloggade läraren
  const [classes, setClasses] = useState<ClassStat[]>([]); // alla klasser
  const [className, setClassName] = useState<string>(""); // vilken klass som är vald
  const [subjects, setSubjects] = useState<SubjectDto[]>([]); // ämnen i klassen
  const [loading, setLoading] = useState<boolean>(false); // laddar eller ej
  const [error, setError] = useState<string | null>(null); // felmeddelande
  const [fade, setFade] = useState(true); // true = synligt, false = fade out

  const [deleteUser, setDeleteUser] = useState<User | null>(null); // vilken elev ska raderas
  const [deleteQuiz, setDeleteQuiz] = useState<Quiz | null>(null); // vilket quiz ska raderas

  // state för att hålla index på nuvarande citat
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 👇 nytt state för toast
  const [copied, setCopied] = useState(false);

  // hitta den aktuella klassen (utifrån valt namn/id)
  const current = useMemo(
    () => classes.find((c) => c.id === className) ?? null,
    [className, classes]
  );

  // loopar citat var 5:e sekund
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // börja fade out

      // byt citat efter fade-out är klar
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true); // fade in
      }, 500); // fade-duration = 500ms
    }, 5000); // byt citat var 5:e sekund
    return () => clearInterval(interval);
  }, []);

  // körs en gång när sidan laddas
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const user = await AuthApi.getMe(); // hämta inloggad användare (läraren)
        setCurrentUser(user);

        const teacherClasses = await TeacherClasses.GetCreatedClasses(); // hämta alla klasser som läraren har skapat
        console.log("Created classes:", teacherClasses);

        // för varje klass, hämta eleverna och bygg upp statistiken
        const mappedClasses: ClassStat[] = await Promise.all(
          teacherClasses.map(async (c: any) => {
            const students = await TeacherClasses.GetClassStudents(c.id);
            return {
              id: c.id,
              name: c.name,
              joinCode: c.joinCode, //  hämta joinCode från API
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

        // välj första klassen automatiskt om det finns någon
        if (mappedClasses.length > 0) {
          setClassName(mappedClasses[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Kunde inte ladda data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // FIX: guard i loadSubjects för att förhindra loop
  useEffect(() => {
    if (!className) return; // om ingen klass vald, gör inget
    let cancelled = false;

    async function loadSubjects() {
      try {
        const subjectsForClass = await SubjectsApi.getForClass(className);
        if (!cancelled) {
          setSubjects(subjectsForClass);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [className]);

  // öppna modal för att ta bort en elev
  const openDeleteUserModal = (user: User) => setDeleteUser(user);

  // öppna modal för att ta bort ett quiz
  const openDeleteQuizModal = (quiz: Quiz) => setDeleteQuiz(quiz);

  // stäng alla modaler
  const closeModals = () => {
    setDeleteUser(null);
    setDeleteQuiz(null);
  };

  // bekräfta borttagning av elev
  const confirmDeleteUser = () => {
    if (deleteUser && current) {
      current.users = current.users.filter((u) => u.id !== deleteUser.id);
      current.students = current.users.length;
    }
    closeModals();
  };

  // bekräfta borttagning av quiz
  const confirmDeleteQuiz = () => {
    if (deleteQuiz && current) {
      current.quizzes = current.quizzes.filter((q) => q.id !== deleteQuiz.id);
    }
    closeModals();
  };

  //visa laddning eller felmeddelande om behövs
  if (loading) return <div>Laddar...</div>;
  if (error) return <div>{error}</div>;

  // fallback-vy om inga klasser finns
  if (!current) {
    return (
      <div className="h-screen bg-[#0A0F1F] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Välkommen, {currentUser?.fullName ?? "Lärare"}!
          </h2>
          <p className="text-white/60 mt-2">
            Du har inte skapat några klasser ännu.
          </p>
          <button
            onClick={() => navigate("/teachertopic")}
            className="mt-4 bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold"
          >
            Skapa din första klass
          </button>
        </div>
      </div>
    );
  }

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
            src={currentUser?.avatarUrl || avatar} // avatar är en default-avatar
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
              aria-label="SetClassName"
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
            onClick={() =>
              navigate("/teachertopic", { state: { classId: className } })
            }
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white font-semibold"
          >
            Skapa quiz till klass {current.name ?? current.id}
          </button>
        </div>

        {/* 🔑 join-kod-sektion */}
        <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
          <h3 className="text-lg font-bold mb-3">Dela joinkod till elever</h3>
          <p className="text-sm text-white/70 mb-2">
            Elever använder koden på startsidan för att registrera sig till rätt klass.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={current?.joinCode ?? ""}
              className="px-3 py-2 rounded-md bg-white text-black font-semibold w-48"
            />
            <button
              onClick={() => {
                if (current?.joinCode) {
                  navigator.clipboard.writeText(current.joinCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white font-semibold"
            >
              Kopiera kod
            </button>
          </div>
        </div>

        {/* statistikkort, elever + citat */}
        <div className="grid grid-cols-2 gap-4">
          {/* antal elever */}
          <StatCard
            label="Elever"
            value={current.students.toString()}
            sub="i klassen"
          />
          {/* inspirationscitat */}
          <StatCard
            label="Inspirationscitat"
            value={quotes[quoteIndex]}
            fade={fade}
          />
        </div>

        {/* huvudsektion */}
        <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
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
                        <div className="text-xs text-white/60"></div>
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

      {/* ✅ snygg toast istället för alert */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          ✅ Kod kopierad!
        </div>
      )}

      {/* modaler */}
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

// StatCard
function StatCard({
  label,
  value,
  sub,
  tone,
  fade = true,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "green" | "blue" | "yellow";
  fade?: boolean;
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
      <div
        className={`text-2xl font-extrabold mt-1 transition-opacity duration-500 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
    </div>
  );
}

export default TeacherKlassVy;
