import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import globe from "../../assets/images/icons/geografy-icon.png";
import { DuelApi, type DuelDto, type QuestionOptionDto } from "../../Api/DuelApi/Duel";
import { AuthApi } from "../../Api";
import { useWsPresence, type PresenceUser } from "../../lib/useWsPresence";

// Debug configuration
const DEBUG = true;
const log = (...a: any[]) => DEBUG && console.log(new Date().toISOString(), "[DUEL]", ...a);
const warn = (...a: any[]) => DEBUG && console.warn(new Date().toISOString(), "[DUEL]", ...a);

// Types
type UUID = string;

interface PlayerAnswer {
  participantId: string;
  selectedOptionId: string;
  timeMs: number;
  timestamp: number;
  isCorrect?: boolean;
}

interface RoundResult {
  correctAnswerId: string | null;
  playerAnswers: PlayerAnswer[];
  scores: Record<string, number>;
}

interface GameStateData {
  state: "lobby" | "playing" | "waiting-for-results" | "showing-results" | "completed";
  roundIndex: number;
  timeLeft: number;
  showingAnswer: boolean;
  mySelection: UUID | null;
  hasSubmitted: boolean;
}

export default function DuelRoom(): React.ReactElement {
  const navigate = useNavigate();
  const params = useParams<{ duelId?: string }>();
  const [search] = useSearchParams();

  const duelId = React.useMemo<UUID | null>(() => {
    const id = (params.duelId as UUID) || (search.get("duelId") as UUID) || null;
    log("Mount DuelRoom, duelId:", id);
    return id;
  }, [params.duelId, search]);

  // Core state
  const [me, setMe] = React.useState<PresenceUser | null>(null);
  const [duel, setDuel] = React.useState<DuelDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = React.useState<GameStateData>({
    state: "lobby",
    roundIndex: 0,
    timeLeft: 30,
    showingAnswer: false,
    mySelection: null,
    hasSubmitted: false,
  });

  // Round data
  const [playerAnswers, setPlayerAnswers] = React.useState<Record<string, PlayerAnswer>>({});
  const [roundResult, setRoundResult] = React.useState<RoundResult | null>(null);
  const [scores, setScores] = React.useState<Record<string, number>>({});

  // UI feedback
  const [submitting, setSubmitting] = React.useState(false);
  const [resultMessage, setResultMessage] = React.useState<string>("");

  // Refs for stable closures
  const gameStateRef = React.useRef(gameState);
  const duelRef = React.useRef(duel);
  const playerAnswersRef = React.useRef(playerAnswers);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  React.useEffect(() => { duelRef.current = duel; }, [duel]);
  React.useEffect(() => { playerAnswersRef.current = playerAnswers; }, [playerAnswers]);

  const currentRound = duel?.rounds?.[gameState.roundIndex] || null;
  const timeLimitSeconds = currentRound?.timeLimitSeconds || 30;

  // Get current user info
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        log("Getting current user...");
        const user = await AuthApi.getMe();
        if (!alive) return;
        setMe({ id: user?.id ?? "", name: user?.fullName || "Jag" });
      } catch (e) {
        warn("Failed to get current user", e);
        if (alive) setMe({ id: "", name: "Jag" });
      }
    })();
    return () => { alive = false; };
  }, []);

  // Load duel data
  React.useEffect(() => {
    if (!duelId) {
      setError("Saknar duelId i URL:en.");
      setLoading(false);
      return;
    }

    let alive = true;
    loadDuel();

    async function loadDuel() {
      try {
        log("Loading duel:", duelId);
        const d = await DuelApi.getById(duelId);
        if (!alive) return;

        setDuel(d);
        setError(null);

        // Initialize scores
        const initialScores: Record<string, number> = {};
        d.participants.forEach(p => {
          initialScores[p.user.id] = p.score || 0;
        });
        setScores(initialScores);

        // Determine initial game state
        const status = normalizeStatus(d.status);
        if (status === "completed") {
          setGameState(prev => ({ ...prev, state: "completed" }));
        } else if (status === "active" && d.rounds.length > 0) {
          setGameState(prev => ({
            ...prev,
            state: "playing",
            timeLeft: d.rounds[0]?.timeLimitSeconds || 30
          }));
        } else {
          setGameState(prev => ({ ...prev, state: "lobby" }));
        }

        log("Duel loaded successfully", { status, rounds: d.rounds.length });
      } catch (e: any) {
        if (!alive) return;
        const errorMsg = e?.response?.data || e?.message || "Kunde inte hämta duellen.";
        setError(errorMsg);
        warn("Failed to load duel:", errorMsg);
      } finally {
        if (alive) setLoading(false);
      }
    }

    return () => { alive = false; };
  }, [duelId]);

  // Helper functions
  const normalizeStatus = (status: any): string => {
    if (typeof status === "number") {
      switch (status) {
        case 0: return "pending";
        case 1: return "active";
        case 2: return "completed";
        default: return "pending";
      }
    }
    return String(status || "pending").toLowerCase();
  };

  const status = React.useMemo(() => normalizeStatus(duel?.status), [duel?.status]);

  // Get participant info
  const meParticipant = React.useMemo(() =>
    duel?.participants.find(p => p.isCurrentUser), [duel]);

  const presenceMe = React.useMemo<PresenceUser | null>(() => {
    if (!meParticipant) return null;
    return {
      id: meParticipant.id,
      name: meParticipant.user.fullName || me?.name || "Jag"
    };
  }, [meParticipant, me?.name]);

  const myParticipantId: string | null = meParticipant?.id ?? null;
  const needsToAccept = status === "pending" && !!meParticipant?.invitedBy;

  // Determine leader (smallest participant ID)
  const leaderPid = React.useMemo(() => {
    if (!duel?.participants) return null;
    const sortedIds = duel.participants.map(p => p.id).sort();
    return sortedIds[0] ?? null;
  }, [duel]);
  const iAmLeader = !!myParticipantId && !!leaderPid && myParticipantId === leaderPid;

  // WebSocket presence
  const roomId = duelId ? `duel-${duelId}` : "";
  const { connected, users, setReady, sendMessage: wsSendMessage, onMessage } =
    useWsPresence(roomId, presenceMe);

  // Handle WebSocket messages
  React.useEffect(() => {
    const cleanup = onMessage((data: any) => {
      log("Received WS message:", data.type);

      switch (data.type) {
        case "player_answered": {
          const currentState = gameStateRef.current;
          if (data.roundIndex !== currentState.roundIndex) {
            log("Ignoring stale player_answered message");
            return;
          }

          const currentDuel = duelRef.current;
          if (!currentDuel) return;

          const expectedQuestionId = currentDuel.rounds[currentState.roundIndex]?.question?.id;
          if (data.questionId !== expectedQuestionId) {
            log("Question ID mismatch, ignoring");
            return;
          }

          // Store the answer from other player
          if (data.participantId && data.participantId !== myParticipantId) {
            const answer: PlayerAnswer = {
              participantId: data.participantId,
              selectedOptionId: data.answer?.selectedOptionId,
              timeMs: data.answer?.timeMs,
              timestamp: data.answer?.timestamp ?? Date.now(),
            };

            setPlayerAnswers(prev => ({
              ...prev,
              [data.participantId]: answer
            }));
            log("Stored opponent answer:", answer);
          }
          break;
        }

        case "round_complete": {
          const currentState = gameStateRef.current;
          if (data.roundIndex !== currentState.roundIndex) {
            log("Ignoring stale round_complete message");
            return;
          }

          log("Round complete received:", data.result);
          setRoundResult(data.result);
          setScores(data.result.scores);

          // Update game state to show results
          setGameState(prev => ({
            ...prev,
            state: "showing-results",
            showingAnswer: true
          }));

          // Show result message
          if (myParticipantId) {
            const myAnswer = data.result.playerAnswers.find(
              (a: PlayerAnswer) => a.participantId === myParticipantId
            );
            const isCorrect = myAnswer &&
              data.result.correctAnswerId &&
              myAnswer.selectedOptionId === data.result.correctAnswerId;

            setResultMessage(isCorrect ? "Rätt svar! 🎉" : "Fel svar 😔");
          }

          // Auto-advance after showing results
          setTimeout(() => {
            advanceRound();
          }, 3000);
          break;
        }

        case "game_started": {
          log("Game started message received");
          reloadDuelAndStart();
          break;
        }

        case "player_disconnected": {
          log("Player disconnected:", data.participantId);
          // Could show a notification here
          break;
        }

        default:
          log("Unknown message type:", data.type);
          break;
      }
    });

    return cleanup;
  }, [onMessage, myParticipantId, duelId]);

  const reloadDuelAndStart = async () => {
    if (!duelId) return;

    try {
      const fresh = await DuelApi.getById(duelId);
      setDuel(fresh);

      const freshStatus = normalizeStatus(fresh.status);
      if (freshStatus === "active" && fresh.rounds.length > 0) {
        resetForNewRound(0, fresh.rounds[0]?.timeLimitSeconds || 30);
        setGameState(prev => ({
          ...prev,
          state: "playing",
          roundIndex: 0
        }));
      }
    } catch (e) {
      warn("Failed to reload duel after game start:", e);
    }
  };

  // Ready state management
  const myReady = React.useMemo(() => {
    if (!presenceMe) return false;
    return !!users.find(u => u.id === presenceMe.id)?.ready;
  }, [users, presenceMe]);

  const otherReady = React.useMemo(() => {
    if (!presenceMe) return false;
    const other = users.find(u => u.id !== presenceMe.id);
    return !!other?.ready;
  }, [users, presenceMe]);

  const bothPresent = users.length >= 2;
  const bothReady = bothPresent && myReady && otherReady;

  // Timer management
  React.useEffect(() => {
    if (gameState.state !== "playing" || !currentRound) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start timer for this round
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimitSeconds - elapsed);

      setGameState(prev => ({ ...prev, timeLeft: remaining }));

      if (remaining === 0) {
        // Time's up - auto submit if player has made a selection
        const currentState = gameStateRef.current;
        if (currentState.mySelection && !currentState.hasSubmitted) {
          log("Time's up, auto-submitting answer");
          submitAnswer(currentState.mySelection);
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.state, gameState.roundIndex, currentRound?.question?.id]);

  // Game actions
  const acceptInvitation = async () => {
    if (!duelId) return;

    try {
      await DuelApi.accept({ duelId });
      const updatedDuel = await DuelApi.getById(duelId);
      setDuel(updatedDuel);
      log("Invitation accepted");
    } catch (e: any) {
      const errorMsg = e?.response?.data || e?.message || "Kunde inte acceptera inbjudan.";
      alert(errorMsg);
      warn("Failed to accept invitation:", errorMsg);
    }
  };

  const startGame = async () => {
    if (!duelId || !bothReady || !iAmLeader) return;

    try {
      log("Starting game...");
      await DuelApi.start(duelId);

      // Reload duel to get rounds
      const fresh = await DuelApi.getById(duelId);
      setDuel(fresh);

      if (normalizeStatus(fresh.status) === "active" && fresh.rounds.length > 0) {
        resetForNewRound(0, fresh.rounds[0]?.timeLimitSeconds || 30);
        setGameState(prev => ({
          ...prev,
          state: "playing",
          roundIndex: 0
        }));

        // Notify other players
        wsSendMessage({ type: "game_started" });
        log("Game started successfully");
      } else {
        // Just notify others even if we don't have rounds yet
        wsSendMessage({ type: "game_started" });
      }
    } catch (e: any) {
      const errorMsg = e?.response?.data || e?.message || "Kunde inte starta duellen.";
      alert(errorMsg);
      warn("Failed to start game:", errorMsg);
    }
  };

  const selectOption = (optionId: string) => {
    const currentState = gameStateRef.current;

    if (currentState.state !== "playing") return;
    if (currentState.timeLeft === 0) return;
    if (currentState.hasSubmitted) return;

    log("Option selected:", optionId);
    setGameState(prev => ({
      ...prev,
      mySelection: optionId
    }));
  };

  const submitAnswer = async (selectedOptionId?: string) => {
    const optionId = selectedOptionId || gameState.mySelection;
    if (!optionId || !myParticipantId || !currentRound || !duel) return;

    const currentState = gameStateRef.current;
    if (currentState.hasSubmitted) return;

    setSubmitting(true);

    try {
      const questionId = currentRound.question.id;
      const timeMs = (timeLimitSeconds - currentState.timeLeft) * 1000;

      log("Submitting answer:", { questionId, optionId, timeMs });

      await DuelApi.submitAnswer({
        duelId: duel.id,
        questionId,
        selectedOptionId: optionId,
        timeMs
      });

      const answer: PlayerAnswer = {
        participantId: myParticipantId,
        selectedOptionId: optionId,
        timeMs,
        timestamp: Date.now()
      };

      // Update local state
      setPlayerAnswers(prev => ({ ...prev, [myParticipantId]: answer }));
      setGameState(prev => ({
        ...prev,
        hasSubmitted: true,
        state: "waiting-for-results"
      }));

      // Notify other players
      wsSendMessage({
        type: "player_answered",
        participantId: myParticipantId,
        roundIndex: currentState.roundIndex,
        questionId,
        answer
      });

      log("Answer submitted successfully");
    } catch (e: any) {
      const errorMsg = e?.response?.data || e?.message || "Kunde inte skicka ditt svar.";
      alert(errorMsg);
      warn("Failed to submit answer:", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if round is complete and emit results (leader only)
  React.useEffect(() => {
    if (!iAmLeader || !duel || gameState.state !== "waiting-for-results") return;

    const requiredParticipants = duel.participants.map(p => p.id);
    const currentAnswers = playerAnswersRef.current;

    // Check if all players have answered
    const allAnswered = requiredParticipants.every(pid => currentAnswers[pid]);

    if (allAnswered) {
      emitRoundComplete();
    }
  }, [playerAnswers, gameState.state, iAmLeader]);

  const emitRoundComplete = () => {
    if (!duel || !currentRound) return;

    const correctOptionId = resolveCorrectOptionId();
    const currentAnswers = playerAnswersRef.current;

    // Calculate new scores
    const newScores = { ...scores };
    if (correctOptionId) {
      duel.participants.forEach(participant => {
        const answer = currentAnswers[participant.id];
        if (answer && answer.selectedOptionId === correctOptionId) {
          const speedBonus = Math.max(1, Math.floor((timeLimitSeconds * 1000 - answer.timeMs) / 1000));
          newScores[participant.user.id] = (newScores[participant.user.id] || 0) + speedBonus;
        }
      });
    }

    const result: RoundResult = {
      correctAnswerId: correctOptionId,
      playerAnswers: Object.values(currentAnswers).filter(Boolean),
      scores: newScores
    };

    log("Emitting round complete:", result);

    setRoundResult(result);
    setScores(newScores);
    setGameState(prev => ({
      ...prev,
      state: "showing-results",
      showingAnswer: true
    }));

    // Show personal result
    if (myParticipantId) {
      const myAnswer = currentAnswers[myParticipantId];
      const isCorrect = myAnswer && correctOptionId && myAnswer.selectedOptionId === correctOptionId;
      setResultMessage(isCorrect ? "Rätt svar! 🎉" : "Fel svar 😔");
    }

    wsSendMessage({
      type: "round_complete",
      roundIndex: gameState.roundIndex,
      questionId: currentRound.question.id,
      result
    });

    // Auto-advance
    setTimeout(() => {
      advanceRound();
    }, 3000);
  };

  const resolveCorrectOptionId = (): string | null => {
    if (!currentRound) return null;

    return (
      (currentRound as any).correctAnswerId ||
      currentRound.question.correctOptionId ||
      currentRound.question.options.find(opt => (opt as any).isCorrect)?.id ||
      null
    );
  };

  const resetForNewRound = (roundIndex: number, timeLimit: number) => {
    setPlayerAnswers({});
    setRoundResult(null);
    setResultMessage("");
    setGameState(prev => ({
      ...prev,
      roundIndex,
      timeLeft: timeLimit,
      mySelection: null,
      hasSubmitted: false,
      showingAnswer: false,
      state: "playing"
    }));
    log("Reset for new round:", roundIndex);
  };

  const advanceRound = () => {
    if (!duel) return;

    const nextIndex = gameState.roundIndex + 1;
    log("Advancing to round:", nextIndex, "total:", duel.rounds.length);

    if (nextIndex < duel.rounds.length) {
      const nextRound = duel.rounds[nextIndex];
      resetForNewRound(nextIndex, nextRound?.timeLimitSeconds || 30);
    } else {
      // Game completed
      setGameState(prev => ({ ...prev, state: "completed" }));
      saveFinalResults();
    }
  };

  const saveFinalResults = async () => {
    if (!duelId) return;

    try {
      await DuelApi.complete(duelId);
      log("Final results saved");
    } catch (e) {
      warn("Failed to save final results:", e);
    }
  };

  // UI helper functions
  const getOptionClass = (option: QuestionOptionDto): string => {
    const baseClass =
      "relative w-full h-[56px] md:h-[60px] rounded-[14px] text-white text-[18px] md:text-[20px] font-semibold " +
      "flex items-center justify-center text-center transition focus:outline-none border-2 border-transparent";

    const isSelected = gameState.mySelection === option.id;
    const hasSubmitted = gameState.hasSubmitted;
    const isShowingAnswer = gameState.showingAnswer;
    const isCorrect = isShowingAnswer && roundResult?.correctAnswerId === option.id;
    const isMyWrongAnswer = isShowingAnswer && isSelected && roundResult?.correctAnswerId !== option.id;
    const timeUp = gameState.timeLeft === 0;

    let colorClass = getColorForOption(option);

    if (isShowingAnswer) {
      if (isCorrect) {
        colorClass = "bg-green-500 border-green-300";
      } else if (isMyWrongAnswer) {
        colorClass = "bg-red-500 border-red-300";
      } else {
        colorClass = "bg-gray-500 opacity-50";
      }
      return `${baseClass} ${colorClass}`;
    }

    if (isSelected) {
      return `${baseClass} ${colorClass} border-white scale-105 shadow-lg`;
    }

    const disabled = hasSubmitted || timeUp;
    const interactionClass = disabled
      ? "opacity-70 cursor-not-allowed"
      : "hover:brightness-110 hover:scale-105 active:scale-95 cursor-pointer";

    return `${baseClass} ${colorClass} ${interactionClass}`;
  };

  const getColorForOption = (option: QuestionOptionDto): string => {
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-green-600",
      "bg-orange-600"
    ];
    const index = Math.abs(hashString(option.id || String(option.sortOrder))) % colors.length;
    return colors[index];
  };

  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
  };

  // Component rendering
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <div className="mt-4 text-white/80">Laddar duell...</div>
        </div>
      </div>
    );
  }

  if (error || !duelId || !duel) {
    return (
      <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white grid place-items-center">
        <div className="text-center max-w-md">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-4 text-red-200">
            <h3 className="font-semibold mb-2">Ett fel inträffade</h3>
            <p className="text-sm">{error || "Kunde inte hitta duellen."}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Gå tillbaka
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Header = () => (
    <div className="flex items-center justify-center gap-3 mb-2">
      <h1 className="text-center text-[42px] md:text-[46px] font-extrabold leading-tight">
        {duel.subject?.name || "Ämne"}
      </h1>
      <img src={globe} alt={duel.subject?.name} className="h-8 w-8 md:h-9 md:w-9" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-46px)] bg-[#0A0F1F] text-white">
      <div className="mx-auto max-w-[980px] px-5 pt-10 pb-12">
        <Header />
        <p className="text-center text-[15px] text-white/85">Bäst av {duel.bestOf}</p>

        {/* Connection status */}
        {!connected && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-500/50 rounded text-yellow-200 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              Återansluter...
            </div>
          </div>
        )}

        {/* Game state indicator */}
        <div className="mt-4 text-center text-sm text-white/60">
          {gameState.state === "lobby" && "Väntar på att spelet ska börja..."}
          {gameState.state === "playing" && `Fråga ${gameState.roundIndex + 1} av ${duel.rounds.length}`}
          {gameState.state === "waiting-for-results" && "Väntar på andra spelaren..."}
          {gameState.state === "showing-results" && "Visar resultat..."}
          {gameState.state === "completed" && "Spelet är klart!"}
        </div>

        {/* Playing state */}
        {(gameState.state === "playing" || gameState.state === "waiting-for-results" || gameState.state === "showing-results") && currentRound && (
          <>
            <h2 className="mx-auto mt-6 max-w-[820px] text-center text-[26px] md:text-[28px] font-extrabold tracking-tight">
              {currentRound.question.stem}
            </h2>

            {/* Timer */}
            <div className="mt-5 flex justify-center">
              <div className="relative">
                <div className={`grid h-12 w-12 place-items-center rounded-full ring-2 ${gameState.timeLeft <= 10 && gameState.timeLeft > 0
                  ? "bg-red-900 ring-red-400"
                  : "bg-[#0F1728] ring-white"
                  }`}>
                  <span className="text-lg font-bold">{gameState.timeLeft}</span>
                </div>
                {gameState.timeLeft <= 10 && gameState.timeLeft > 0 && (
                  <div className="pointer-events-none absolute -inset-3 rounded-full bg-red-500/30 animate-ping" />
                )}
              </div>
            </div>

            {/* Result message */}
            {resultMessage && gameState.showingAnswer && (
              <div className="mt-4 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${resultMessage.includes("Rätt")
                  ? "bg-green-900/50 border border-green-500/50 text-green-200"
                  : "bg-red-900/50 border border-red-500/50 text-red-200"
                  }`}>
                  {resultMessage}
                </div>
              </div>
            )}

            {/* Players status */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {duel.participants.map((participant) => {
                const hasAnswered = !!playerAnswers[participant.id];
                const userScore = scores[participant.user.id] || 0;

                return (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${hasAnswered
                      ? "bg-green-900/20 ring-green-500/30"
                      : "bg-[#121a2f] ring-white/10"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${hasAnswered ? "bg-green-500/20 text-green-200" : "bg-white/10"
                        }`}>
                        {(participant.user.fullName || "?").slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold leading-tight">
                          {participant.isCurrentUser ? `${participant.user.fullName} (Du)` : participant.user.fullName}
                          {hasAnswered && <span className="ml-2 text-green-400">✓</span>}
                        </div>
                        <div className="text-xs text-white/70">
                          {hasAnswered ? "Svarat" : "Svarar..."}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold">{userScore}</div>
                      <div className="text-xs text-white/60">Poäng</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Question options */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {currentRound.question.options.map((option) => (
                <button
                  key={option.id || `opt-${option.sortOrder}`}
                  type="button"
                  className={getOptionClass(option)}
                  onClick={() => selectOption(option.id || "")}
                  disabled={gameState.hasSubmitted || gameState.timeLeft === 0 || gameState.showingAnswer}
                >
                  {option.optionText}
                </button>
              ))}
            </div>

            {/* Confirm button */}
            {gameState.state === "playing" && !gameState.hasSubmitted && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => submitAnswer()}
                  disabled={!gameState.mySelection || gameState.timeLeft === 0 || submitting}
                  className={`flex items-center justify-center h-12 w-[280px] rounded-[12px] text-[15px] font-semibold transition ${gameState.mySelection && gameState.timeLeft > 0 && !submitting
                    ? "bg-[#6B6F8A] hover:brightness-110 text-white"
                    : "bg-[#6B6F8A]/60 cursor-not-allowed text-white/60"
                    }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Skickar...
                    </>
                  ) : (
                    "Bekräfta svar"
                  )}
                </button>
              </div>
            )}

            {/* Detailed results during showing-results state */}
            {gameState.showingAnswer && roundResult && (
              <div className="mt-8 mx-auto max-w-md">
                <div className="bg-[#0F1728] rounded-xl p-6 ring-1 ring-white/10">
                  <h3 className="text-lg font-semibold text-center mb-4">Omgångens resultat</h3>
                  <div className="space-y-3">
                    {roundResult.playerAnswers.map((answer) => {
                      const participant = duel.participants.find(p => p.id === answer.participantId);
                      const isCorrect = roundResult.correctAnswerId &&
                        answer.selectedOptionId === roundResult.correctAnswerId;
                      const timeSeconds = (answer.timeMs / 1000).toFixed(1);

                      return (
                        <div
                          key={answer.participantId}
                          className={`flex items-center justify-between p-3 rounded-lg ${isCorrect ? "bg-green-900/30 border border-green-500/30" : "bg-red-900/30 border border-red-500/30"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={isCorrect ? "text-green-200" : "text-red-200"}>
                              {isCorrect ? "✓" : "✗"}
                            </span>
                            <span className="font-medium">
                              {participant?.user.fullName}
                              {participant?.isCurrentUser && " (Du)"}
                            </span>
                          </div>
                          <div className="text-sm text-white/70">
                            {timeSeconds}s
                            {isCorrect && (
                              <span className="ml-2 text-green-300">
                                +{Math.max(1, Math.floor((timeLimitSeconds * 1000 - answer.timeMs) / 1000))}p
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Completed state */}
        {gameState.state === "completed" && (
          <div className="mt-10 mx-auto max-w-lg rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10 text-center">
            <h3 className="text-3xl font-extrabold mb-6">🏆 Duellen avslutad!</h3>

            {/* Final scoreboard */}
            <div className="space-y-3 mb-6">
              {duel.participants
                .slice()
                .sort((a, b) => (scores[b.user.id] || 0) - (scores[a.user.id] || 0))
                .map((participant, index) => {
                  const userScore = scores[participant.user.id] || 0;
                  const isWinner = index === 0;

                  return (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 ${isWinner
                        ? "bg-yellow-900/30 border border-yellow-500/50"
                        : "bg-[#121a2f] border border-white/10"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isWinner ? "bg-yellow-500 text-black" : "bg-white/10"
                          }`}>
                          {index + 1}
                        </div>
                        <span className={`font-semibold ${isWinner ? "text-yellow-200" : ""}`}>
                          {participant.isCurrentUser ? `${participant.user.fullName} (Du)` : participant.user.fullName}
                        </span>
                        {isWinner && <span className="text-yellow-400">👑</span>}
                      </div>
                      <span className={`text-xl font-bold ${isWinner ? "text-yellow-200" : ""}`}>
                        {userScore}p
                      </span>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-11 rounded-lg bg-[#6B6F8A] hover:brightness-110 px-6 text-sm font-semibold text-white transition"
            >
              Tillbaka till lobbyn
            </button>
          </div>
        )}
      </div>

      {/* Lobby modal */}
      {gameState.state === "lobby" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0F1728] p-6 ring-1 ring-white/10">
            <h3 className="text-center text-2xl font-extrabold">Väntrum</h3>
            <p className="mt-1 text-center text-white/80">
              Ämne: <span className="font-semibold">{duel.subject.name}</span> • Bäst av {duel.bestOf}
            </p>

            {/* Debug info */}
            {DEBUG && (
              <p className="mt-1 text-center text-white/40 text-xs">
                Status: {status} | Rounds: {duel.rounds?.length ?? 0} | Connected: {connected ? "✓" : "✗"}
              </p>
            )}

            {/* Connection status */}
            {!connected && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  Ingen anslutning till servern
                </div>
              </div>
            )}

            {/* Invitation acceptance */}
            {needsToAccept && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg text-center">
                <p className="text-blue-200 mb-3">
                  Du har blivit inbjuden av <span className="font-semibold">{meParticipant?.invitedBy?.fullName}</span>
                </p>
                <button
                  onClick={acceptInvitation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
                >
                  Acceptera inbjudan
                </button>
              </div>
            )}

            {/* Player cards */}
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <PlayerCard
                label={
                  users[0]
                    ? `${users[0].name}${presenceMe && users[0].id === presenceMe.id ? " (Du)" : ""}`
                    : "Väntar på spelare..."
                }
                avatarLetter={users[0]?.name?.[0]?.toUpperCase() ?? "?"}
                ready={!!users[0]?.ready}
                present={!!users[0]}
              />

              <div className="mx-auto">
                <SwordIcon className="h-12 w-12 opacity-70" />
              </div>

              <PlayerCard
                label={
                  users[1]
                    ? `${users[1].name}${presenceMe && users[1].id === presenceMe.id ? " (Du)" : ""}`
                    : "Väntar på motståndare..."
                }
                avatarLetter={users[1]?.name?.[0]?.toUpperCase() ?? "?"}
                ready={!!users[1]?.ready}
                present={!!users[1]}
                align="right"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-11 rounded-lg bg-gray-600 hover:bg-gray-700 px-5 text-sm font-semibold text-white transition"
              >
                Lämna duell
              </button>

              {/* Ready toggle - only show when both players are present and game isn't completed */}
              {bothPresent && status !== "completed" && (
                <button
                  type="button"
                  onClick={() => setReady(!myReady)}
                  disabled={!connected || !presenceMe}
                  className={`h-11 rounded-lg px-5 text-sm font-semibold text-white transition ${myReady
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#1C294A] hover:bg-[#243454]"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {myReady ? "Redo ✓" : "Markera som redo"}
                </button>
              )}
            </div>

            {/* Start game button - only for leader when both ready */}
            {bothReady && iAmLeader && status !== "completed" && (
              <div className="mt-4 text-center">
                <button
                  onClick={startGame}
                  disabled={!connected}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/60 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold text-white transition"
                >
                  🚀 Starta duellen!
                </button>
              </div>
            )}

            {/* Waiting for leader */}
            {bothReady && iAmLeader === false && status !== "completed" && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  Väntar på att spelet startas...
                </div>
              </div>
            )}

            {/* Not ready status */}
            {!bothReady && bothPresent && (
              <div className="mt-4 text-center text-white/60 text-sm">
                {!myReady && !otherReady && "Båda spelare måste markera sig som redo"}
                {myReady && !otherReady && "Väntar på att motståndaren blir redo..."}
                {!myReady && otherReady && "Du måste markera dig som redo för att fortsätta"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
interface PlayerCardProps {
  label: string;
  avatarLetter: string;
  ready?: boolean;
  present?: boolean;
  align?: "left" | "right";
}

function PlayerCard({ label, avatarLetter, ready = false, present = false, align = "left" }: PlayerCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-[#121a2f] px-4 py-3 ring-1 transition ${ready
        ? "ring-emerald-400/60 bg-emerald-900/20"
        : present
          ? "ring-white/10"
          : "ring-white/5 opacity-60"
        } ${align === "right" ? "justify-self-end" : "justify-self-start"}`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${ready
        ? "bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-400/40"
        : present
          ? "bg-white/10"
          : "bg-white/5"
        }`}>
        {avatarLetter}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold leading-tight">{label}</div>
        <div className={`text-xs transition ${ready
          ? "text-emerald-300"
          : present
            ? "text-white/60"
            : "text-white/40"
          }`}>
          {present ? (ready ? "Redo" : "Inte redo") : "Offline"}
        </div>
      </div>
    </div>
  );
}

function SwordIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4.5l5 5-9 9H5.5v-5l9-9z" />
      <path d="M12 7l5 5" />
      <path d="M5.5 14.5L9 18" />
    </svg>
  );
}