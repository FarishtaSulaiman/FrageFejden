import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import globe from "../../assets/images/icons/geografy-icon.png";
import { DuelApi, type DuelDto, type QuestionOptionDto } from "../../Api/DuelApi/Duel";
import { AuthApi } from "../../Api";
import { useWsPresence, type PresenceUser } from "../../lib/useWsPresence";

type UUID = string;

export default function DuelRoom(): React.ReactElement {
  const navigate = useNavigate();
  const params = useParams<{ duelId?: string }>();
  const [search] = useSearchParams();

  const duelId = React.useMemo<UUID | null>(() => {
    return (params.duelId as UUID) || (search.get("duelId") as UUID) || null;
  }, [params.duelId, search]);

  const [me, setMe] = React.useState<PresenceUser | null>(null);
  const [duel, setDuel] = React.useState<DuelDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // Add debug state
  const [debug, setDebug] = React.useState<string[]>([]);
  const addDebug = (msg: string) => {
    console.log(msg); // Also log to console for easier debugging
    setDebug(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev.slice(0, 9)]);
  };

  // round-local UI
  const currentRound = duel?.currentRound ?? null;
  const [selected, setSelected] = React.useState<UUID | null>(null);
  const [answered, setAnswered] = React.useState<boolean>(false);
  const [timeLeft, setTimeLeft] = React.useState<number>(currentRound?.timeLimitSeconds || 30);
  const roundKey = `${duel?.id ?? ""}:${currentRound?.id ?? ""}`;

  // identify me
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await AuthApi.getMe();
        if (!alive) return;
        setMe({ id: m?.id ?? "", name: m?.fullName || "Jag" });
        addDebug(`Identified as: ${m?.fullName} (${m?.id})`);
      } catch {
        setMe(null);
        addDebug("Failed to identify user");
      }
    })();
    return () => { alive = false; };
  }, []);

  // fetch duel + poll
  React.useEffect(() => {
    if (!duelId) {
      setErr("Saknar duelId i URL:en.");
      setLoading(false);
      return;
    }

    let alive = true;
    let t: number | undefined;
    const load = async () => {
      try {
        const d = await DuelApi.getById(duelId);
        if (!alive) return;
        setDuel(d);
        setErr(null);
        addDebug(`Duel loaded: status=${d.status}(${typeof d.status}), participants=${d.participants.length}, rounds=${d.rounds.length}`);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data ?? e?.message ?? "Kunde inte hämta duellen.");
        addDebug(`Error loading duel: ${e?.message}`);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    t = window.setInterval(load, 2000);
    return () => {
      alive = false;
      if (t) window.clearInterval(t);
    };
  }, [duelId]);

  // reset on new round (pure UI timer)
  React.useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setTimeLeft(currentRound?.timeLimitSeconds || 30);
    if (!currentRound) return;

    const startedAt = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, (currentRound.timeLimitSeconds || 30) - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [roundKey]);

  // Handle both string and numeric enum values
  const normalizeStatus = (status: any): string => {
    if (typeof status === 'number') {
      // Convert enum number to string
      switch (status) {
        case 0: return 'pending';
        case 1: return 'active';
        case 2: return 'completed';
        default: return 'pending';
      }
    }
    return String(status || 'pending').toLowerCase();
  };

  const status = React.useMemo(() => normalizeStatus(duel?.status), [duel?.status]);

  const meParticipant = React.useMemo(() => duel?.participants.find((p) => p.isCurrentUser), [duel]);
  const otherParticipant = React.useMemo(() => duel?.participants.find((p) => !p.isCurrentUser), [duel]);
  const isCreator = !!meParticipant && !meParticipant.invitedBy;

  // presence: who opened the room
  const roomId = duelId ? `duel-${duelId}` : "";
  const { connected, users, setReady } = useWsPresence(roomId, me);

  const bothAccepted = (duel?.participants.length ?? 0) >= 2;
  const bothPresent = users.length >= 2;

  // READY state from presence
  const myReady = React.useMemo(() => {
    if (!me) return false;
    return !!users.find((u) => u.id === me.id)?.ready;
  }, [users, me]);

  const otherReady = React.useMemo(() => {
    if (!me) return false;
    const other = users.find((u) => u.id !== me.id);
    return !!other?.ready;
  }, [users, me]);

  const bothReady = myReady && otherReady && bothPresent;

  const showLobby = !!duel && status !== "completed" && !currentRound;

  // Check if this user was invited and needs to accept
  const needsToAccept = status === "pending" && !!meParticipant?.invitedBy;

  const canStart = React.useMemo(() => {
    const conditions = {
      hasDuel: !!duel,
      isActiveStatus: status === "active",
      noCurrentRound: !currentRound,
      hasParticipant: !!meParticipant,
      bothAcceptedOnBackend: bothAccepted,
      bothPresentInRoom: bothPresent,
      bothReadyInRoom: bothReady
    };

    addDebug(`Start conditions: ${JSON.stringify(conditions)}`);

    return conditions.hasDuel &&
      conditions.isActiveStatus &&
      conditions.noCurrentRound &&
      conditions.hasParticipant &&
      conditions.bothAcceptedOnBackend &&
      conditions.bothPresentInRoom &&
      conditions.bothReadyInRoom;
  }, [duel, status, currentRound, meParticipant, bothAccepted, bothPresent, bothReady]);

  // Auto-start with better error handling
  React.useEffect(() => {
    if (showLobby && canStart) {
      addDebug("Auto-starting duel...");
      startDuel();
    }
  }, [showLobby, canStart]);

  const roundActive = !!duel && status === "active" && !!currentRound;
  const subjectName = duel?.subject?.name ?? "Ämne";

  async function startDuel() {
    if (!duelId) return;
    try {
      addDebug("Calling start API...");
      const result = await DuelApi.start(duelId);
      addDebug(`Start API result: ${JSON.stringify(result)}`);

      // Force immediate reload
      const d = await DuelApi.getById(duelId);
      setDuel(d);
      addDebug(`After start: status=${d.status}, rounds=${d.rounds.length}`);
    } catch (e: any) {
      const errorMsg = e?.response?.data ?? e?.message ?? "Kunde inte starta duellen.";
      addDebug(`Start error: ${errorMsg}`);
      alert(errorMsg);
    }
  }

  async function manualStart() {
    addDebug("Manual start clicked");
    await startDuel();
  }

  async function acceptInvitation() {
    if (!duelId) return;
    try {
      addDebug("Accepting invitation...");
      await DuelApi.accept({ duelId });
      // Immediate reload to get updated status
      const d = await DuelApi.getById(duelId);
      setDuel(d);
      addDebug(`After accept: status=${d.status}`);
    } catch (e: any) {
      const errorMsg = e?.response?.data ?? e?.message ?? "Kunde inte acceptera inbjudan.";
      addDebug(`Accept error: ${errorMsg}`);
      alert(errorMsg);
    }
  }

  function pickOption(opt: QuestionOptionDto) {
    if (!roundActive || answered) return;
    setSelected(opt.id || null);
  }

  async function confirm() {
    if (!duel || !currentRound || !selected || answered || !me?.id) return;
    const baseStart = Date.now() - (currentRound.timeLimitSeconds - timeLeft) * 1000;
    const elapsedMs = Math.max(0, Date.now() - baseStart);

    try {
      await DuelApi.submitAnswer({
        duelId: duel.id,
        questionId: currentRound.question.id,
        selectedOptionId: selected,
        timeMs: elapsedMs,
      });
      setAnswered(true);
      const d = await DuelApi.getById(duel.id);
      setDuel(d);
    } catch (e: any) {
      alert(e?.response?.data ?? e?.message ?? "Kunde inte skicka ditt svar.");
    }
  }

  const Header = () => (
    <div className="flex items-center justify-center gap-3">
      <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">{subjectName}</h1>
      <img src={globe} alt={subjectName} className="h-8 w-8 md:h-9 md:w-9" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white grid place-items-center">
        <div className="text-white/80">Laddar duell…</div>
      </div>
    );
  }

  if (err || !duelId || !duel) {
    return (
      <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white grid place-items-center">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
          {err ?? "Kunde inte hitta duellen."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
      <div className="mx-auto max-w-[980px] px-5 pt-10 pb-12">
        <Header />
        <p className="mt-2 text-center text-[15px] text-white/85">Bäst av {duel.bestOf}</p>

        {/* Debug Info - Remove in production */}
        <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
          <div>Status: {status} ({duel.status}) | Participants: {duel.participants.length} | Present: {users.length}</div>
          <div>Ready: Me={myReady.toString()} Other={otherReady.toString()} | Can Start: {canStart.toString()}</div>
          <div>Creator: {isCreator.toString()} | Needs Accept: {needsToAccept.toString()}</div>
          <div className="mt-2 max-h-20 overflow-y-auto">
            {debug.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>

        {/* Active round */}
        {roundActive && currentRound && (
          <>
            <h2 className="mx-auto mt-6 max-w-[820px] text-center text-[26px] md:text-[28px] font-extrabold tracking-tight">
              {currentRound.question.stem}
            </h2>

            {/* Timer */}
            <div className="mt-5 flex justify-center">
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0F1728] ring-2 ring-white">
                  <span className="text-lg font-bold">{timeLeft}</span>
                </div>
                <div className={`pointer-events-none absolute -inset-1 rounded-full ring-2 ${timeLeft <= 10 && timeLeft > 0 ? "ring-red-500" : "ring-emerald-400"}`} />
                {timeLeft <= 10 && timeLeft > 0 && <div className="pointer-events-none absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />}
              </div>
            </div>

            {/* Players header */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {duel.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#121a2f] px-4 py-3 ring-1 ring-white/10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-bold">
                      {(p.user.fullName || "?").slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold leading-tight">
                        {p.isCurrentUser ? `${p.user.fullName} (Du)` : p.user.fullName}
                      </div>
                      <div className="text-xs text-white/70">Spelar</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold">{p.score}</div>
                    <div className="text-xs text-white/60">Poäng</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Options */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {currentRound.question.options.map((opt) => (
                <button
                  key={opt.id + ":" + opt.sortOrder}
                  type="button"
                  className={optionBtnClass(opt, selected, answered, timeLeft)}
                  onClick={() => pickOption(opt)}
                  disabled={answered || timeLeft === 0}
                  aria-pressed={selected === opt.id}
                >
                  {opt.optionText}
                </button>
              ))}
            </div>

            {/* Confirm */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={confirm}
                disabled={!selected || answered}
                className={[
                  "flex items-center justify-center",
                  "h-12 w-[280px] rounded-[12px] text-[15px] font-semibold text-center",
                  "transition",
                  selected && !answered ? "bg-[#6B6F8A] hover:brightness-110" : "bg-[#6B6F8A]/60 cursor-not-allowed",
                ].join(" ")}
              >
                Bekräfta svar
              </button>
            </div>
          </>
        )}

        {/* Completed */}
        {status === "completed" && (
          <div className="mt-10 mx-auto max-w-lg rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10 text-center">
            <h3 className="text-2xl font-extrabold">Duellen är avslutad</h3>
            <div className="mt-4 space-y-2 text-sm">
              {duel.participants
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#121a2f] px-3 py-2">
                    <span>{p.isCurrentUser ? `${p.user.fullName} (Du)` : p.user.fullName}</span>
                    <span className="font-semibold">{p.score} p</span>
                  </div>
                ))}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-11 rounded-lg bg-[#6B6F8A] px-5 text-sm font-semibold text-white hover:brightness-110"
              >
                Tillbaka
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOBBY */}
      {showLobby && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10">
            <h3 className="text-center text-2xl font-extrabold">Väntrum</h3>
            <p className="mt-1 text-center text-white/80">
              Ämne: <span className="font-semibold">{subjectName}</span> • Bäst av {duel.bestOf}
            </p>
            <p className="mt-1 text-center text-white/60 text-xs">
              WebSocket: {connected ? <span className="text-emerald-400">ansluten</span> : <span className="text-rose-400">frånkopplad</span>}
              {" • "}Anslutna: {users.length} • Status: {status}
            </p>

            {/* Show acceptance needed */}
            {needsToAccept && (
              <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded text-center">
                <p className="text-blue-200">Du har blivit inbjuden av {meParticipant?.invitedBy?.fullName}</p>
                <button
                  onClick={acceptInvitation}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                >
                  Acceptera inbjudan
                </button>
              </div>
            )}

            {/* Players */}
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <PlayerCard
                label={users[0] ? `${users[0].name}${me && users[0].id === me.id ? " (Du)" : ""}` : "Inväntar spelare"}
                avatarLetter={users[0]?.name?.[0]?.toUpperCase() ?? "?"}
                highlight={!!users[0]?.ready}
              />
              <div className="mx-auto"><SwordIcon className="h-12 w-12 opacity-90" /></div>
              <PlayerCard
                label={users[1] ? `${users[1].name}${me && users[1].id === me.id ? " (Du)" : ""}` : "Inväntar motståndare"}
                avatarLetter={users[1]?.name?.[0]?.toUpperCase() ?? "?"}
                highlight={!!users[1]?.ready}
                align="right"
              />
            </div>

            <div className="mt-6 text-center text-sm text-white/70">
              {needsToAccept && "Klicka 'Acceptera inbjudan' för att fortsätta."}
              {status === "pending" && !needsToAccept && "Väntar på att alla accepterar inbjudan…"}
              {status === "active" && users.length < 2 && "Väntar på att båda spelare öppnar duellrummet…"}
              {status === "active" && users.length >= 2 && !bothReady && 'Båda är inne — klicka "Jag är redo" för att börja.'}
              {status === "active" && users.length >= 2 && bothReady && "Båda är redo — startar…"}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-11 rounded-lg bg-[#6B6F8A] px-5 text-sm font-semibold text-white hover:brightness-110"
              >
                Tillbaka
              </button>

              {/* Ready toggle - Fixed conditions */}
              <button
                type="button"
                onClick={() => setReady(!myReady)}
                disabled={status !== "active" || users.length < 2}
                className={`h-11 rounded-lg px-5 text-sm font-semibold text-white ${myReady ? "bg-emerald-600" : "bg-[#1C294A]"
                  } ${status !== "active" || users.length < 2 ? "opacity-60 cursor-not-allowed" : "hover:brightness-110"}`}
              >
                {myReady ? "Jag är redo ✔" : "Jag är redo"}
              </button>

              {/* Manual start for debugging */}
              <button
                type="button"
                onClick={manualStart}
                disabled={!canStart}
                className={`h-11 rounded-lg px-5 text-sm font-semibold text-white ${canStart ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 opacity-60 cursor-not-allowed"
                  }`}
              >
                Force Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// helpers remain the same...
function PlayerCard({ label, avatarLetter, highlight = false, align = "left" }: {
  label: string; avatarLetter: string; highlight?: boolean; align?: "left" | "right";
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl bg-[#121a2f] px-4 py-3 ring-1 ring-white/10",
        align === "right" ? "justify-self-end" : "justify-self-start",
        highlight ? "outline outline-1 outline-emerald-400/60" : "",
      ].join(" ")}
      style={{ minWidth: 0 }}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold">
        {avatarLetter}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold leading-tight">{label}</div>
        <div className="text-xs text-white/60">{highlight ? "Redo" : "Inte redo"}</div>
      </div>
    </div>
  );
}

function SwordIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4.5l5 5-9 9H5.5v-5l9-9z" />
      <path d="M12 7l5 5" />
      <path d="M5.5 14.5L9 18" />
    </svg>
  );
}

function optionBtnClass(opt: QuestionOptionDto, selected: UUID | null, answered: boolean, timeLeft: number): string {
  const base =
    "relative w-full h-[56px] md:h-[60px] rounded-[14px] text-white text-[18px] md:text-[20px] font-semibold " +
    "flex items-center justify-center text-center transition focus:outline-none";
  const color = colorForOption(opt);
  const disabled = answered || timeLeft === 0;
  if (selected === opt.id && !disabled) return `${base} ${color} outline outline-[3px] outline-white`;
  return `${base} ${color} ${disabled ? "opacity-70 cursor-not-allowed" : "hover:brightness-[1.06] active:scale-[.99]"}`;
}

function colorForOption(opt: QuestionOptionDto): string {
  const variants = ["bg-[#4666FF]", "bg-[#6B4CE1]", "bg-[#31C75A]", "bg-[#E67E22]"];
  const idx = Math.abs(hashString(opt.id || String(opt.sortOrder))) % variants.length;
  return variants[idx];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}