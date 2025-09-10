import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    DuelApi,
    DuelDto,
    DuelInvitationDto,
    DuelStatsDto,
    SubjectDto,
    LevelDto,
    ClassmateDto,
    UUID,
} from "../../Api/DuelApi/Duel";


const initials = (name: string) =>
    name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

const timeAgo = (iso?: string | null) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just nu";
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    return `${d} d`;
};


type Props = {
    subjects: SubjectDto[];
    levelsBySubject?: Record<string, LevelDto[]>;
};

const DuelInvitePage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [subjects, setSubjects] = useState<SubjectDto[]>([]);
    const [levelsBySubject, setLevelsBySubject] = useState<Record<string, LevelDto[]>>({});
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const [duels, setDuels] = useState<DuelDto[]>([]);
    const [invitations, setInvitations] = useState<DuelInvitationDto[]>([]);
    const [stats, setStats] = useState<DuelStatsDto | null>(null);
    const [tab, setTab] = useState<"active" | "pending" | "history">("active");
    const [inviteOpen, setInviteOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        setErr(null);
        try {
            const [all, invs, st] = await Promise.all([
                DuelApi.list(),             // get all my duels
                DuelApi.invitations(),      // incoming invites
                DuelApi.stats(),            // overall stats
            ]);
            setDuels(all);
            setInvitations(invs);
            setStats(st);
        } catch (e: any) {
            setErr(e?.message || "Kunde inte ladda dueller.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const active = useMemo(() => duels.filter(d => d.status === "Active"), [duels]);
    const pending = useMemo(() => duels.filter(d => d.status === "Pending"), [duels]);
    const history = useMemo(
        () => duels.filter(d => d.status === "Finished" || d.status === "Cancelled"),
        [duels]
    );

    return (
        <div className="min-h-screen bg-[#0A0F1F] text-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold tracking-tight text-yellow-400">FRÅGEFEJDEN</span>
                    <span className="text-white/60 text-sm">Dueller</span>
                </div>
                <button
                    className="rounded-xl bg-[#22C55E] px-4 py-2 text-[14px] font-semibold text-white hover:brightness-110"
                    onClick={() => setInviteOpen(true)}
                >
                    Ny duell
                </button>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
                {stats && (
                    <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <Stat label="Dueller" value={stats.totalDuels} />
                        <Stat label="Vinster" value={stats.wins} />
                        <Stat label="Förluster" value={stats.losses} />
                        <Stat label="Oavgjorda" value={stats.draws} />
                        <Stat label="Winrate" value={`${Math.round(stats.winRate * 100)}%`} />
                        <Stat label="Streak" value={`${stats.currentStreak}/${stats.bestStreak}`} />
                    </section>
                )}

                {err && (
                    <div className="bg-red-600/20 border border-red-600/40 text-red-100 p-3 rounded">{err}</div>
                )}

                {/* tabs */}
                <div className="inline-flex rounded-xl bg-white/10 p-1">
                    {[
                        { k: "active", t: "Aktiva", c: active.length },
                        { k: "pending", t: "Inbjudningar", c: invitations.length || pending.length },
                        { k: "history", t: "Historik", c: history.length },
                    ].map(x => (
                        <button
                            key={x.k}
                            onClick={() => setTab(x.k as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === x.k ? "bg-white/20" : "hover:bg-white/5 text-white/80"
                                }`}
                        >
                            {x.t} {x.c ? <span className="text-white/60">({x.c})</span> : null}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-white/70">Laddar…</div>
                ) : (
                    <>
                        {tab === "active" && (
                            <div className="grid sm:grid-cols-2 gap-5">
                                {active.length === 0 && <EmptyCard title="Inga aktiva dueller" hint="Bjud in någon via 'Ny duell'." />}
                                {active.map(d => (
                                    <ActiveCard key={d.id} duel={d} onUpdated={load} />
                                ))}
                            </div>
                        )}

                        {tab === "pending" && (
                            <>
                                <div className="space-y-3">
                                    {invitations.length > 0 && (
                                        <h3 className="text-white/80 text-sm font-semibold">Inkomna inbjudningar</h3>
                                    )}
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        {invitations.map(inv => (
                                            <InviteCard
                                                key={inv.id}
                                                inv={inv}
                                                onAction={async a => {
                                                    if (a === "accept") {
                                                        await DuelApi.accept({ duelId: inv.id });
                                                    } else {
                                                        await DuelApi.decline({ duelId: inv.id });
                                                    }
                                                    await load();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-white/80 text-sm font-semibold">Väntande</h3>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        {pending.map(d => (
                                            <PendingCard key={d.id} duel={d} onUpdated={load} />
                                        ))}
                                        {pending.length === 0 && invitations.length === 0 && (
                                            <EmptyCard title="Inga väntande dueller" hint="Skapa en ny duell eller invänta svar." />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === "history" && (
                            <div className="grid sm:grid-cols-2 gap-5">
                                {history.length === 0 && <EmptyCard title="Ingen historik ännu" hint="Spela några dueller först." />}
                                {history.map(d => (
                                    <HistoryCard key={d.id} duel={d} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {inviteOpen && (
                <CreateInviteModal
                    subjects={subjects}
                    levelsBySubject={levelsBySubject}
                    onClose={() => setInviteOpen(false)}
                    onCreated={async () => {
                        setInviteOpen(false);
                        await load();
                        setTab("pending");
                    }}
                />
            )}
        </div>
    );
};

/* ---- small UI atoms ---- */
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-2xl p-4 ring-1 ring-white/10 bg-white/5">
            <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
            <div className="text-2xl font-extrabold mt-1">{value}</div>
        </div>
    );
}

function EmptyCard({ title, hint }: { title: string; hint?: string }) {
    return (
        <div className="bg-white/5 rounded-2xl p-6 ring-1 ring-white/10">
            <div className="text-lg font-bold">{title}</div>
            {hint && <div className="text-sm text-white/60 mt-1">{hint}</div>}
        </div>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return <span className="text-xs bg-white/10 px-2 py-1 rounded">{children}</span>;
}

function People({ names }: { names: string[] }) {
    return (
        <div className="flex -space-x-2">
            {names.slice(0, 3).map(n => (
                <div key={n} className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-[#0A0F1F] flex items-center justify-center text-[10px]">
                    {initials(n)}
                </div>
            ))}
            {names.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-[#0A0F1F] text-[10px] flex items-center justify-center">
                    +{names.length - 3}
                </div>
            )}
        </div>
    );
}

/* ---- cards ---- */
function PendingCard({ duel, onUpdated }: { duel: DuelDto; onUpdated: () => Promise<void> }) {
    const others = duel.participants.filter(p => !p.isCurrentUser).map(p => p.user.fullName);

    const cancelOrDecline = async () => {
        await DuelApi.decline({ duelId: duel.id });
        await onUpdated();
    };

    return (
        <div className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Väntande · {duel.subject.name}</div>
                <Pill>Best of {duel.bestOf}</Pill>
            </div>
            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Motståndare</span>
                    <People names={others} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Skapad</span>
                    <span className="font-medium">{timeAgo(duel.startedAt) || "nyss"}</span>
                </div>
            </div>
            <div className="flex gap-3">
                <button
                    className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                    onClick={async () => {
                        await DuelApi.start(duel.id);
                        await onUpdated();
                    }}
                >
                    Starta
                </button>
                <button
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
                    onClick={cancelOrDecline}
                >
                    Avbryt
                </button>
            </div>
        </div>
    );
}

function ActiveCard({ duel, onUpdated }: { duel: DuelDto; onUpdated: () => Promise<void> }) {
    const others = duel.participants.filter(p => !p.isCurrentUser).map(p => p.user.fullName);
    return (
        <div className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Aktiv · {duel.subject.name}</div>
                <Pill>Best of {duel.bestOf}</Pill>
            </div>
            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Motståndare</span>
                    <People names={others} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Påbörjad</span>
                    <span className="font-medium">{duel.startedAt ? timeAgo(duel.startedAt) : "nyss"}</span>
                </div>
            </div>
            <div className="flex gap-3">
                {/* Hook your router here */}
                <button className="rounded-xl bg-[#4F2ACB] px-4 py-2 text-sm font-semibold text-white/95 hover:brightness-110">
                    Fortsätt
                </button>
            </div>
        </div>
    );
}

function HistoryCard({ duel }: { duel: DuelDto }) {
    const others = duel.participants.filter(p => !p.isCurrentUser).map(p => p.user.fullName);
    return (
        <div className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Avslutad · {duel.subject.name}</div>
                <Pill>Best of {duel.bestOf}</Pill>
            </div>
            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Motståndare</span>
                    <People names={others} />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Klar</span>
                    <span className="font-medium">{duel.endedAt ? timeAgo(duel.endedAt) : "-"}</span>
                </div>
            </div>
            <button className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
                Visa detaljer
            </button>
        </div>
    );
}

function InviteCard({
    inv,
    onAction,
}: {
    inv: DuelInvitationDto;
    onAction: (action: "accept" | "decline") => Promise<void>;
}) {
    return (
        <div className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold">Inbjudan · {inv.subject.name}</div>
                <Pill>Best of {inv.bestOf}</Pill>
            </div>
            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Från</span>
                    <div className="inline-flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                            {initials(inv.invitedBy.fullName)}
                        </div>
                        <span className="font-medium">{inv.invitedBy.fullName}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-white/60">Skickad</span>
                    <span className="font-medium">{timeAgo(inv.createdAt)}</span>
                </div>
            </div>
            <div className="flex gap-3">
                <button
                    className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                    onClick={() => onAction("accept")}
                >
                    Acceptera
                </button>
                <button
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={() => onAction("decline")}
                >
                    Avböj
                </button>
            </div>
        </div>
    );
}

/* ---- Create+Invite modal ---- */
function CreateInviteModal({
    subjects,
    levelsBySubject,
    onClose,
    onCreated,
}: {
    subjects: SubjectDto[];
    levelsBySubject?: Record<string, LevelDto[]>;
    onClose: () => void;
    onCreated: () => Promise<void>;
}) {
    const [subjectId, setSubjectId] = useState<UUID>(subjects[0]?.id ?? "");
    const [levelId, setLevelId] = useState<UUID | "">(levelsBySubject?.[subjects[0]?.id ?? ""]?.[0]?.id ?? "");
    const [bestOf, setBestOf] = useState<number>(5);
    const [creating, setCreating] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [classmates, setClassmates] = useState<ClassmateDto[]>([]);
    const [opponentId, setOpponentId] = useState<UUID>("");

    const step2 = classmates.length > 0;
    const createdDuelIdRef = useRef<UUID>("");

    useEffect(() => {
        setLevelId(levelsBySubject?.[subjectId]?.[0]?.id ?? "");
    }, [subjectId, levelsBySubject]);

    const next = async () => {
        setErr(null);
        if (!subjectId) return setErr("Välj ett ämne.");
        if (bestOf < 3 || bestOf > 21 || bestOf % 2 === 0) {
            return setErr("BestOf måste vara ett udda tal 3–21.");
        }
        setCreating(true);
        try {
            // 1) create duel
            const duel = await DuelApi.createDuel({
                subjectId,
                levelId: levelId || null,
                bestOf,
            });
            createdDuelIdRef.current = duel.id;
            // 2) load classmates for the subject
            const mates = await DuelApi.classmates(subjectId);
            setClassmates(mates);
        } catch (e: any) {
            setErr(e?.message || "Kunde inte skapa duell.");
        } finally {
            setCreating(false);
        }
    };

    const sendInvite = async () => {
        setErr(null);
        if (!opponentId) return setErr("Välj en motståndare.");
        try {
            await DuelApi.invite({ duelId: createdDuelIdRef.current, inviteeId: opponentId });
            await onCreated();
        } catch (e: any) {
            setErr(e?.message || "Kunde inte skicka inbjudan.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white text-black rounded-2xl w-full max-w-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="text-lg font-bold">{step2 ? "Välj motståndare" : "Ny duell"}</div>
                    <button className="px-2 py-1 text-sm rounded hover:bg-black/5" onClick={onClose}>✕</button>
                </div>

                {!step2 ? (
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-xs text-gray-600">Ämne</label>
                            <select
                                className="w-full px-3 py-2 rounded border border-gray-300"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                            >
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {levelsBySubject?.[subjectId]?.length ? (
                            <div>
                                <label className="text-xs text-gray-600">Nivå (valfritt)</label>
                                <select
                                    className="w-full px-3 py-2 rounded border border-gray-300"
                                    value={levelId}
                                    onChange={(e) => setLevelId(e.target.value as UUID | "")}
                                >
                                    <option value="">Ingen nivå</option>
                                    {levelsBySubject[subjectId].map(lv => (
                                        <option key={lv.id} value={lv.id}>Level {lv.levelNumber}{lv.title ? ` — ${lv.title}` : ""}</option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div>
                            <label className="text-xs text-gray-600">Best of (udda 3–21)</label>
                            <input
                                type="number"
                                min={3}
                                max={21}
                                step={2}
                                value={bestOf}
                                onChange={(e) => setBestOf(parseInt(e.target.value || "0", 10))}
                                className="w-full px-3 py-2 rounded border border-gray-300"
                            />
                        </div>

                        {err && <div className="text-sm text-red-600">{err}</div>}
                    </div>
                ) : (
                    <div className="p-5">
                        <div className="text-sm font-semibold mb-2">Välj motståndare</div>
                        <div className="max-h-72 overflow-auto rounded border border-gray-200">
                            {classmates.map(u => (
                                <label
                                    key={u.id}
                                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${opponentId === u.id ? "bg-emerald-50" : ""
                                        }`}
                                >
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-[11px]">
                                            {initials(u.fullName)}
                                        </span>
                                        <span className="truncate">{u.fullName}</span>
                                        {!u.isAvailable && <span className="text-xs text-gray-500">(upptagen)</span>}
                                    </span>
                                    <input
                                        type="radio"
                                        name="opponent"
                                        checked={opponentId === u.id}
                                        onChange={() => setOpponentId(u.id)}
                                    />
                                </label>
                            ))}
                            {classmates.length === 0 && (
                                <div className="px-3 py-6 text-sm text-center text-gray-500">Inga klasskamrater tillgängliga.</div>
                            )}
                        </div>

                        {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t">
                    <button className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100" onClick={onClose}>
                        Avbryt
                    </button>
                    {!step2 ? (
                        <button
                            className="px-4 py-2 rounded bg-[#4F2ACB] text-white font-semibold hover:brightness-110 disabled:opacity-60"
                            onClick={next}
                            disabled={creating}
                        >
                            {creating ? "Skapar…" : "Nästa"}
                        </button>
                    ) : (
                        <button
                            className="px-4 py-2 rounded bg-[#22C55E] text-white font-semibold hover:brightness-110 disabled:opacity-60"
                            onClick={sendInvite}
                            disabled={!opponentId}
                        >
                            Skicka inbjudan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DuelInvitePage;
