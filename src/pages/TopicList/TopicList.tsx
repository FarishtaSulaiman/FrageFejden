import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthApi, Classes, SubjectsApi, topicApi } from "../../Api/index";

import titleImg from "../../assets/images/titles/frageFejden-title-pic.png";
import rankingIcon from "../../assets/images/icons/ranking-icon.png";
import scoreIcon from "../../assets/images/icons/score-icon.png";
import geografiIcon from "../../assets/images/icons/geografy-icon.png";
import historyIcon from "../../assets/images/icons/history-icon.png";
import mathIcon from "../../assets/images/icons/math-transparent.png";
import bookIcon from "../../assets/images/icons/open-book.png";
import avatarImg from "../../assets/images/avatar/avatar1.png";

/** ikon per ämnesnamn (fallback: book) */
const SUBJECT_ICON_BY_NAME: Record<string, string> = {
    geografi: geografiIcon,
    historia: historyIcon,
    matematik: mathIcon,
    svenska: bookIcon,
};
function subjectIconFor(name?: string) {
    const key = (name ?? "").trim().toLowerCase();
    return SUBJECT_ICON_BY_NAME[key] ?? bookIcon;
}

/** Normaliserad topic för UI */
type UINormalizedTopic = {
    id: string;
    subjectId: string;
    subjectName: string;
    name: string;
    levelCount: number;
};

export default function QuizVyStudent(): React.ReactElement {
    const navigate = useNavigate();
    const location = useLocation();
    const { subjectId: subjectIdFromPath } = useParams(); // /subjects/:subjectId/topics

    const [displayName, setDisplayName] = useState("Användare");
    const [className, setClassName] = useState("—");
    const [classId, setClassId] = useState<string | null>(null);
    const [points, setPoints] = useState<number>(0);
    const [rankNum, setRankNum] = useState<number | null>(null);

    const [topics, setTopics] = useState<UINormalizedTopic[]>([]);
    const [loading, setLoading] = useState(true);

    // Vald topic
    const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

    // 1) Boot: user, score, first class, rank  (runs once)
    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);

            try {
                // 1) Hämta användare
                const me = await AuthApi.getMe().catch(() => null);
                if (!alive) return;
                setDisplayName(me?.fullName?.trim() || "Användare");

                // 2) Hämta poäng
                if (me?.id) {
                    const xp = await Classes.GetLoggedInUserScore(me.id).catch(() => 0);
                    if (!alive) return;
                    setPoints(typeof xp === "number" ? xp : 0);
                } else {
                    setPoints(0);
                }

                // 3) Hämta klasser & ranking (vi använder första klassen)
                let picked: string | null = null;
                const myClasses = await Classes.GetUsersClasses().catch(() => []);
                if (!alive) return;

                if (Array.isArray(myClasses) && myClasses.length > 0) {
                    const first = myClasses[0];
                    picked = first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id ?? null;
                    const clsName = first?.name ?? first?.className ?? "—";
                    setClassName(clsName || "—");
                    setClassId(picked);

                    if (picked && me?.id) {
                        const { myRank } =
                            (await Classes.GetClassLeaderboard(picked, me.id).catch(() => ({ myRank: null }))) ??
                            {};
                        if (!alive) return;
                        setRankNum(myRank ?? null);
                    } else {
                        setRankNum(null);
                    }
                } else {
                    setClassName("—");
                    setRankNum(null);
                }
            } catch {
                // no-op, defaults already set
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    // 2) Load topics whenever class OR subject (from PATH) changes
    useEffect(() => {
        if (!classId) {
            setTopics([]);
            return;
        }

        let alive = true;

        (async () => {
            setLoading(true);
            try {
                const subjects = await SubjectsApi.getForClass(classId);
                if (!alive) return;

                // pick active subject: from PATH param or fallback to first subject in class
                const activeSubjectId = (subjectIdFromPath as string | undefined) ?? subjects[0]?.id ?? null;

                // Optional guard: ensure the URL subject belongs to this class
                if (
                    activeSubjectId &&
                    subjects.length > 0 &&
                    !subjects.some((s) => s.id === activeSubjectId)
                ) {
                    console.warn(
                        "SubjectId in URL doesn't belong to this class:",
                        activeSubjectId,
                        "Class subjects:",
                        subjects.map((s) => s.id)
                    );
                    setTopics([]);
                    return;
                }

                if (!activeSubjectId) {
                    setTopics([]);
                    return;
                }

                // Hämta endast topics för det aktiva ämnet
                const list = await topicApi.listBySubject(activeSubjectId);
                if (!alive) return;

                const activeSubjectName =
                    subjects.find((s) => s.id === activeSubjectId)?.name ?? "—";

                const onlyThisSubjectsTopics: UINormalizedTopic[] = list.map((t: any) => ({
                    id: t.topicId ?? t.id, // TopicSummaryDto uses topicId
                    subjectId: t.subjectId ?? activeSubjectId,
                    subjectName: activeSubjectName,
                    name: t.name,
                    levelCount: t.levelCount ?? t.levelsCount ?? 0,
                }));

                setTopics(
                    onlyThisSubjectsTopics.sort((a, b) => a.name.localeCompare(b.name))
                );
                setSelected(null); // reset selection when subject changes
            } catch (err) {
                console.error("Kunde inte hämta topics:", err);
                setTopics([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [classId, subjectIdFromPath]);

    // Mappa topics till kort
    const topicCards = useMemo(() => {
        if (!topics.length) return [];
        return topics.map((t) => ({
            id: t.id,
            label: t.name,
            sub: t.levelCount > 0 ? `${t.levelCount} nivåer` : "Inga nivåer ännu",
            icon: subjectIconFor(t.subjectName),
        }));
    }, [topics]);

    // Bekräfta val -> gå till topics sida (eller direkt quizflöde om du vill)
    function handleConfirm() {
        if (!selected) return;
        const cid = classId ?? "";
        // till nivå-/progressvyn för topic
        navigate(`/topics/${selected.id}?classId=${cid}`);
    }

    return (
        <div className="min-h-screen bg-[#0A0F1F] text-white">
            {/* Header med namn, klass, poäng */}
            <section className="relative">
                <div className="relative h-[230px] overflow-hidden bg-gradient-to-r from-[#5E2FD7] via-[#5B2ED6] to-[#3E1BB2]">
                    <div className="mx-auto flex h-full max-w={[1100]} items-center justify-between px-4">
                        <img
                            src={titleImg}
                            alt="FRÅGEFEJDEN"
                            className="h-[96px] sm:h-[112px] w-auto -ml-3 sm:-ml-6 lg:-ml-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                        />
                        <div className="flex items-center gap-3">
                            <div className="mr-1 text-right leading-tight">
                                <div className="text-[13px] text-white/85">
                                    {loading ? "Laddar…" : `Hej ${displayName}!`}
                                </div>
                                <div className="text-[12px] text-white/70">
                                    {loading ? "—" : `Klass: ${className}`}
                                </div>
                            </div>
                            <img
                                src={avatarImg}
                                alt="Avatar"
                                className="h-[72px] w-[72px] rounded-full ring-2 ring-white/25 shadow-[0_10px_24px_rgba(0,0,0,0.35)] object-cover"
                            />
                        </div>
                    </div>

                    {/* Ranking + Poäng */}
                    <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-5">
                            <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                                <img src={rankingIcon} alt="Ranking" className="h-7 w-7" />
                                <div className="leading-tight">
                                    <div className="text-[13px] text-white/85">Ranking</div>
                                    <div className="text-[17px] font-semibold">
                                        {loading ? "…" : rankNum ?? "—"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                                <img src={scoreIcon} alt="Poäng" className="h-7 w-7" />
                                <div className="leading-tight">
                                    <div className="text-[13px] text-white/85">Poäng</div>
                                    <div className="text-[17px] font-semibold">
                                        {loading ? "…" : points}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Titel */}
            <section className="mx-auto max-w-[1100px] px-4 pt-16">
                <h2 className="text-center text-[18px] font-semibold text-white/90">
                    Välj din kurs
                </h2>
            </section>

            {/* Topic-kort */}
            <section className="mx-auto max-w-[1100px] px-4 pt-6">
                <div className="grid grid-cols-1 place-items-center gap-x-16 gap-y-10 sm:grid-cols-2">
                    {topicCards.map((t) => {
                        const isSelected = selected?.id === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelected({ id: t.id, name: t.label })}
                                aria-pressed={isSelected}
                                className="relative w-full max-w-[460px] text-left"
                                disabled={loading}
                            >
                                {isSelected && (
                                    <div className="pointer-events-none absolute -inset-[6px] rounded-[26px] ring-2 ring-white/95 shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" />
                                )}
                                <article className="relative h-[140px] w-full rounded-[26px] border border-[#1E2A49] bg-[#0E1629] px-7 py-6 shadow-[0_22px_48px_rgba(0,0,0,0.5)]">
                                    <div className="flex h-full items-center gap-6">
                                        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E1A34] to-[#0B152A] ring-1 ring-white/5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                                            <img src={t.icon} alt={t.label} className="h-[56px] w-[56px]" />
                                        </div>
                                        <div className="translate-y-[-2px]">
                                            <h3 className="text-[20px] font-semibold">{t.label}</h3>
                                            <p className="mt-1 text-[13px] text-white/65">{t.sub}</p>
                                        </div>
                                    </div>
                                </article>
                            </button>
                        );
                    })}

                    {!loading && topicCards.length === 0 && (
                        <div className="col-span-full text-center text-white/75 text-sm">
                            Du har inga kurser inlagda ännu.
                        </div>
                    )}
                </div>

                {/* Bekräfta-knapp */}
                <div className="mt-12 flex justify-center pb-20">
                    <button
                        type="button"
                        disabled={!selected || loading}
                        onClick={handleConfirm}
                        className="inline-flex items-center justify-center rounded-xl bg-[#22C55E] px-8 py-3 text-[15px] font-semibold text-white shadow-[0_26px_70px_rgba(34,197,94,0.45)] hover:brightness-110 active:scale-[0.99] disabled:bg-[#22C55E]/50 disabled:cursor-not-allowed"
                    >
                        Bekräfta val
                    </button>
                </div>
            </section>
        </div>
    );
}
