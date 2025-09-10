import React, { useMemo, useState } from "react";
import avatar1 from "../../assets/images/avatar/avatar1.png";

type User = { name: string; username: string; level?: number; avgScore?: number };
type SubjectStat = { name: string; unitsRead: number; unitsTotal: number; avgScore: number };
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
};
type Activity = { time: string; klass: string; message: string; badge?: string };

const ALL_CLASSES: ClassStat[] = [
    {
        id: "8A",
        students: 23,
        avgScore: 74,
        readingCompliance: 81,
        quizzesThisWeek: 4,
        levelAvg: 2.9,
        weeklyActivity: [2, 5, 3, 6, 4, 2, 1],
        streakDays: 6,
        subjects: [
            { name: "Svenska", unitsRead: 19, unitsTotal: 24, avgScore: 76 },
            { name: "Engelska", unitsRead: 17, unitsTotal: 24, avgScore: 72 },
            { name: "NO", unitsRead: 15, unitsTotal: 24, avgScore: 78 },
            { name: "SO", unitsRead: 16, unitsTotal: 24, avgScore: 71 },
        ],
        topStudents: [
            { name: "Sara Olsson", username: "sara_o", level: 4, avgScore: 88 },
            { name: "Lukas Berg", username: "l_berg", level: 3, avgScore: 84 },
            { name: "Mei Chen", username: "mei_chen", level: 4, avgScore: 83 },
        ],
    },
    {
        id: "8C",
        students: 22,
        avgScore: 81,
        readingCompliance: 88,
        quizzesThisWeek: 6,
        levelAvg: 3.2,
        weeklyActivity: [4, 7, 3, 6, 6, 4, 3],
        streakDays: 13,
        subjects: [
            { name: "Svenska", unitsRead: 21, unitsTotal: 24, avgScore: 83 },
            { name: "Engelska", unitsRead: 19, unitsTotal: 24, avgScore: 80 },
            { name: "NO", unitsRead: 18, unitsTotal: 24, avgScore: 82 },
            { name: "SO", unitsRead: 17, unitsTotal: 24, avgScore: 79 },
        ],
        topStudents: [
            { name: "Lina Larsson", username: "Lina4ever", level: 4, avgScore: 90 },
            { name: "Kalle Svensson", username: "Kokokalle", level: 3, avgScore: 85 },
            { name: "Ali Hassan", username: "ali_h", level: 3, avgScore: 84 },
        ],
    },
    {
        id: "9B",
        students: 24,
        avgScore: 79,
        readingCompliance: 87,
        quizzesThisWeek: 5,
        levelAvg: 3.2,
        weeklyActivity: [3, 5, 4, 5, 6, 3, 2],
        streakDays: 8,
        subjects: [
            { name: "Svenska", unitsRead: 20, unitsTotal: 24, avgScore: 81 },
            { name: "Engelska", unitsRead: 19, unitsTotal: 24, avgScore: 80 },
            { name: "NO", unitsRead: 17, unitsTotal: 24, avgScore: 78 },
            { name: "SO", unitsRead: 18, unitsTotal: 24, avgScore: 79 },
        ],
        topStudents: [
            { name: "Jonas Pettersson", username: "jonas_p", level: 3, avgScore: 87 },
            { name: "Leah Ahmad", username: "leah", level: 3, avgScore: 84 },
            { name: "Victor Yi", username: "victory", level: 3, avgScore: 84 },
        ],
    },
];

const RECENT_ACTIVITY: Activity[] = [
    { time: "Idag 10:24", klass: "8C", message: "Lina slutförde läsnivå 3 i Svenska 📘", badge: "+10 XP" },
    { time: "Idag 09:55", klass: "9B", message: "Leah fick 9/10 på NO-quiz 🧪", badge: "+1 nivå" },
    { time: "Igår 16:12", klass: "8A", message: "Mei höjde snitt till 83%", badge: "⭐" },
    { time: "Igår 12:03", klass: "8C", message: "Ali klarade Eng. Unit 5", badge: "+8 XP" },
];

const TeacherKlassVyDemo: React.FC = () => {
    const [className, setClassName] = useState("8C");
    const [users, setUsers] = useState<User[]>([
        { name: "Lina Larsson", username: "Lina4ever", level: 4, avgScore: 90 },
        { name: "Kalle Svensson", username: "Kokokalle", level: 3, avgScore: 85 },
        { name: "Amina Ali", username: "amina", level: 3, avgScore: 82 },
        { name: "Oskar Lund", username: "oskarl", level: 3, avgScore: 81 },
        { name: "Sofia Nguyen", username: "sofiann", level: 3, avgScore: 83 },
        { name: "Nils Ek", username: "nils_ek", level: 2, avgScore: 76 },
        { name: "Hanna Persson", username: "hannap", level: 4, avgScore: 91 },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const openModal = (u: string) => { setUserToDelete(u); setShowModal(true); };
    const closeModal = () => { setUserToDelete(null); setShowModal(false); };
    const confirmDelete = () => { if (userToDelete) setUsers(p => p.filter(u => u.username !== userToDelete)); closeModal(); };

    const current = useMemo(
        () => ALL_CLASSES.find(c => c.id === className) ?? ALL_CLASSES[0],
        [className]
    );

    const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
    const progress = (v: number) => ({ width: `${Math.max(0, Math.min(100, v))}%` });

    return (
        <div className="h-screen bg-[#0A0F1F] text-white flex flex-col">
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold tracking-tight text-yellow-400">FRÅGEFEJDEN</span>
                    <span className="text-white/60 text-sm">Lärarvy • Demo</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">Admin</span>
                    <img src={avatar1} className="w-9 h-9 rounded-full ring-1 ring-white/20" alt="Admin" />
                </div>
            </header>

            <main className="flex-1 min-h-0 overflow-hidden w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-white/70">Välj klass</label>
                        <select
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="px-4 py-2 rounded-md bg-white text-black font-semibold"
                        >
                            {ALL_CLASSES.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                        </select>
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap gap-3">
                        <button className="rounded-xl bg-[#22C55E] px-4 py-2 text-[14px] font-semibold text-white hover:brightness-110">Skapa Quiz</button>
                        <button className="rounded-xl bg-[#4F2ACB] px-4 py-2 text-[14px] font-semibold text-white/95 hover:brightness-110">Lägg till ämne</button>
                        <button className="rounded-xl bg-white/10 px-4 py-2 text-[14px] font-semibold text-white hover:bg-white/15">Exportera rapport</button>
                    </div>
                </div>


                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    <StatCard label="Elever" value={current.students.toString()} sub="i klassen" />
                    <StatCard label="Snittresultat" value={`${current.avgScore}%`} tone="blue" sub="senaste 30 dagar" />
                    <StatCard label="Läsning klar" value={`${current.readingCompliance}%`} tone="green" sub="före quiz" />
                    <StatCard label="Quiz denna vecka" value={`${current.quizzesThisWeek}`} tone="yellow" sub="planerade/genomförda" />
                </section>


                <section className="grid gap-6 xl:grid-cols-4 xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] flex-1 min-h-0">

                    <div className="xl:col-span-2 xl:row-span-3 bg-white/5 rounded-2xl p-5 ring-1 ring-white/10 h-full overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Ämnesöversikt – {current.id}</h3>
                            <span className="text-xs text-white/60">Level-snitt: {current.levelAvg.toFixed(1)}</span>
                        </div>
                        <div className="space-y-4">
                            {current.subjects.map((s) => {
                                const readPct = pct(s.unitsRead, s.unitsTotal);
                                return (
                                    <div key={s.name} className="bg-white/5 rounded-xl p-4 ring-1 ring-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">{s.name}</div>
                                            <div className="text-sm text-white/70">Snitt: {s.avgScore}%</div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between text-xs text-white/60">
                                                <span>Läsning</span>
                                                <span>{s.unitsRead}/{s.unitsTotal} • {readPct}%</span>
                                            </div>
                                            <div className="h-2 mt-1 bg-white/10 rounded">
                                                <div className="h-2 bg-[#22C55E] rounded" style={progress(readPct)} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    <div className="xl:col-start-3 xl:row-start-1 bg-white/5 rounded-2xl p-5 ring-1 ring-white/10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <h3 className="text-lg font-bold">Topp-elever</h3>
                            <span className="text-xs text-white/60">Senaste 30 dagar</span>
                        </div>
                        <ul className="space-y-3 overflow-auto flex-1 pr-1">
                            {current.topStudents.map((s, i) => (
                                <li key={s.username} className="flex items-center justify-between bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">{i + 1}</div>
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate">{s.name}</div>
                                            <div className="text-xs text-white/60 truncate">@{s.username}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-white/60">Level</div>
                                        <div className="font-semibold">{s.level ?? "-"}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-white/60">Snitt</div>
                                        <div className="font-semibold">{s.avgScore ?? "-"}%</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>


                    <div className="xl:col-start-3 xl:row-start-2 xl:row-span-2 bg-white/5 rounded-2xl p-5 ring-1 ring-white/10 h-full  flex flex-col">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="text-lg font-bold">Senaste händelser</h3>
                            <span className="text-xs text-white/60">Alla klasser</span>
                        </div>
                        <ul className="space-y-3 overflow-auto flex-1 pr-1">
                            {RECENT_ACTIVITY.map((a, idx) => (
                                <li key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3 ring-1 ring-white/10">
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{a.message}</div>
                                        <div className="text-xs text-white/60">{a.time} • {a.klass}</div>
                                    </div>
                                    {a.badge && <span className="text-xs bg-white/10 px-2 py-1 rounded shrink-0">{a.badge}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>


                    <div className="xl:col-start-4 xl:row-span-3 bg-white/5 rounded-2xl p-5 ring-1 ring-white/10 flex flex-col h-full min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Elever – {current.id}</h3>
                            <div className="text-xs text-white/60">{users.length} elever</div>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-white/10 flex-1 min-h-0">
                            <div className="grid grid-cols-[1.5fr_1fr_0.6fr_0.8fr] bg-white/5 px-3 py-2 text-xs font-bold sticky top-0">
                                <div>Namn</div>
                                <div>Användarnamn</div>
                                <div className="text-center">Level</div>
                                <div className="text-center">Ta bort</div>
                            </div>
                            <div className="divide-y divide-white/10 max-h-full overflow-auto">
                                {users.map((u) => (
                                    <div key={u.username} className="grid grid-cols-[1.5fr_1fr_0.6fr_0.8fr] items-center px-3 py-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px]">
                                                {u.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="truncate">{u.name}</span>
                                        </div>
                                        <div className="text-white/80 truncate">@{u.username}</div>
                                        <div className="text-center">{u.level ?? "-"}</div>
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => openModal(u.username)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                            >
                                                Ta bort
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>


            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50">
                    <div className="bg-white text-black rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold mb-2">Bekräfta borttagning</h3>
                        <p className="text-sm text-black/70 mb-6">Är du säker på att du vill ta bort eleven?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100">Avbryt</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Ta bort</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


function StatCard({ label, value, sub, tone }: {
    label: string; value: string; sub?: string; tone?: "green" | "blue" | "yellow"
}) {
    const toneClass =
        tone === "green" ? "from-emerald-500/20 to-emerald-500/0"
            : tone === "blue" ? "from-sky-500/20 to-sky-500/0"
                : tone === "yellow" ? "from-yellow-500/20 to-yellow-500/0"
                    : "from-white/15 to-white/0";
    return (
        <div className="relative overflow-hidden rounded-2xl p-4 ring-1 ring-white/10 bg-white/5">
            <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${toneClass}`} />
            <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
            <div className="text-2xl font-extrabold mt-1">{value}</div>
            {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
        </div>
    );
}

export default TeacherKlassVyDemo;
