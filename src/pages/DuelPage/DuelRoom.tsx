import React from "react";
import { useRoomTransport } from "../../lib/duelTransport"; // adjust path if your folder differs
import globe from "../../assets/images/icons/geografy-icon.png"; // adjust if needed

// --- DTO-aligned shapes ---
type UUID = string;
type DuelStatus = "pending" | "active" | "completed" | "round_complete" | string;
type QuestionType = string;
type Difficulty = "Easy" | "Medium" | "Hard" | string;

type QuestionOptionDto = { id: UUID; optionText: string; sortOrder: number };

type QuestionDto = {
  id: UUID;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  explanation?: string | null;
  options: QuestionOptionDto[];
};

type Player = {
  id: UUID;
  name: string;
  avatarUrl?: string | null;
  ready: boolean;
  score: number;
  answeredAtMs?: number | null;
  selectedOptionId?: UUID | null;
  isConnected: boolean;
};

type RoomState = {
  roomId: string;
  status: DuelStatus;
  bestOf: number;
  roundNumber: number;
  roundTimeLimitSeconds: number;
  startedAt?: string | null;
  roundStartedAt?: string | null;
  players: Record<UUID, Player>;
  question: QuestionDto;
  correctOptionId: UUID;
  currentQuestionIndex: number;
};

// ----- Sample content (local demo only; swap to your APIs later) -----
const genId = () => Math.random().toString(36).slice(2);

const SAMPLE_QUESTIONS: Array<{ question: QuestionDto; correctId: UUID }> = [
  {
    question: {
      id: genId(),
      type: "MultipleChoice",
      difficulty: "Medium",
      stem: "Vilket land är störst till ytan i världen?",
      options: [
        { id: "cn", optionText: "Kina", sortOrder: 1 },
        { id: "us", optionText: "USA", sortOrder: 2 },
        { id: "ru", optionText: "Ryssland", sortOrder: 3 },
        { id: "ca", optionText: "Kanada", sortOrder: 4 },
      ],
    },
    correctId: "ru",
  },
  {
    question: {
      id: genId(),
      type: "MultipleChoice",
      difficulty: "Easy",
      stem: "Vad är huvudstaden i Sverige?",
      options: [
        { id: "got", optionText: "Göteborg", sortOrder: 1 },
        { id: "sto", optionText: "Stockholm", sortOrder: 2 },
        { id: "mal", optionText: "Malmö", sortOrder: 3 },
        { id: "upp", optionText: "Uppsala", sortOrder: 4 },
      ],
    },
    correctId: "sto",
  },
  {
    question: {
      id: genId(),
      type: "MultipleChoice",
      difficulty: "Hard",
      stem: "Vilken flod är längst i världen?",
      options: [
        { id: "nil", optionText: "Nilen", sortOrder: 1 },
        { id: "ama", optionText: "Amazonas", sortOrder: 2 },
        { id: "yan", optionText: "Yangtze", sortOrder: 3 },
        { id: "mis", optionText: "Mississippi", sortOrder: 4 },
      ],
    },
    correctId: "nil",
  },
  {
    question: {
      id: genId(),
      type: "MultipleChoice",
      difficulty: "Medium",
      stem: "Vilket berg är högst i världen?",
      options: [
        { id: "eve", optionText: "Mount Everest", sortOrder: 1 },
        { id: "k2", optionText: "K2", sortOrder: 2 },
        { id: "kan", optionText: "Kangchenjunga", sortOrder: 3 },
        { id: "lho", optionText: "Lhotse", sortOrder: 4 },
      ],
    },
    correctId: "eve",
  },
  {
    question: {
      id: genId(),
      type: "MultipleChoice",
      difficulty: "Easy",
      stem: "Vilket land har flest invånare?",
      options: [
        { id: "chi", optionText: "Kina", sortOrder: 1 },
        { id: "ind", optionText: "Indien", sortOrder: 2 },
        { id: "usa", optionText: "USA", sortOrder: 3 },
        { id: "bra", optionText: "Brasilien", sortOrder: 4 },
      ],
    },
    correctId: "ind",
  },
];

type Variant = "blue" | "purple" | "green" | "orange";
const COLOR: Record<Variant, string> = {
  blue: "bg-[#4666FF]",
  purple: "bg-[#6B4CE1]",
  green: "bg-[#31C75A]",
  orange: "bg-[#E67E22]",
};
const getOptionVariant = (optionId: string): Variant => {
  const variants: Variant[] = ["blue", "purple", "green", "orange"];
  let hash = 0;
  for (let i = 0; i < optionId.length; i++) {
    hash = ((hash << 5) - hash + optionId.charCodeAt(i)) & 0xffffffff;
  }
  return variants[Math.abs(hash) % variants.length];
};

// --- Per-tab identity so two normal tabs don't collide ---
function usePersistentUser() {
  const [userId] = React.useState<UUID>(() => {
    const sessionKey = sessionStorage.getItem("duel_session_user_id");
    if (sessionKey) return sessionKey;
    const base = localStorage.getItem("duel_user_id") || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem("duel_user_id", base);
    const perTab = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    sessionStorage.setItem("duel_session_user_id", perTab);
    return perTab;
  });

  const [name, setName] = React.useState<string>(() => localStorage.getItem("duel_user_name") || "Spelare");
  React.useEffect(() => localStorage.setItem("duel_user_name", name), [name]);
  return { userId, name, setName } as const;
}

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CrossIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function DuelRoom(): React.ReactElement {
  const { userId, name, setName } = usePersistentUser();
  const roomId = React.useMemo(() => new URLSearchParams(location.search).get("room") || "demo", []);

  const [state, setState] = React.useState<RoomState>(() => {
    const initial = SAMPLE_QUESTIONS[0];
    return {
      roomId,
      status: "pending",
      bestOf: 5,
      roundNumber: 1,
      roundTimeLimitSeconds: 30,
      startedAt: null,
      roundStartedAt: null,
      currentQuestionIndex: 0,
      players: {},
      question: initial.question,
      correctOptionId: initial.correctId,
    };
  });

  // Keep ref of "me" for handshake replies
  const meRef = React.useRef<{ id: UUID; name: string } | null>(null);
  React.useEffect(() => {
    meRef.current = { id: userId, name };
  }, [userId, name]);

  // Transport + handshake:
  // - on ACK (server acknowledged HELLO), ask others "WHO"
  // - on WHO, reply with JOIN so new clients discover you
  const onMessage = React.useCallback((data: any) => {
    if (!data || !data.type) return;

    if (data.type === "ACK") {
      send({ type: "WHO" });
      return;
    }
    if (data.type === "WHO") {
      const me = meRef.current;
      if (me) send({ type: "JOIN", player: { id: me.id, name: me.name, ready: false, isConnected: true } });
      return;
    }

    setState((s) => reducer(s, data));
  }, []); // send is stable from hook; safe here

  const { send, connected } = useRoomTransport(roomId, onMessage);

  const dispatch = (action: any) => {
    setState((s) => reducer(s, action));
    send(action);
  };

  // Auto-join when we have a name
  React.useEffect(() => {
    if (name.trim()) {
      dispatch({ type: "JOIN", player: { id: userId, name: name.trim(), ready: false, isConnected: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, userId]);

  // Timer logic
  const [timeLeft, setTimeLeft] = React.useState(state.roundTimeLimitSeconds);
  const roundActive = state.status === "active";

  React.useEffect(() => {
    if (roundActive && state.roundStartedAt) setTimeLeft(state.roundTimeLimitSeconds);
  }, [state.roundNumber, state.roundTimeLimitSeconds, roundActive, state.roundStartedAt]);

  React.useEffect(() => {
    if (!roundActive || !state.roundStartedAt) return;
    const startTime = new Date(state.roundStartedAt).getTime();
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, state.roundTimeLimitSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining > 0) raf = requestAnimationFrame(tick);
      else dispatch({ type: "ROUND_TIMEOUT" });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundActive, state.roundTimeLimitSeconds, state.roundStartedAt]);

  // Auto-advance after "round_complete"
  const prevStatusRef = React.useRef<DuelStatus>(state.status);
  React.useEffect(() => {
    if (prevStatusRef.current !== "round_complete" && state.status === "round_complete") {
      const t = setTimeout(() => dispatch({ type: "NEXT_ROUND" }), 1200);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = state.status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const me = state.players[userId];
  const others = Object.values(state.players).filter((p) => p.id !== userId);
  const other = others[0];
  const bothPresent = !!me && !!other;
  const bothReady = bothPresent && me.ready && other.ready;

  const btnClass = (opt: QuestionOptionDto): string => {
    const selected = me?.selectedOptionId === opt.id;
    const disabled = !roundActive || me?.answeredAtMs != null || timeLeft === 0;
    const variant = getOptionVariant(opt.id);
    const color = COLOR[variant];

    const base =
      "relative w-full h-[56px] md:h-[60px] rounded-[14px] " +
      "text-white text-[18px] md:text-[20px] font-semibold " +
      "flex items-center justify-center text-center " +
      "transition focus:outline-none";

    if (!disabled && selected) {
      return `${base} ${color} outline outline-[3px] outline-white`;
    }

    if (me?.answeredAtMs != null) {
      if (opt.id === state.correctOptionId && selected) return `${base} ${color} ring-2 ring-emerald-400`;
      if (selected) return `${base} ${color} opacity-70 ring-2 ring-rose-400`;
    }

    return `${base} ${color} ${disabled ? "opacity-70 cursor-not-allowed" : "hover:brightness-[1.06] active:scale-[.99]"}`;
  };

  const renderRightIcon = (opt: QuestionOptionDto) => {
    const isSel = me?.selectedOptionId === opt.id;
    if (!isSel) return null;

    if (me?.answeredAtMs == null) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }

    if (opt.id === state.correctOptionId) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <CheckIcon className="h-5 w-5 text-emerald-300 drop-shadow" />
        </span>
      );
    }

    return (
      <span className="absolute right-4 top-1/2 -translate-y-1/2">
        <CrossIcon className="h-5 w-5 text-rose-300 drop-shadow" />
      </span>
    );
  };

  // Actions
  const toggleReady = () => {
    if (!me) return;
    dispatch({ type: "READY", playerId: userId, ready: !me.ready });
  };

  const pickOption = (opt: QuestionOptionDto) => {
    if (!roundActive || !me || me.answeredAtMs != null || timeLeft === 0) return;
    dispatch({ type: "PICK", playerId: userId, optionId: opt.id });
  };

  const confirmAnswer = () => {
    if (!roundActive || !me || me.answeredAtMs != null || !me.selectedOptionId) return;
    dispatch({ type: "CONFIRM", playerId: userId });
  };

  const lowTime = timeLeft <= 10 && timeLeft > 0 && roundActive;

  return (
    <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
      <div className="mx-auto max-w-[980px] px-5 pt-10 pb-12">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">Geografi</h1>
          <img src={globe} alt="Geografi" className="h-8 w-8 md:h-9 md:w-9" />
        </div>
        <p className="mt-2 text-center text-[15px] text-white/85">
          Runda {state.roundNumber} av {state.bestOf}
        </p>

        <h2 className="mx-auto mt-6 max-w-[820px] text-center text-[26px] md:text-[28px] font-extrabold tracking-tight">
          {state.question.stem}
        </h2>

        {/* Timer */}
        <div className="mt-5 flex justify-center">
          <div className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0F1728] ring-2 ring-white">
              <span className="text-lg font-bold">{roundActive ? timeLeft : state.roundTimeLimitSeconds}</span>
            </div>
            <div className={`pointer-events-none absolute -inset-1 rounded-full ring-2 ${lowTime ? "ring-red-500" : "ring-emerald-400"}`} />
            {lowTime && <div className="pointer-events-none absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />}
          </div>
        </div>

        {/* Players header */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[me, other].filter(Boolean).map((p, idx) => (
            <div key={p!.id} className="flex items-center justify-between rounded-xl bg-[#121a2f] px-4 py-3 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-bold">
                  {p!.name?.slice(0, 1) || "?"}
                </div>
                <div>
                  <div className="text-[15px] font-semibold leading-tight">{idx === 0 ? `${p!.name} (Du)` : p!.name}</div>
                  <div className="text-xs text-white/70">
                    {p!.isConnected ? (p!.ready ? "Redo" : "Inte redo") : "Frånkopplad"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold">{p!.score}</div>
                <div className="text-xs text-white/60">Poäng</div>
              </div>
            </div>
          ))}
        </div>

        {/* Answer options */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {state.question.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={btnClass(opt)}
              onClick={() => pickOption(opt)}
              disabled={!roundActive || !me || me.answeredAtMs != null || timeLeft === 0}
              aria-pressed={me?.selectedOptionId === opt.id}
            >
              {opt.optionText}
              {renderRightIcon(opt)}
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={confirmAnswer}
            disabled={!roundActive || !me || !me.selectedOptionId || me.answeredAtMs != null}
            className={[
              "flex items-center justify-center",
              "h-12 w-[280px] rounded-[12px] text-[15px] font-semibold text-center",
              "transition",
              roundActive && me?.selectedOptionId && me?.answeredAtMs == null ? "bg-[#6B6F8A] hover:brightness-110" : "bg-[#6B6F8A]/60 cursor-not-allowed",
            ].join(" ")}
          >
            Bekräfta svar
          </button>
        </div>
      </div>

      {/* Waiting room modal */}
      {(!bothPresent || !bothReady || state.status === "pending") && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
          <div className="w-full max-w-md rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10">
            <h3 className="text-center text-2xl font-extrabold">Väntrum</h3>
            <p className="mt-1 text-center text-white/80">
              Rums-ID: <span className="font-mono text-white">{roomId}</span>
            </p>
            <p className="mt-1 text-center text-white/60 text-sm">
              WebSocket: {connected ? <span className="text-emerald-400">ansluten</span> : <span className="text-rose-400">frånkopplad</span>}
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-white/80">Ditt namn</label>
              <input
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none ring-1 ring-white/10 focus:ring-white/30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Skriv ditt namn"
              />
              <p className="text-xs text-white/60">
                Öppna sidan i en annan flik eller annan webbläsare och använd samma <b>?room={roomId}</b> för att ansluta som spelare 2.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {Object.values(state.players).map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-xl bg-[#121a2f] px-4 py-3 ring-1 ring-white/10">
                  <span className="text-sm">{player.id === userId ? `${player.name} (Du)` : player.name}</span>
                  <span
                    className={`text-xs ${!player.isConnected ? "text-red-400" : player.ready ? "text-emerald-400" : "text-white/70"
                      }`}
                  >
                    {!player.isConnected ? "Frånkopplad" : player.ready ? "Redo" : "Inte redo"}
                  </span>
                </div>
              ))}
            </div>

            {me && (
              <button
                type="button"
                onClick={toggleReady}
                disabled={!name.trim()}
                className={[
                  "mt-6 h-12 w-full rounded-[12px] text-[15px] font-semibold transition",
                  !name.trim() ? "bg-gray-600 cursor-not-allowed" : me.ready ? "bg-emerald-600 hover:brightness-110" : "bg-[#6B6F8A] hover:brightness-110",
                ].join(" ")}
              >
                {!name.trim() ? "Ange ditt namn först" : me.ready ? "Redo! (Klicka för att ångra)" : "Jag är redo"}
              </button>
            )}

            <div className="mt-3 text-center text-sm text-white/70">
              {!name.trim()
                ? "Ange ditt namn för att fortsätta"
                : bothPresent
                  ? bothReady
                    ? "Startar..."
                    : "Väntar på att båda spelare blir redo"
                  : "Väntar på spelare 2"}
            </div>
          </div>
        </div>
      )}

      {/* Round complete modal */}
      {state.status === "round_complete" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
          <div className="w-full max-w-md rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10">
            <h3 className="text-center text-2xl font-extrabold">Runda {state.roundNumber} slutförd!</h3>

            <div className="mt-4 space-y-2">
              <p className="text-center text-white/80">
                Rätt svar:{" "}
                <span className="text-emerald-400 font-semibold">
                  {state.question.options.find((opt) => opt.id === state.correctOptionId)?.optionText}
                </span>
              </p>

              <div className="mt-4 space-y-2">
                {Object.values(state.players)
                  .sort((a, b) => (a.answeredAtMs || Infinity) - (b.answeredAtMs || Infinity))
                  .map((player, index) => {
                    const wasCorrect = player.selectedOptionId === state.correctOptionId;
                    const pointsEarned = wasCorrect ? (index === 0 ? 3 : 2) : 0;

                    return (
                      <div key={player.id} className="flex items-center justify-between rounded-lg bg-[#121a2f] px-3 py-2">
                        <span className="text-sm">{player.id === userId ? `${player.name} (Du)` : player.name}</span>
                        <div className="flex items-center gap-2">
                          {wasCorrect ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <CrossIcon className="h-4 w-4 text-rose-400" />}
                          <span className="text-sm">+{pointsEarned} poäng</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-white/70">
              {state.roundNumber < state.bestOf ? "Nästa runda startar snart..." : "Spelet är slut!"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- Reducer & round logic -----------------
function reducer(state: RoomState, action: any): RoomState {
  switch (action.type) {
    case "JOIN": {
      const p = action.player as Partial<Player> & { id: UUID };
      const existing = state.players[p.id];
      return {
        ...state,
        players: {
          ...state.players,
          [p.id]: {
            id: p.id,
            name: p.name || existing?.name || "Spelare",
            avatarUrl: p.avatarUrl ?? existing?.avatarUrl ?? null,
            ready: p.ready ?? existing?.ready ?? false,
            score: existing?.score ?? 0,
            answeredAtMs: null,
            selectedOptionId: null,
            isConnected: p.isConnected ?? true,
          },
        },
      };
    }

    case "READY": {
      const { playerId, ready } = action as { playerId: UUID; ready: boolean };
      const player = state.players[playerId];
      if (!player) return state;

      const updated = {
        ...state,
        players: { ...state.players, [playerId]: { ...player, ready } },
      };

      const arr = Object.values(updated.players);
      const bothPresent = arr.length >= 2 && arr.every((p) => p.isConnected);
      const bothReady = bothPresent && arr.every((p) => p.ready);

      if (bothReady && state.status === "pending") {
        return startNewRound({
          ...updated,
          status: "active",
          startedAt: new Date().toISOString(),
          roundNumber: 1,
        });
      }
      return updated;
    }

    case "PICK": {
      if (state.status !== "active") return state;
      const { playerId, optionId } = action as { playerId: UUID; optionId: UUID };
      const player = state.players[playerId];
      if (!player) return state;
      return { ...state, players: { ...state.players, [playerId]: { ...player, selectedOptionId: optionId } } };
    }

    case "CONFIRM": {
      if (state.status !== "active") return state;
      const { playerId } = action as { playerId: UUID };
      const player = state.players[playerId];
      if (!player || !player.selectedOptionId || player.answeredAtMs != null) return state;

      const base = state.roundStartedAt || state.startedAt!;
      const answerTime = Date.now() - new Date(base).getTime();
      const updatedPlayer = { ...player, answeredAtMs: answerTime };
      const next = { ...state, players: { ...state.players, [playerId]: updatedPlayer } };
      return maybeFinishRound(next);
    }

    case "ROUND_TIMEOUT": {
      if (state.status !== "active") return state;
      const base = state.roundStartedAt || state.startedAt!;
      const timeoutTime = Date.now() - new Date(base).getTime();
      const nextPlayers: Record<UUID, Player> = {};
      for (const [id, p] of Object.entries(state.players)) {
        nextPlayers[id] = { ...p, answeredAtMs: p.answeredAtMs ?? timeoutTime };
      }
      return maybeFinishRound({ ...state, players: nextPlayers });
    }

    case "NEXT_ROUND": {
      const nextRoundNum = state.roundNumber + 1;
      if (nextRoundNum > state.bestOf) return { ...state, status: "completed" };
      const resetPlayers = Object.fromEntries(Object.values(state.players).map((p) => [p.id, { ...p, answeredAtMs: null, selectedOptionId: null }]));
      return startNewRound({ ...state, roundNumber: nextRoundNum, status: "active", players: resetPlayers });
    }

    default:
      return state;
  }
}

function startNewRound(state: RoomState): RoomState {
  const idx = state.currentQuestionIndex % SAMPLE_QUESTIONS.length;
  const { question, correctId } = SAMPLE_QUESTIONS[idx];
  return {
    ...state,
    status: "active",
    roundStartedAt: new Date().toISOString(),
    question,
    correctOptionId: correctId,
    currentQuestionIndex: idx + 1,
  };
}

/** Scoring:
 * - both correct: fastest +3, second +2
 * - one correct: that player +3
 * - none correct: +0
 * Returns a new state with status "round_complete".
 * (Component will auto-dispatch NEXT_ROUND after 1.2s, which broadcasts via WS.)
 */
function maybeFinishRound(state: RoomState): RoomState {
  const playersArr = Object.values(state.players);
  const allAnswered = playersArr.every((p) => p.answeredAtMs != null);
  if (!allAnswered) return state;

  const correct = playersArr.filter((p) => p.selectedOptionId === state.correctOptionId);
  const award: Record<UUID, number> = {};
  if (correct.length === 2) {
    const [first, second] = [...correct].sort((a, b) => (a.answeredAtMs! - b.answeredAtMs!));
    award[first.id] = 3;
    award[second.id] = 2;
  } else if (correct.length === 1) {
    award[correct[0].id] = 3;
  }

  const nextPlayers: Record<UUID, Player> = {};
  for (const p of playersArr) nextPlayers[p.id] = { ...p, score: p.score + (award[p.id] ?? 0) };

  return { ...state, status: "round_complete", players: nextPlayers };
}
