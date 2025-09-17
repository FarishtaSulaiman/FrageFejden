// src/pages/QuizVyStudent/QuizVyStudent.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthApi, Classes, SubjectsApi } from "../../Api/index";
import { DuelApi, type DuelDto } from "../../Api/DuelApi/Duel";

import titleImg from "../../assets/images/titles/frageFejden-title-pic.png";
import rankingIcon from "../../assets/images/icons/ranking-icon.png";
import scoreIcon from "../../assets/images/icons/score-icon.png";
import avatarImg from "../../assets/images/avatar/avatar1.png";

function getWsUrl(): string {
  // mirrors useWsPresence URL resolution
  const env = (import.meta as any)?.env?.VITE_DUEL_WS_URL as string | undefined;
  if (env) {
    if (env.startsWith("/")) {
      const scheme = location.protocol === "https:" ? "wss" : "ws";
      return `${scheme}://${location.host}${env}`;
    }
    return env; // absolute ws(s)://...
  }
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${location.hostname}:3001`;
}



async function sendInviteNotification(toUserId: string, payload: any) {
  return new Promise<void>((resolve) => {
    try {
      const ws = new WebSocket(getWsUrl());
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        try { ws.close(); } catch { }
        resolve();
      };

      ws.onopen = () => {
        // no need to join a room — just emit NOTIFY
        ws.send(JSON.stringify({
          type: "NOTIFY",
          toUserId,
          event: "INVITED",
          payload,
        }));
        // give the socket a brief moment to flush then close
        setTimeout(finish, 150);
      };

      ws.onerror = finish;
      ws.onclose = finish;
    } catch {
      resolve();
    }
  });
}

/** UI-subject (normaliserad) */
type UINormalizedSubject = {
  id: string;
  name: string;
  iconUrl?: string | null;
  levelsCount?: number;
  topicsCount?: number;
};

/** Klassmedlem UI */
type UIMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

/** Försök hitta ikon-URL på olika fältnamn + fallback till lokal ikon */
function resolveIconUrl(s: any): string {
  const url = s?.iconUrl ?? s?.IconUrl ?? s?.iconURL ?? s?.icon ?? null;
  if (typeof url === "string" && url.trim()) return url;
  return "/icons/open-book.png";
}

/** Liten hjälpmetod för id */
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** ensure odd bestOf (server also normalizes, but UX feels better) */
const ensureOdd = (n: number) => {
  const v = Math.max(1, Math.floor(Number.isFinite(n) ? n : 5));
  return v % 2 === 0 ? v + 1 : v;
};

export default function QuizVyStudent(): React.ReactElement {
  const navigate = useNavigate();

  const [meId, setMeId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Användare");
  const [className, setClassName] = useState("—");
  const [classId, setClassId] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);

  // 🔹 ÄMNEN (subjects) – inte topics
  const [subjects, setSubjects] = useState<UINormalizedSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Klassmedlemmar (högerpanel)
  const [members, setMembers] = useState<UIMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // 📣 Inbjudan
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitee, setInvitee] = useState<UIMember | null>(null);
  const [inviteSubjectId, setInviteSubjectId] = useState<string>("");
  const [inviteBestOf, setInviteBestOf] = useState<number>(5);

  // Skapad duel
  const [createdDuel, setCreatedDuel] = useState<DuelDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Bygg delbar länk efter att en duel skapats
  const inviteUrl = useMemo(() => {
    if (!createdDuel?.id) return "";
    return `${window.location.origin}/quizDuel?duelId=${createdDuel.id}`;
  }, [createdDuel]);

  // ──────────────────────────────────────────────────────────────────────────
  // INIT: hämta användare, klass, ranking, ämnen
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // 1) Hämta användare
      let me: any = null;
      try {
        me = await AuthApi.getMe();
        if (!alive) return;
        setMeId(me?.id ?? null);
        setDisplayName(me?.fullName?.trim() || "Användare");
      } catch {
        setMeId(null);
        setDisplayName("Användare");
      }

      // 2) Poäng
      try {
        if (me?.id) {
          const xp = await Classes.GetLoggedInUserScore(me.id);
          if (!alive) return;
          setPoints(typeof xp === "number" ? xp : 0);
        }
      } catch {
        setPoints(0);
      }

      // 3) Klass & ranking
      let pickedClassId: string | null = null;
      try {
        const myClasses = await Classes.GetUsersClasses();
        if (!alive) return;
        if (Array.isArray(myClasses) && myClasses.length > 0) {
          const first = myClasses[0];
          pickedClassId = first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id ?? null;
          const clsName = first?.name ?? first?.className ?? "—";
          setClassName(clsName || "—");
          setClassId(pickedClassId);
          if (pickedClassId && me?.id) {
            const { myRank } = await Classes.GetClassLeaderboard(pickedClassId, me.id);
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
        setClassName("—");
        setRankNum(null);
      }

      // 4) Ämnen i klassen
      try {
        if (!pickedClassId) {
          setSubjects([]);
        } else {
          const list = await SubjectsApi.getForClass(pickedClassId);
          if (!alive) return;
          const normalized: UINormalizedSubject[] = (Array.isArray(list) ? list : []).map((s: any) => ({
            id: s.id ?? s.subjectId,
            name: s.name ?? "Ämne",
            iconUrl: resolveIconUrl(s),
            levelsCount: s.levelsCount ?? s.levelCount ?? undefined,
            topicsCount: s.topicCount ?? s.topicsCount ?? undefined,
          }));
          normalized.sort((a, b) => a.name.localeCompare(b.name));
          setSubjects(normalized);
        }
      } catch (err) {
        console.error("Kunde inte hämta ämnen:", err);
        setSubjects([]);
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 🔸 Ladda klassmedlemmar för högerpanelen
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!classId) return;
      try {
        setMembersLoading(true);

        const res = await Classes.GetClassMembersVisible(classId);
        if (!alive) return;

        const list = Array.isArray(res) ? res : [];
        const normalized: UIMember[] = list
          .map((m: any) => ({
            id: m.id ?? m.userId ?? genId(),
            name: m.fullName ?? m.name ?? "Elev",
            avatarUrl: m.avatarUrl ?? m.photoUrl ?? null,
          }))
          .filter((m) => !meId || m.id !== meId); // filtrera bort mig själv
        setMembers(normalized);
      } catch (e) {
        console.warn("Kunde inte hämta klassmedlemmar – visar tom lista.", e);
        setMembers([]);
      } finally {
        if (alive) setMembersLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [classId, meId]);

  // Ämneskort (vänsterspalt)
  const subjectCards = useMemo(() => {
    if (!subjects.length) return [] as Array<{ id: string; label: string; sub: string; iconUrl?: string | null }>;
    return subjects.map((s) => {
      const sub =
        typeof s.levelsCount === "number" && s.levelsCount > 0
          ? `${s.levelsCount} nivåer`
          : typeof s.topicsCount === "number" && s.topicsCount > 0
            ? `${s.topicsCount} områden`
            : "Inga nivåer ännu";
      return { id: s.id, label: s.name, sub, iconUrl: s.iconUrl };
    });
  }, [subjects]);

  // Klick på ämneskort → direkt navigering (ingen bekräfta-knapp)
  function goToSubject(subjectId: string) {
    const cid = classId ?? "";
    navigate(`/subjects/${subjectId}/topics?classId=${cid}`);
  }

  // Högerpanel: öppna inbjudan
  function openInviteFor(member: UIMember) {
    setInvitee(member);
    // Förifyll ämne om det bara finns ett, annars tomt → låt användaren välja
    if (subjects.length === 1) setInviteSubjectId(subjects[0].id);
    else setInviteSubjectId("");
    // återställ state för skapad duel
    setInviteBestOf(5);
    setCreatedDuel(null);
    setCreateError(null);
    setInviteOpen(true);
  }

  async function copyInvite() {
    try {
      if (!inviteUrl) return;
      await navigator.clipboard.writeText(inviteUrl);
      alert("Länk kopierad!");
    } catch (e) {
      console.warn("Kunde inte kopiera till urklipp", e);
    }
  }

  // ⬇️ INVITE IMPLEMENTATION (create duel + invite) — fixed/robust
  async function createAndInvite() {
    if (!invitee?.id) {
      setCreateError("Välj en mottagare.");
      return;
    }
    if (!inviteSubjectId) {
      setCreateError("Välj ett ämne.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      // 1) Skapa duell
      const duel = await DuelApi.createDuel({
        subjectId: inviteSubjectId,
        levelId: null,
        bestOf: ensureOdd(inviteBestOf),
      });

      // 2) Bjud in klasskompis (backend records invite)
      await DuelApi.invite({
        duelId: duel.id,
        inviteeId: invitee.id,
      });

      // 3) Fire-and-forget WS notification to invitee (no rooms needed)
      const subjectName = subjects.find(s => s.id === inviteSubjectId)?.name ?? "Ämne";
      await sendInviteNotification(invitee.id, {
        duelId: duel.id,
        subject: subjectName,
        bestOf: ensureOdd(inviteBestOf),
        fromName: displayName,   // you already have this in state
      });

      setCreatedDuel(duel);
    } catch (e: any) {
      const backendMsg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        "Ett fel uppstod när duellen skulle skapas eller inbjudan skickas.";
      setCreateError(typeof backendMsg === "string" ? backendMsg : "Något gick fel.");
    } finally {
      setCreating(false);
    }
  }

  function startDuelNow() {
    if (!createdDuel?.id) return;
    navigate(`/duel/${createdDuel.id}`);
  }


  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white">
      {/* Header */}
      <section className="relative">
        <div className="relative h-[230px] overflow-hidden bg-gradient-to-r from-[#5E2FD7] via-[#5B2ED6] to-[#3E1BB2]">
          <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
            <img
              src={titleImg}
              alt="FRÅGEFEJDEN"
              className="h-[96px] sm:h-[112px] w-auto -ml-3 sm:-ml-6 lg:-ml-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
            />
            <div className="flex items-center gap-3">
              <div className="mr-1 text-right leading-tight">
                <div className="text-[13px] text-white/85">{loading ? "Laddar…" : `Hej ${displayName}!`}</div>
                <div className="text-[12px] text-white/70">{loading ? "—" : `Klass: ${className}`}</div>
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
                  <div className="text-[17px] font-semibold">{loading ? "…" : rankNum ?? "—"}</div>
                </div>
              </div>
              <div className="flex h-14 items-center gap-3 rounded-[16px] bg-[#0F1426]/92 px-6 ring-1 ring-white/10 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur">
                <img src={scoreIcon} alt="Poäng" className="h-7 w-7" />
                <div className="leading-tight">
                  <div className="text-[13px] text-white/85">Poäng</div>
                  <div className="text-[17px] font-semibold">{loading ? "…" : points}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layout: vänster (ämnen) + höger (klassmedlemmar) */}
      <section className="mx-auto max-w-[1100px] px-4 pt-12 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Ämneskort */}
          <div>
            <h2 className="text-center text-[18px] font-semibold text-white/90 mb-6">Välj din kurs</h2>
            <div className="grid grid-cols-1 place-items-center gap-x-16 gap-y-10 sm:grid-cols-2">
              {subjectCards.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSubject(s.id)}
                  className="relative w-full max-w-[460px] text-left"
                  disabled={loading}
                >
                  <article className="relative h-[140px] w-full rounded-[26px] border border-[#1E2A49] bg-[#0E1629] px-7 py-6 shadow-[0_22px_48px_rgba(0,0,0,0.5)] hover:ring-2 hover:ring-white/70 transition">
                    <div className="flex h-full items-center gap-6">
                      <div className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-gradient-to-b from-[#0E1A34] to-[#0B152A] ring-1 ring-white/5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                        <img
                          src={s.iconUrl || "/icons/open-book.png"}
                          alt={s.label}
                          className="h-[56px] w-[56px] object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/icons/open-book.png";
                          }}
                        />
                      </div>
                      <div className="translate-y-[-2px]">
                        <h3 className="text-[20px] font-semibold">{s.label}</h3>
                        <p className="mt-1 text-[13px] text-white/65">{s.sub}</p>
                      </div>
                    </div>
                  </article>
                </button>
              ))}

              {!loading && subjectCards.length === 0 && (
                <div className="col-span-full text-center text-white/75 text-sm">
                  Du har inga kurser inlagda ännu.
                </div>
              )}
            </div>
          </div>

          {/* Klassmedlemmar (inbjudningar) */}
          <aside className="lg:sticky lg:top-6 h-max rounded-2xl border border-white/10 bg-[#0E1629] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">Klassmedlemmar</h3>
              {membersLoading && <span className="text-xs text-white/60">Laddar…</span>}
            </div>
            <p className="mt-1 text-[12px] text-white/70">
              Bjud in någon till en snabb duell i ett valfritt ämne.
            </p>

            <div className="mt-4 space-y-2 max-h-[520px] overflow-auto pr-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-[#0F1728] px-3 py-2 ring-1 ring-white/10"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatarUrl || avatarImg}
                      alt={m.name}
                      className="h-8 w-8 rounded-full ring-1 ring-white/10 object-cover"
                    />
                    <span className="text-sm">{m.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInviteFor(m)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Bjud in
                  </button>
                </div>
              ))}

              {!membersLoading && members.length === 0 && (
                <div className="text-center text-xs text-white/60">
                  Inga klasskamrater hittades.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Inbjudningsmodal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-[560px] rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10">
            <h3 className="text-center text-2xl font-extrabold">
              Bjud in {invitee?.name?.split(" ")[0] || "elev"}
            </h3>
            <p className="mt-1 text-center text-white/80 text-sm">
              Välj ämne och antal rundor (best of). Länken visas efter att inbjudan skickats.
            </p>

            <div className="mt-5 grid gap-4">
              {/* Ämne */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Ämne</label>
                <select
                  aria-label="Create Invite"
                  className="w-full h-11 rounded-lg bg-white/10 px-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-white/30"
                  value={inviteSubjectId}
                  onChange={(e) => {
                    setInviteSubjectId(e.target.value);
                    setCreatedDuel(null);
                    setCreateError(null);
                  }}
                >
                  <option value="" disabled>
                    Välj ämne…
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Best of */}
              <div>
                <label className="block text-xs text-white/70 mb-1">Best of</label>
                <input
                  aria-label="InviteBestof"
                  type="number"
                  min={1}
                  max={15}
                  step={2}
                  value={inviteBestOf}
                  onChange={(e) => setInviteBestOf(Math.max(1, Math.min(15, Number(e.target.value) || 5)))}
                  className="w-full h-11 rounded-lg bg-white/10 px-3 text-[14px] outline-none ring-1 ring-white/10 focus:ring-white/30"
                />
                <div className="mt-1 text-xs text-white/60">
                  Udda tal rekommenderas (3, 5, 7...) så att det inte blir lika.
                </div>
              </div>

              {/* Skapa + bjud in */}
              {!createdDuel && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      setInviteOpen(false);
                      setCreatedDuel(null);
                      setCreateError(null);
                    }}
                    className="h-11 rounded-lg bg-[#6B6F8A] px-5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                  >
                    Stäng
                  </button>
                  <button
                    type="button"
                    disabled={!inviteSubjectId || creating}
                    onClick={createAndInvite}
                    className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {creating ? "Skapar…" : "Skapa & bjud in"}
                  </button>
                </div>
              )}

              {/* Efter skapad duel: visa länk + actions */}
              {createdDuel && (
                <>
                  <div>
                    <label className="block text-xs text-white/70 mb-1">Inbjudningslänk</label>
                    <div className="flex gap-2">
                      <input
                        aria-label="Cope Invite"
                        readOnly
                        value={inviteUrl}
                        className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10"
                      />
                      <button
                        type="button"
                        onClick={copyInvite}
                        className="rounded-lg bg-[#6B6F8A] px-4 text-sm font-semibold text-white hover:brightness-110"
                      >
                        Kopiera
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      Skicka länken till {invitee?.name?.split(" ")[0] || "din klasskamrat"}.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setInviteOpen(false)}
                      className="h-11 rounded-lg bg-[#6B6F8A] px-5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Stäng
                    </button>
                    <button
                      type="button"
                      onClick={startDuelNow}
                      className="h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Gå till duellrummet
                    </button>
                  </div>
                </>
              )}

              {createError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                  {createError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
