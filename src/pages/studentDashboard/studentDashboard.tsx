import React, { useEffect, useState } from "react";

import { AuthApi, Classes } from "../../Api/index";

import avatar from "../../assets/images/avatar/avatar2.png";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import trophy from "../../assets/images/icons/trophy-icon.png";
import funfact from "../../assets/images/pictures/fun-fact-pic.png";
import rank from "../../assets/images/icons/ranking-icon.png";
import pointsIcon from "../../assets/images/icons/score-icon.png";
import questionmark from "../../assets/images/pictures/questionmark-pic.png";
import topplistPoints from "../../assets/images/icons/score-icon.png";
import { useNavigate } from "react-router-dom";


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

  // Alias till API-metoden (funktionsreferens – anropas i useEffect)
  const getMe = AuthApi.getMe;

  // useEffect för username, score/experiencepoints och ranking
  useEffect(() => {
    (async () => {
      try {
        const me = await AuthApi.getMe(); // hämtar inloggad + id

        // namn + mail
        const name =
          me.userName?.trim() || me.email?.split("@")[0] || "Användare";
        setDisplayName(name);
        setEmail(me.email ?? "");

        // poäng
        const xp = await Classes.GetLoggedInUserScore(me.id); // /api/Class/user/{userId}/points
        setPoints(typeof xp === "number" ? xp : 0);

        // 🧠 hämta mina klasser (vi tar första hittade)
        const myClasses = await Classes.GetUsersClasses();
        const first = myClasses?.[0];
        // fallback om backend skickar 'id' eller 'classId' i olika format
        const classId =
          first?.classId ?? first?.id ?? first?.ClassId ?? first?.Id;

        // 🧠 hämta leaderboard (hela klassen) + min ranking i ETT anrop
        if (!classId) {
          setRankNum(null);
          setTopThree([]);
          return;
        }

        const { leaderboard, myRank } = await Classes.GetClassLeaderboard(
          classId,
          me.id
        );
        setRankNum(myRank); // kan bli null om inte medlem/ej hittad
        setTopThree(leaderboard.slice(0, 3)); // topp 3 till rutan
      } catch (e) {
        console.error("Kunde inte hämta profil/poäng/ranking:", e);
        setDisplayName("Användare");
        setEmail("");
        setPoints(0);
        setRankNum(null);
        setTopThree([]);
      }
    })();
  }, []);

  // API ANROP FÖR ATT HÄMTA ENS KLASS, behövs ej på denna page
  //   var res = Classes.MyClasses;

  // funktion för att hämta studentens klass
  // async function handleMyClassClick() {
  //   const list = await res(); // <-- nu körs API-anropet
  //   if (!list?.length) {
  //     alert("Du är inte med i någon klass ännu.");
  //     return;
  //   }
  //   navigate("/min-klass", { state: { classId: list[0].id } });
  // }

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
                onClick={() => navigate("/quizniva")} // Vilken sida ska jag navigera till?
                className="w-full rounded-2xl bg-[#3BCC52] px-5 py-4 text-left text-lg font-bold text-white"
              >
                Starta Quiz
              </button>

              <button
                onClick={() => navigate("/min-klass")} // sida ej skapad
                className="w-full rounded-2xl bg-[#5827C6] px-5 py-4 text-left text-lg font-bold text-white"
              >
                Min klass
              </button>

              <button
                onClick={() => navigate("/prestationer")} // sida ej skapad
                className="flex w-full items-center gap-3 rounded-2xl bg-[#DA6410] px-5 py-4 text-lg font-bold text-white"
              >
                <img src={trophy} alt="Trophy" className="h-8 w-6" />
                Prestationer
              </button>
            </div>

            {/* Fun fact */}
            <section className="mt-3 rounded-2xl bg-[#3D1C87] p-4">
              <div className="mb-2 flex items-center gap-2">
                <img src={funfact} alt="Fun fact" className="h-9 w-9" />
                <h2 className="text-lg font-extrabold">Fun fact!</h2>
              </div>
              <p className="text-sm text-white/85">
                Visste du att världens längsta flod är Nilen?
              </p>
              <p className="mt-2 text-sm text-white/70">
                Albert Einstein fick Nobelpriset 1921 för den fotoelektriska
                effekten (inte relativitetsteorin).
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

              {/* CTA som överlappar nederkanten */}
              <button className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#5827C6] px-6 py-3 font-semibold text-white shadow">
                Svara på dagens Quiz
              </button>
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
                      // ⬇️ tar userName, kapar vid "@", trimmar, och fall back till "Okänd"
                      name={(p.userName ?? "").split("@")[0].trim() || "Okänd"}
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

              <div className="mt-3 rounded-xl bg-[#FBA500] px-3 py-2 font-extrabold text-black">
                🔥 5 dagar i rad
              </div>

              <div className="mt-3 rounded-xl bg-black/20 p-3">
                <div className="text-sm font-semibold">Veckomål</div>
                <div className="text-xs text-white/80">
                  Quiz genomförda: 2/3
                </div>
                <div className="mt-2 h-3 w-full rounded-full bg-black/40">
                  <div
                    className="h-3 rounded-full bg-[#3BCC52]"
                    style={{ width: "66%" }}
                  />
                </div>
              </div>

              <button className="mt-3 w-full rounded-xl bg-[#FFBE2F] px-5 py-3 font-semibold text-black">
                Fortsätt streaken
              </button>
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
