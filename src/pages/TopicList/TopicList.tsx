import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { topicApi, TopicSummaryDto } from "../../Api/TopicsApi/topics";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import avatar from "../../assets/images/avatar/avatar3.png";

export default function TopicList(): React.ReactElement {
    const { subjectId = "" } = useParams<{ subjectId: string }>();
    const [params] = useSearchParams();
    const classId = params.get("classId") ?? "";
    const navigate = useNavigate();

    const [topics, setTopics] = useState<TopicSummaryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!subjectId) return;
        setLoading(true);
        setErr(null);
        topicApi
            .listBySubject(subjectId)
            .then(setTopics)
            .catch((e) => setErr(e?.message ?? "Kunde inte hämta kurser"))
            .finally(() => setLoading(false));
    }, [subjectId]);

    return (
        <div className="min-h-screen w-full bg-[#0A0F1F] text-white">
            {/* Hero */}
            <div className="relative h-48 md:h-56 overflow-hidden rounded-b-[28px] bg-gradient-to-r from-[#5A39E6] via-[#4F2ACB] to-[#4A2BC3]">
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(closest-side,rgba(173,140,255,0.95),rgba(123,76,255,0.5)_58%,transparent_72%)]" />
                <img src={frageTitle} alt="FrågeFejden" className="absolute left-4 top-4 h-14 md:h-20 object-contain" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 ring-2 ring-white/25">
                    <img src={avatar} alt="Profil" className="h-[72px] w-[72px] rounded-full ring-2 ring-white/80 object-cover" />
                </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 md:px-8 pt-8 pb-16">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-[26px] md:text-[28px] font-semibold text-white/90">
                            {loading ? "Laddar kurser..." : "Välj en kurs"}
                        </h2>
                        <div className="mt-1 text-sm text-white/70">Ämne: {subjectId.slice(0, 8)}…</div>
                    </div>
                    <button
                        onClick={() => navigate(`/classes/${classId}/subjects`)}
                        className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
                    >
                        ← Tillbaka till ämnen
                    </button>
                </div>

                {err && (
                    <div className="mx-auto max-w-3xl rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                        {err}
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-[#11182B] p-5 ring-1 ring-white/10">
                                <div className="h-5 w-2/3 rounded bg-white/10" />
                                <div className="mt-3 h-4 w-full rounded bg-white/5" />
                                <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="h-8 rounded bg-white/5" />
                                    <div className="h-8 rounded bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {topics.map((t) => (
                            <button
                                key={t.topicId}
                                onClick={() => navigate(`/topics/${t.topicId}?classId=${classId}`)}
                                className="group rounded-2xl bg-[#11182B] p-5 text-left ring-1 ring-white/10 hover:brightness-110 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white/90 truncate">{t.name}</h3>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                                        {t.levelCount} nivåer
                                    </span>
                                </div>
                                {!!t.description && (
                                    <p className="mt-2 line-clamp-2 text-sm text-white/70">{t.description}</p>
                                )}
                                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/70">
                                    <TinyStat label="Ordning" value={t.sortOrder} />
                                    <TinyStat label="Ämne" value={t.subjectId.slice(0, 8) + "…"} />
                                </div>
                            </button>
                        ))}

                        {!loading && topics.length === 0 && !err && (
                            <div className="col-span-full text-center text-white/70">
                                Inga kurser i det här ämnet (än).
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TinyStat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-lg bg-[#0D1426] px-2 py-1 ring-1 ring-white/10">
            <div className="text-white/60">{label}</div>
            <div className="font-semibold text-white/90">{value}</div>
        </div>
    );
}
