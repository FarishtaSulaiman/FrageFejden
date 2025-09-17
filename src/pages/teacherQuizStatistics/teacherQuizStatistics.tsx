import React, { useEffect, useState } from "react";
import { AuthApi, Classes, TeacherClasses } from "../../Api/index";

import avatar from "../../assets/images/avatar/avatar2.png";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import bestResultsIcon from "../../assets/images/icons/best-result-icon.png";
import averageParticipantsIcon from "../../assets/images/icons/average-participants-icon.png";
import numOfQuizIcon from "../../assets/images/icons/num-of-quiz-created-icon.png";
import averageAnswerIcon from "../../assets/images/icons/average-correct-answers-icon.png";
import trophy from "../../assets/images/icons/trophy-icon.png";

import { useNavigate } from "react-router-dom";

export default function QuizStatsPage() {
  const navigate = useNavigate();

  // Spara namn på användaren
  const [displayName, setDisplayName] = useState("Användare");

  // Lärarens klasser + vald klass
  const ALL_CLASSES = "__ALL__";
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Elever i vald klass
  const [students, setStudents] = useState<any[]>([]);

  // Hämta lärarens id
  const [userId, setUserId] = useState<string | null>(null);

  // Enkla flaggor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visa ny kolumn med klass om man valt alternativ alla klasser
  const showClassColumn = selectedClassId === ALL_CLASSES;

  // useEffect för fullName
useEffect(() => {
  (async () => {
    try {
      const me = await AuthApi.getMe(); // hämtar inloggad + id
      const name = me?.fullName ?? "";
      setDisplayName(name);

      // spara lärarens id i state
      setUserId(me?.id ?? null);
    } catch (e) {
      console.error("Kunde inte hämta profil:", e);
      setDisplayName("Användare");
    }
  })();
}, []);

  // Hämta lärarens klasser när sidan laddar. Sätter även "Alla klasser" som default-val om det finns klasser.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await TeacherClasses.GetCreatedClasses();
        setClasses(Array.isArray(list) ? list : []);

        // Sätter Alla klasser som standard om inget är valt
        if (Array.isArray(list) && list.length > 0 && !selectedClassId) {
          setSelectedClassId(ALL_CLASSES);
        }

        console.log("Teacher classes:", list);
      } catch (e: any) {
        console.error("Kunde inte hämta lärarens klasser:", e);
        setError(e?.message ?? "Kunde inte hämta lärarens klasser.");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Hämtar elever när användaren väljer klass eller kolumnen Alla klasser.
  //    - Vid Alla klasser hämtas klasslistor för varje klass parallellt och
  //      lägger på _classId/_className så vi kan visa kolumnen Klass.
  //    - Vid en enskild klass hämtas bara den klassens klasslista.
useEffect(() => {
  // Vi måste veta vilken klass som är vald OCH ha lärarens userId
  if (!selectedClassId || !userId) return;

  (async () => {
    try {
      setLoading(true);
      setError(null);

      // Alla klasser: hämta klasslistor + leaderboard för varje klass parallellt
      if (selectedClassId === ALL_CLASSES) {
        if (!classes.length) {
          setStudents([]);
          return;
        }

        const meta = classes.map((c: any) => ({
          id: c.id ?? c.classId ?? c.Id,
          name: c.name ?? c.className ?? "Namnlös klass",
        }));

        const results = await Promise.all(
          meta.map(async (m) => {
            const [classList, lb] = await Promise.all([
              TeacherClasses.GetClassStudents(m.id),
              Classes.GetClassLeaderboard(m.id, userId!), // kräver userId för API:et
            ]);

            // Indexera leaderboard på userId för snabb join
            const byUser = new Map(
              (lb?.leaderboard ?? []).map((row: any) => [row.userId, row])
            );

            return (Array.isArray(classList) ? classList : []).map((s: any) => {
              const key = s.id ?? s.userId;
              const lbRow = key ? byUser.get(key) : null;

              return {
                ...s,
                _classId: m.id,
                _className: m.name,
                _score: lbRow?.score ?? 0, //  elevernas poäng
                _rank: lbRow?.rank ?? null, // visar plats efter rank
              };
            });
          })
        );

        setStudents(results.flat());
        return;
      }

      // En enskild klass: hämta klasslista + leaderboard för just den klassen
      const [classList, lb] = await Promise.all([
        TeacherClasses.GetClassStudents(selectedClassId),
        Classes.GetClassLeaderboard(selectedClassId, userId!),
      ]);

      const byUser = new Map(
        (lb?.leaderboard ?? []).map((row: any) => [row.userId, row])
      );

      const className =
        classes.find(
          (c: any) => (c.id ?? c.classId ?? c.Id) === selectedClassId
        )?.name ?? "Klass";

      const withMeta = (Array.isArray(classList) ? classList : []).map(
        (s: any) => {
          const key = s.id ?? s.userId;
          const lbRow = key ? byUser.get(key) : null;

          return {
            ...s,
            _classId: selectedClassId,
            _className: className,
            _score: lbRow?.score ?? 0,
            _rank: lbRow?.rank ?? null,
          };
        }
      );

      setStudents(withMeta);
    } catch (e: any) {
      console.error("Kunde inte hämta elever/poäng:", e);
      setError(e?.message ?? "Kunde inte hämta elever/poäng.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  })();
}, [selectedClassId, classes, userId]);


  return (
    <div className="bg-[#080923] text-white w-full">
      {/* ---------- Titel + Avatar & namn ---------- */}
      <div className="px-6 pt-0 pb-0 -mt-2 md:-mt-3 -mb-1 md:-mb-2 flex items-center justify-between flex-nowrap">
        {/* FrågeFejden titel logga */}
        <div
          className="
            h-[110px] md:h-[140px] lg:h-[160px]
            w-[360px] md:w-[420px] lg:w-[520px]
            overflow-hidden flex items-center
          "
        >
          <img
            src={frageTitle}
            alt="FrågeFejden"
            className="
              h-[140%] md:h-[160%] lg:h-[180%]
              w-auto max-w-none select-none pointer-events-none
            "
          />
        </div>

        {/* Större namn + avatar */}
        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-semibold text-white/95 text-base md:text-lg lg:text-xl leading-none">
            Hej {displayName}!
          </span>
          <img
            src={avatar}
            alt="Profil"
            className="h-10 w-10 md:h-[45px] md:w-[45px] lg:h-[52px] lg:w-[52px] rounded-full object-cover shrink-0"
          />
        </div>
      </div>

      {/* --------- Översiktskort --------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 px-6 pt-0">
        {/* Genomsnitt deltagare */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={averageParticipantsIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">Genomsnitt deltagare</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">--</p>
            </div>
          </div>
        </div>

        {/* Quiz skapade */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={numOfQuizIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">Quiz skapade</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">--</p>
            </div>
          </div>
        </div>

        {/* Genomsnitt rätt */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={averageAnswerIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">Genomsnitt rätt</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">--%</p>
            </div>
          </div>
        </div>

        {/* Bästa resultat */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={bestResultsIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">Bästa resultat</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">--</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------- Graf + Leaderboard --------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pt-5">
        {/* Graf */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_10px_26px_rgba(0,0,0,0.25)] min-h-[280px]">
          <h2 className="font-semibold text-lg">Genomförda Quiz</h2>
          <div className="mt-4 h-[200px] rounded-xl bg-black/15 grid place-items-center text-white/60">
            Graf placeholder
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_10px_26px_rgba(0,0,0,0.25)] min-h-[280px]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Leaderboard (Topp 3)</h2>
            <img src={trophy} alt="Trophy" className="h-7 w-7 drop-shadow" />
          </div>

          <div className="mt-4 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 text-sm bg-black/10 px-3 py-2">
              <span>Namn</span>
              <span>Klass</span>
              <span className="text-right pr-1">Poäng</span>
            </div>
            <div className="divide-y divide-white/10">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 items-center px-3 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-white/70 w-4">{i}</span> …
                  </span>
                  <span className="text-white/80">…</span>
                  <span className="text-right pr-1">…</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------- Filtrering --------- */}
      <section className="w-full flex justify-center pt-6 px-6">
        <div className="flex flex-wrap gap-4">
          <input type="date" className="rounded-md px-3 py-1 text-black" />
          {/* Filtrera på klass */}
          <select
            className="rounded-md px-3 py-1 text-black"
            value={selectedClassId ?? ""}
            onChange={(e) => setSelectedClassId(e.target.value || null)}
          >
            {/* Ny rad: "Alla klasser" överst */}
            <option value={ALL_CLASSES}>Alla klasser</option>

            {!classes.length && <option value="">(Inga klasser)</option>}
            {classes.map((c: any) => (
              <option
                key={c.id ?? c.classId ?? c.Id}
                value={c.id ?? c.classId ?? c.Id}
              >
                {c.name ?? c.className ?? "Namnlös klass"}
              </option>
            ))}
          </select>

          {/* Filtrera på kurser */}
          <select className="rounded-md px-3 py-1 text-black">
            <option>Alla kurser</option>
          </select>
          <input
            type="text"
            placeholder="Sök elev..."
            className="rounded-md px-3 py-1 text-black"
          />
        </div>
      </section>

      {/* --------- Tabell --------- */}
      <section className="px-6 pt-5 pb-10">
        <div className="overflow-x-auto rounded-2xl bg-black/10 ring-1 ring-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#3D1C87] text-left text-sm">
                <th className="px-4 py-3">Användarnamn</th>
                {showClassColumn && <th className="px-4 py-3">Klass</th>}
                <th className="px-4 py-3">Poäng</th>
                <th className="px-4 py-3">Rätt %</th>
                <th className="px-4 py-3">Tidsgenomsnitt</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-3 text-white/70"
                    colSpan={showClassColumn ? 5 : 4}
                  >
                    Laddar…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    className="px-4 py-3 text-red-300"
                    colSpan={showClassColumn ? 5 : 4}
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && students.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-3 text-white/70"
                    colSpan={showClassColumn ? 5 : 4}
                  >
                    Inga elever hittades
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                [...students]
                  .sort((a: any, b: any) => (b._score ?? 0) - (a._score ?? 0))
                  .map((s: any) => {
                    const name =
                      (s.fullName ?? "").trim() ||
                      (s.name ?? "").trim() ||
                      (s.userName ?? "").split("@")[0] ||
                      "Okänd";

                    // om du senare har procentsats/tid i datat kan du byta ut '—'
                    const rightPct =
                      typeof s.correctPct === "number"
                        ? `${Math.round(s.correctPct)}%`
                        : "—";
                    const avgTime =
                      s.avgSeconds != null ? `${s.avgSeconds}s` : "—";

                    return (
                      <tr
                        key={s.id ?? s.userId ?? s.email ?? name}
                        className="border-t border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="px-4 py-3">{name}</td>

                        {showClassColumn && (
                          <td className="px-4 py-3">{s._className ?? "—"}</td>
                        )}

                        <td className="px-4 py-3">{s._score ?? 0}</td>
                        <td className="px-4 py-3">{rightPct}</td>
                        <td className="px-4 py-3">{avgTime}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
