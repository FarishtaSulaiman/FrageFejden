import React, { useEffect, useState } from "react";
import {
  AuthApi,
  Classes,
  getFunFact,
  type FunFact,
  DailyApi,
} from "../../Api/index";

import avatar from "../../assets/images/avatar/avatar2.png";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import trophy from "../../assets/images/icons/trophy-icon.png";
import funfact from "../../assets/images/pictures/fun-fact-pic.png";
import rank from "../../assets/images/icons/ranking-icon.png";
import pointsIcon from "../../assets/images/icons/score-icon.png";
import questionmark from "../../assets/images/pictures/questionmark-pic.png";
import topplistPoints from "../../assets/images/icons/score-icon.png";
import { useNavigate } from "react-router-dom";
import { DailyQuizModal } from "../../components/DailyQuizModal";


type DailyStats = {
  totalAnswered: number;
  currentStreak: number;
  longestStreak: number;
  lastAnsweredDate: string | null;
  weekAnswered: number;
  weekGoal: number;
};

function normalizeStats(raw: any): DailyStats {
  if (!raw || typeof raw !== "object") {
    return {
      totalAnswered: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastAnsweredDate: null,
      weekAnswered: 0,
      weekGoal: 5,
    };
  }

  const totalAnswered = Number(
    raw.TotalAnswered ?? raw.totalAnswered ?? raw.total_answered ?? 0
  );

  const currentStreak = Number(
    raw.CurrentStreak ?? raw.currentStreak ?? raw.current_streak ?? 0
  );

  const longestStreak = Number(
    raw.LongestStreak ?? raw.longestStreak ?? raw.longest_streak ?? 0
  );

  const lastAnsweredDate =
    raw.LastAnsweredDate ??
    raw.lastAnsweredDate ??
    raw.last_answered_date ??
    null;

      const weekAnswered = Number(
        raw.WeekAnswered ?? raw.weekAnswered ?? raw.week_answered ?? 0
      );
      const weekGoal = Number(
        raw.WeekGoal ?? raw.weekGoal ?? raw.week_goal ?? 5
      );

  return {
    totalAnswered,
    currentStreak,
    longestStreak,
    lastAnsweredDate: lastAnsweredDate ? String(lastAnsweredDate) : null,
    weekAnswered,
    weekGoal,
  };
}


export default function StudentDashboardPage() {
  const navigate = useNavigate();

  // Spara namn och mail på användaren
  const [displayName, setDisplayName] = useState("Användare");
  const [email, setEmail] = useState("");
  // useState för score/experiencepoints
  const [points, setPoints] = useState<number>(0);

  // rank
  const [rankNum, setRankNum] = useState<number | null>(null);
  const [topThree, setTopThree] = useState<any[]>([]);

  // useState för funfact
  const [fact, setFact] = useState<string>("");

  // useState för modal dagens mini quiz
  const [openDaily, setOpenDaily] = useState(false);

  // useState för stats, se ens streaks
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  // Alias till API-metoden (funktionsreferens – anropas i useEffect)
  const getMe = AuthApi.getMe;

  // useEffect för username, score/experiencepoints, ranking, funfact och dailyStreak
  useEffect(() => {
    (async () => {
      try {
        const me = await AuthApi.getMe(); // hämtar inloggad + id

        // namn + mail
        //   const name =
        //     me.FullName?.trim() ||
        // me.userName?.trim() ||
        // me.email?.split("@")[0] ||
        // "Användare";

        const name = me.fullName ?? "";
        setDisplayName(name);

        // poäng
        const xp = await Classes.GetLoggedInUserScore(me.id);
        setPoints(typeof xp === "number" ? xp : 0);

        // hämta mina klasser
        const myClasses = await Classes.GetUsersClasses();
        const first = myClasses?.[0];
        const classId =
          first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id;

        if (classId) {
          const { leaderboard, myRank } = await Classes.GetClassLeaderboard(
            classId,
            me.id
          );
          setRankNum(myRank);
          setTopThree(leaderboard.slice(0, 3));
        } else {
          setRankNum(null);
          setTopThree([]);
        }

        // Hämta fun fact oavsett classId
        try {
          const f = await getFunFact();
          setFact(f.text || "Ingen fun fact just nu.");
        } catch {
          setFact("Ingen fun fact just nu.");
        }
      } catch (e) {
        console.error("Kunde inte hämta profil/poäng/ranking:", e);
        setDisplayName("Användare");
        setEmail("");
        setPoints(0);
        setRankNum(null);
        setTopThree([]);
      }

      // Hämta progress (streak + veckomål)
      try {
        const serverResponse = await DailyApi.getStats(); // hämtar rådata från backend
        const normalizedStats = normalizeStats(serverResponse); // mappa till camelCase
        setStats(normalizedStats); // spara i state
      } catch (error: any) {
        console.error("Kunde inte hämta /daily/stats:", error);
        setStatsErr(error?.message ?? "Kunde inte hämta progress.");
      }

    })();
  }, []);


        async function refreshDailyStats() {
          try {
            const serverResponse = await DailyApi.getStats(); // GET /api/daily/stats
            const normalizedStats = normalizeStats(serverResponse); // PascalCase → camelCase
            setStats(normalizedStats);
          } catch (error: any) {
            console.error("Kunde inte hämta /daily/stats:", error);
            setStatsErr(error?.message ?? "Kunde inte hämta progress.");
          }
        }

  return (
    <div className="bg-[#080923] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* TOPPSTRIP */}
        <div className="mb-3 rounded-2xl border border-white/5 bg-[#0F1369] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Användaravatar"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
              />
              <span className="font-semibold">Hej {displayName}!</span>
              {/* <span className="block text-xs opacity-70">{email}</span> */}
            </div>

            <input
              placeholder="Sök…."
              className="w-full rounded-full bg-black/30 px-4 py-2 text-sm placeholder:text-white/60 md:max-w-md"
            />

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <img src={rank} alt="Ranking" className="h-8 w-6" />
                <span>{rankNum ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={pointsIcon} alt="Points" className="h-6 w-6" />
                <span>{points}</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRID: vänster / mitten / höger kolumnerna*/}
        <div className="grid gap-6 md:grid-cols-[280px,1fr,280px]">
          {/* VÄNSTER KOLUMNEN */}
          <div className="flex flex-col">
            {/* FRÅGEFEJDEN – stor, centrerad, beskär transparent kant */}
            <div className="mx-auto flex h-[120px] w-full max-w-[420px] items-center justify-center overflow-hidden md:h-[150px]">
              <img
                src={frageTitle}
                alt="FrågeFejden"
                className="h-[220%] w-auto md:h-[260%]"
              />
            </div>

            {/* Knappar */}
            <div className="mt-2 space-y-3">
              <button
                onClick={() => navigate("/QuizVyStudent")}
                className="w-full rounded-2xl bg-[#3BCC52] px-5 py-4 text-left text-lg font-bold text-white"
              >
                Starta Quiz
              </button>

              <button
                onClick={() => navigate("/leaderboard")}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#DA6410] px-5 py-4 text-lg font-bold text-white"
              >
                <img src={trophy} alt="Trophy" className="h-8 w-6" />
                Prestationer
              </button>
            </div>

            {/* Fun fact */}
            <section className="mt-3 rounded-2xl bg-[#3D1C87] p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <img src={funfact} alt="Fun fact" className="h-10 w-10" />
                <div>
                  <h2 className="text-lg font-extrabold">Fun fact</h2>
                  <p className="text-sm text-white/70">Visste du att…</p>
                </div>
              </div>

              <p className="text-base leading-relaxed text-white/90">
                {fact || "Hämtar fun fact…"}
              </p>
            </section>
          </div>

          {/* MITTEN KOLUMNEN – STORT VITT KORT */}
          <div className="mt-6 md:mt-10">
            <div className="relative mx-auto w-full max-w-[620px] md:max-w-[660px]">
              {/* VITA KORTET */}
              <div className="rounded-2xl bg-white p-8 text-[#1b1b1b] shadow-lg md:p-12 mx-auto max-w-[510px]">
                <div className="mx-auto mb-5 h-6 w-12 rounded-full bg-black/10" />

                {/* Text + bild */}
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr,360px]">
                  <h3 className="text-center text-3xl font-extrabold md:text-left md:text-4xl whitespace-nowrap leading-tight">
                    Dagens Quiz
                  </h3>

                  {/* Frågeteckenbilden position */}
                  <img
                    src={questionmark}
                    alt="Frågetecken"
                    className="justify-self-end w-40 md:w-[320px] -translate-x-2 md:-translate-x-28"
                  />
                </div>
              </div>

              {/* Svara på dagens quiz knapp */}
              <button
                onClick={() => setOpenDaily(true)} //  öppnar modalen
                className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#5827C6] px-6 py-3 font-semibold text-white shadow"
              >
                Svara på dagens Quiz
              </button>

              {openDaily && (
                <DailyQuizModal
                  onClose={() => setOpenDaily(false)}
                  onAnswered={refreshDailyStats}
                />
              )}
            </div>
          </div>

          {/* HÖGER KOLUMN – Topplista + Mål & streak (ligger högre än det stora vita kortet) */}
          <div className="mt-1 space-y-4 md:mt-2">
            {/* Topplista */}
            <section className="rounded-2xl bg-[#3D1C87] p-4">
              <h2 className="text-lg font-extrabold">Topplista</h2>
              <div className="mt-3 space-y-3 text-sm">
                {topThree.length ? (
                  topThree.map((p) => (
                    <Row
                      key={p.userId}
                      name={
                        (p.fullName ?? "").trim() ||
                        (p.userName ?? "").split("@")[0].trim() ||
                        "Okänd"
                      }
                      points={String(p.score)}
                    />
                  ))
                ) : (
                  <div className="text-sm opacity-70">Ingen topplista ännu</div>
                )}
              </div>
            </section>

            {/* Mål & streak */}
            <section className="rounded-2xl bg-[#0F1369] p-4">
              <h2 className="text-lg font-extrabold">Mål & streak</h2>

              {!stats && !statsErr && (
                <div className="mt-3 text-sm text-white/70">
                  Hämtar statistik…
                </div>
              )}
              {statsErr && (
                <div className="mt-3 rounded-md bg-red-500/20 p-3 text-sm text-red-200">
                  {statsErr}
                </div>
              )}

              {stats && (
                <>
                  {/* 🔥 Streak */}
                  <div className="mt-3 rounded-xl bg-[#FBA500] px-3 py-2 font-extrabold text-black">
                    🔥 {stats.currentStreak} dagar i rad
                  </div>

                  {/* Längsta streak (extra rad) */}
                  <div className="mt-2 text-xs text-white/70">
                    Längsta streak: {stats.longestStreak} dagar
                  </div>

                  {/* Veckomål */}
                  <div className="mt-3 rounded-xl bg-black/20 p-3">
                    <div className="text-sm font-semibold">Veckomål</div>
                    <div className="text-xs text-white/80">
                      Quiz genomförda:{" "}
                      {Math.min(stats.weekAnswered, stats.weekGoal)}/
                      {stats.weekGoal}
                    </div>
                    <div className="mt-2 h-3 w-full rounded-full bg-black/40">
                      <div
                        className="h-3 rounded-full bg-[#3BCC52]"
                        style={{
                          width: `${
                            (Math.min(stats.weekAnswered, stats.weekGoal) /
                              stats.weekGoal) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Senast besvarad */}
                  {stats.lastAnsweredDate && (
                    <div className="mt-2 text-xs text-white/60">
                      Senast besvarad:{" "}
                      {String(stats.lastAnsweredDate).slice(0, 10)}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>

        {/* bottenluft */}
        <div className="mt-10 h-8" />
      </div>
    </div>
  );
}

/* --- småkomponenter--- */
function Row({ name, points }: { name: string; points: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-black font-bold">
          {name[0]}
        </div>
        <span className="font-semibold">{name}</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="opacity-90">{points}</span>
        <img src={topplistPoints} alt="Poäng" className="h-5 w-5" />
      </div>
    </div>
  );
}
