import React, { useEffect, useMemo, useState } from "react";
import {
  AuthApi,
  Classes,
  TeacherClasses,
  QuizzesApi,
  SubjectsApi,
  StatisticsApi,
  type SubjectDto,
  type StudentResponseDto,
} from "../../Api";
import type { QuizSummaryDto } from "../../Api/QuizApi/Quizzes";
import type { TopicSummaryDto } from "../../Api/TopicsApi/topics";

import avatar from "../../assets/images/avatar/avatar2.png";
import frageTitle from "../../assets/images/titles/frageFejden-title-pic.png";
import bestResultsIcon from "../../assets/images/icons/best-result-icon.png";
import averageParticipantsIcon from "../../assets/images/icons/average-participants-icon.png";
import numOfQuizIcon from "../../assets/images/icons/num-of-quiz-created-icon.png";
import averageAnswerIcon from "../../assets/images/icons/average-correct-answers-icon.png";
import trophy from "../../assets/images/icons/trophy-icon.png";

export default function QuizStatsPage() {
  // ────────────────────────────────────────────────────────────────────────────
  //  KONSTANTER
  // ────────────────────────────────────────────────────────────────────────────
  const ALL_CLASSES = "__ALL__";
  const ALL_SUBJECTS = "__ALL_SUBJECTS__";
  const ALL_TOPICS = "__ALL_TOPICS__";

  // Hjälpare
  const collator = useMemo(
    () => new Intl.Collator("sv", { sensitivity: "base" }),
    []
  );
  const displayNameOf = (s: any) =>
    (s.fullName ?? "").trim() ||
    (s.name ?? "").trim() ||
    (s.userName ?? "").split("@")[0] ||
    "Okänd";

  // ────────────────────────────────────────────────────────────────────────────
  //  STATE + EFFECT: INLOGGAD ANVÄNDARE
  // ────────────────────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState("Användare");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await AuthApi.getMe();
        setDisplayName(me?.fullName ?? "Användare");
        setUserId(me?.id ?? null);
      } catch {
        setDisplayName("Användare");
      }
    })();
  }, []);

  // ────────────────────────────────────────────────────────────────────────────
  //  STATE + EFFECT: KLASSER & ELEVER (+ leaderboard per klass)
  // ────────────────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showClassColumn = selectedClassId === ALL_CLASSES;

  // Hämta lärarens klasser
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await TeacherClasses.GetCreatedClasses();
        setClasses(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0 && !selectedClassId) {
          setSelectedClassId(ALL_CLASSES);
        }
      } catch (e: any) {
        setError(e?.message ?? "Kunde inte hämta lärarens klasser.");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Hämta elever + leaderboard (för vald/alla klasser)
  useEffect(() => {
    if (!selectedClassId || !userId) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Alla klasser → bygg ihop alla elevlistor + poäng
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
                Classes.GetClassLeaderboard(m.id, userId),
              ]);
              const byUser = new Map(
                (lb?.leaderboard ?? []).map((row: any) => [row.userId, row])
              );
              return (Array.isArray(classList) ? classList : []).map(
                (s: any) => {
                  const key = s.id ?? s.userId;
                  const lbRow = key ? byUser.get(key) : null;
                  return {
                    ...s,
                    _classId: m.id,
                    _className: m.name,
                    _score: lbRow?.score ?? 0,
                    _rank: lbRow?.rank ?? null,
                  };
                }
              );
            })
          );

          setStudents(results.flat());
          return;
        }

        // Enskild klass
        const [classList, lb] = await Promise.all([
          TeacherClasses.GetClassStudents(selectedClassId),
          Classes.GetClassLeaderboard(selectedClassId, userId),
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
        setError(e?.message ?? "Kunde inte hämta elever/poäng.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClassId, classes, userId]);

  // ────────────────────────────────────────────────────────────────────────────
  //  STATE + EFFECT: ÄMNEN & KURSER (TOPICS)
  // ────────────────────────────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] =
    useState<string>(ALL_SUBJECTS);

  const [topics, setTopics] = useState<TopicSummaryDto[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(ALL_TOPICS);

  // Ämnen
  useEffect(() => {
    (async () => {
      try {
        const mine = await SubjectsApi.listMine();
        setSubjects(mine);
        setSelectedSubjectId(ALL_SUBJECTS);
      } catch {
        setSubjects([]);
        setSelectedSubjectId(ALL_SUBJECTS);
      }
    })();
  }, []);

  // Kurser för valt ämne
  useEffect(() => {
    (async () => {
      if (selectedSubjectId === ALL_SUBJECTS) {
        setTopics([]);
        setSelectedTopicId(ALL_TOPICS);
        return;
      }
      try {
        const list = await SubjectsApi.listMyTopics(selectedSubjectId);
        setTopics(list);
        setSelectedTopicId(ALL_TOPICS);
      } catch {
        setTopics([]);
        setSelectedTopicId(ALL_TOPICS);
      }
    })();
  }, [selectedSubjectId]);

  // ────────────────────────────────────────────────────────────────────────────
  //  STATE + EFFECT: MINA QUIZ (antal för KPI-kort)
  // ────────────────────────────────────────────────────────────────────────────
  const [myQuizzes, setMyQuizzes] = useState<QuizSummaryDto[] | null>(null);
  const [myQuizzesLoading, setMyQuizzesLoading] = useState(false);
  const [myQuizzesError, setMyQuizzesError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      try {
        setMyQuizzesLoading(true);
        const list = await QuizzesApi.getMyQuizzes();
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        setMyQuizzes(list);
        setMyQuizzesError(null);
      } catch (e: any) {
        setMyQuizzes([]);
        const msg =
          e?.response?.status === 403
            ? "Saknar behörighet (role: teacher/admin krävs)."
            : e?.message ?? "Kunde inte hämta mina quiz.";
        setMyQuizzesError(msg);
      } finally {
        setMyQuizzesLoading(false);
      }
    })();
  }, [userId]);

  // ────────────────────────────────────────────────────────────────────────────
  //  STATE + EFFECT: SVAR (rådata) + härledda KPI:er & DIAGRAM
  // ────────────────────────────────────────────────────────────────────────────
  const [allResponses, setAllResponses] = useState<StudentResponseDto[] | null>(
    null
  );
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answersError, setAnswersError] = useState<string | null>(null);
  const hasResponses = Array.isArray(allResponses);

  // Hämta svar en gång
  useEffect(() => {
    if (allResponses) return;
    setAnswersLoading(true);
    setAnswersError(null);
    (async () => {
      try {
        const data = await StatisticsApi.getStudentResponses();
        setAllResponses(Array.isArray(data) ? data : []);
      } catch {
        setAllResponses([]);
        setAnswersError("Kunde inte hämta svarsdata.");
      } finally {
        setAnswersLoading(false);
      }
    })();
  }, [allResponses]);

  // Filtrering på ämne/kurs – för tabellens elevrader
  const matchesSubjectTopicFilters = (row: any) => {
    if (selectedSubjectId === ALL_SUBJECTS) return true;
    const rowSubjectId =
      row.subjectId ??
      row._subjectId ??
      (Array.isArray(row._subjectIds) ? row._subjectIds : null);
    const subjectOk = Array.isArray(rowSubjectId)
      ? rowSubjectId.includes(selectedSubjectId)
      : rowSubjectId == null || rowSubjectId === selectedSubjectId;
    if (!subjectOk) return false;

    if (selectedTopicId === ALL_TOPICS) return true;

    const rowTopicId =
      row.topicId ??
      row._topicId ??
      (Array.isArray(row._topicIds) ? row._topicIds : null);
    const topicOk = Array.isArray(rowTopicId)
      ? rowTopicId.includes(selectedTopicId)
      : rowTopicId == null || rowTopicId === selectedTopicId;

    return topicOk;
  };

  // Samma filter – applicerat direkt på response (för diagram/KPI)
  const responseMatchesSubjectTopicFilters = (r: any) => {
    if (selectedSubjectId === ALL_SUBJECTS && selectedTopicId === ALL_TOPICS) {
      return true;
    }
    const respSubjectId =
      r?.subjectId ??
      r?._subjectId ??
      (Array.isArray(r?._subjectIds) ? r._subjectIds : null);
    const respTopicId =
      r?.topicId ??
      r?._topicId ??
      (Array.isArray(r?._topicIds) ? r._topicIds : null);

    if (selectedSubjectId !== ALL_SUBJECTS) {
      const subjectOk = Array.isArray(respSubjectId)
        ? respSubjectId.includes(selectedSubjectId)
        : respSubjectId == null || respSubjectId === selectedSubjectId;
      if (!subjectOk) return false;
    }
    if (selectedTopicId !== ALL_TOPICS) {
      const topicOk = Array.isArray(respTopicId)
        ? respTopicId.includes(selectedTopicId)
        : respTopicId == null || respTopicId === selectedTopicId;
      if (!topicOk) return false;
    }
    return true;
  };

  // Tidsgenomsnitt per elev (sekunder)
  const perStudentAvgTimeSeconds = useMemo(() => {
    if (!allResponses) return new Map<string, number>();

    const eligibleRows =
      selectedClassId === ALL_CLASSES
        ? students
        : students.filter((s) => s._classId === selectedClassId);

    const eligibleIds = new Set<string>(
      eligibleRows.map((s) => String(s.id ?? s.userId)).filter(Boolean)
    );

    const sums = new Map<string, number>();
    const counts = new Map<string, number>();

    for (const r of allResponses) {
      if (!responseMatchesSubjectTopicFilters(r)) continue;
      const sid = (r as any)?.studentId ? String((r as any).studentId) : null;
      if (!sid || !eligibleIds.has(sid)) continue;
      if ((r as any).timeMs == null) continue;

      sums.set(
        sid,
        (sums.get(sid) ?? 0) + ((r as any).timeMs as number) / 1000
      );
      counts.set(sid, (counts.get(sid) ?? 0) + 1);
    }

    const avg = new Map<string, number>();
    for (const id of eligibleIds) {
      const c = counts.get(id) ?? 0;
      if (c > 0) {
        const seconds = (sums.get(id) ?? 0) / c;
        avg.set(id, Math.round(seconds * 10) / 10);
      }
    }
    return avg;
  }, [
    allResponses,
    students,
    selectedClassId,
    selectedSubjectId,
    selectedTopicId,
  ]);

  // Rätt % per elev
  const perStudentCorrectPct = useMemo(() => {
    if (!allResponses) return new Map<string, number>();

    const eligibleRows =
      selectedClassId === ALL_CLASSES
        ? students
        : students.filter((s) => s._classId === selectedClassId);

    const eligibleIds = new Set<string>(
      eligibleRows.map((s) => String(s.id ?? s.userId)).filter(Boolean)
    );

    const totals = new Map<string, number>();
    const corrects = new Map<string, number>();

    for (const r of allResponses) {
      if (!responseMatchesSubjectTopicFilters(r)) continue;
      const sid = (r as any)?.studentId ? String((r as any).studentId) : null;
      if (!sid || !eligibleIds.has(sid)) continue;

      totals.set(sid, (totals.get(sid) ?? 0) + 1);

      const isCorrect =
        typeof (r as any)?.isCorrect === "boolean"
          ? (r as any).isCorrect
          : typeof (r as any)?.correct === "boolean"
          ? (r as any).correct
          : typeof (r as any)?.wasCorrect === "boolean"
          ? (r as any).wasCorrect
          : typeof (r as any)?.selectedOptionIsCorrect === "boolean"
          ? (r as any).selectedOptionIsCorrect
          : typeof (r as any)?.score === "number"
          ? (r as any).score > 0
          : false;

      if (isCorrect) corrects.set(sid, (corrects.get(sid) ?? 0) + 1);
    }

    const pct = new Map<string, number>();
    for (const id of eligibleIds) {
      const t = totals.get(id) ?? 0;
      const c = corrects.get(id) ?? 0;
      const value = t === 0 ? 0 : Math.round((100 * c) / t);
      pct.set(id, value);
    }
    return pct;
  }, [
    allResponses,
    students,
    selectedClassId,
    selectedSubjectId,
    selectedTopicId,
  ]);

  // Genomsnitt svar per elev (KPI) – påverkas av vald klass + ämne/kurs
  const [avgAnswersPerStudent, setAvgAnswersPerStudent] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!allResponses) return;

    const eligibleRows =
      selectedClassId === ALL_CLASSES
        ? students
        : students.filter((s) => s._classId === selectedClassId);

    const eligibleIds = new Set<string>(
      eligibleRows.map((s) => String(s.id ?? s.userId)).filter(Boolean)
    );

    const denominator = eligibleIds.size;
    if (denominator === 0) {
      setAvgAnswersPerStudent(null);
      return;
    }

    const counts = new Map<string, number>();
    for (const r of allResponses) {
      if (!responseMatchesSubjectTopicFilters(r)) continue;
      const sid = r?.studentId ? String(r.studentId) : null;
      if (!sid || !eligibleIds.has(sid)) continue;
      counts.set(sid, (counts.get(sid) ?? 0) + 1);
    }

    let totalAnswers = 0;
    for (const id of eligibleIds) totalAnswers += counts.get(id) ?? 0;

    const value = Math.round((totalAnswers / denominator) * 10) / 10;
    setAvgAnswersPerStudent(value);
  }, [
    allResponses,
    selectedClassId,
    students,
    selectedSubjectId,
    selectedTopicId,
  ]);

  // ────────────────────────────────────────────────────────────────────────────
  //  HÄRLEDER RADER FÖR TABELL/LEADERBOARD
  // ────────────────────────────────────────────────────────────────────────────
  const preparedRows = students.filter(matchesSubjectTopicFilters).map((s) => {
    const sid = String(s.id ?? s.userId ?? "");
    const timeSec = sid ? perStudentAvgTimeSeconds.get(sid) ?? null : null;
    return {
      ...s,
      _displayName: displayNameOf(s),
      _classLabel: s._className ?? "",
      _points: Number(s._score ?? 0),
      _timeSec: timeSec,
    };
  });

  const leaderboardRows = useMemo(() => {
    const source =
      selectedClassId === ALL_CLASSES
        ? preparedRows
        : preparedRows.filter((r) => r._classId === selectedClassId);
    return [...source].sort((a, b) => (b._points ?? 0) - (a._points ?? 0));
  }, [preparedRows, selectedClassId]);

  const currentRows = useMemo(() => {
    return selectedClassId === ALL_CLASSES
      ? preparedRows
      : preparedRows.filter((r) => r._classId === selectedClassId);
  }, [preparedRows, selectedClassId]);

  // KPI:er för kort
  const avgParticipants = useMemo(
    () => currentRows.filter((r) => (r._points ?? 0) > 0).length || 0,
    [currentRows]
  );

  const bestScore = useMemo(() => {
    const scores = currentRows.map((r) => r._points ?? 0);
    return scores.length ? Math.max(...scores) : 0;
  }, [currentRows]);

  // ────────────────────────────────────────────────────────────────────────────
  //  TABELL-SORTERING & SÖK
  // ────────────────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<"score" | "name" | "class" | "time">(
    "score"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchText, setSearchText] = useState("");
  const caret = (active: boolean) =>
    !active ? "" : sortDir === "asc" ? "▲" : "▼";

  function toggleSort(col: "score" | "name" | "class" | "time") {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir(col === "name" || col === "class" ? "asc" : "desc");
    }
  }

  const filtered = preparedRows.filter((r) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      r._displayName.toLowerCase().includes(q) ||
      r._classLabel.toLowerCase().includes(q)
    );
  });

  function compare(a: any, b: any) {
    let primary = 0;
    switch (sortBy) {
      case "score":
        primary = (a._points ?? 0) - (b._points ?? 0);
        break;
      case "name":
        primary = collator.compare(a._displayName, b._displayName);
        break;
      case "class":
        primary = collator.compare(a._classLabel || "", b._classLabel || "");
        break;
      case "time": {
        const aTime =
          a._timeSec ?? (hasResponses ? 0 : Number.POSITIVE_INFINITY);
        const bTime =
          b._timeSec ?? (hasResponses ? 0 : Number.POSITIVE_INFINITY);
        primary = aTime - bTime;
        break;
      }
    }
    if (primary === 0) {
      primary = collator.compare(a._displayName, b._displayName);
      if (primary === 0) {
        primary = collator.compare(a._classLabel || "", b._classLabel || "");
      }
    }
    return sortDir === "asc" ? primary : -primary;
  }

  const rows = [...filtered].sort(compare);

  // ────────────────────────────────────────────────────────────────────────────
  //  DIAGRAM: datum-helpers + dataset (senaste 14 dagar, unika klass–quiz/dag)
  // ────────────────────────────────────────────────────────────────────────────
  const [labelStep, setLabelStep] = useState<number>(2); // glesa X-etiketter
  useEffect(() => {
    const update = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      setLabelStep(w < 480 ? 3 : w < 1024 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function dateFromISO(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  const fmtShort = new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  });
  const fmtFull = new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const labelShort = (iso: string) => fmtShort.format(dateFromISO(iso));
  const labelFull = (iso: string) => fmtFull.format(dateFromISO(iso));

  function getResponseDateISO(r: any): string | null {
    const raw =
      r?.answeredAt ??
      r?.submittedAt ??
      r?.createdAt ??
      r?.timestamp ??
      r?.updatedAt ??
      null;
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(+d)) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  type ChartPoint = { day: string; completed: number };

  const completedPerDay14: ChartPoint[] = useMemo(() => {
    if (!allResponses || !students.length) return [];

    // Vilka elever är aktuella (valda klassen eller alla)?
    const eligibleRows =
      selectedClassId === ALL_CLASSES
        ? students
        : students.filter((s) => s._classId === selectedClassId);

    const eligibleIds = new Set<string>();
    const studentToClassId = new Map<string, string>();
    for (const s of eligibleRows) {
      const sid = String(s.id ?? s.userId ?? "");
      if (!sid) continue;
      eligibleIds.add(sid);
      const cid = String(s._classId ?? "");
      if (cid && !studentToClassId.has(sid)) studentToClassId.set(sid, cid);
    }

    // X-axel (14 dagar bakåt)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: string[] = [];
    const indexByDate = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      indexByDate.set(key, days.length);
      days.push(key);
    }

    // Räkna unika (dag, klassId, quizId)
    const seen = new Set<string>();
    const counts = new Array<number>(days.length).fill(0);

    for (const r of allResponses as any[]) {
      if (!responseMatchesSubjectTopicFilters(r)) continue;

      const sid = r?.studentId ? String(r.studentId) : null;
      if (!sid || !eligibleIds.has(sid)) continue;

      const classId = studentToClassId.get(sid);
      if (!classId) continue;

      const qid =
        r?.quizId ??
        r?.quizAttemptId ??
        r?.attemptId ??
        r?.quiz ??
        r?.quiz_id ??
        null;
      if (qid == null) continue;

      const dateKey = getResponseDateISO(r);
      if (!dateKey) continue;

      const idx = indexByDate.get(dateKey);
      if (idx == null) continue;

      const uniq = `${dateKey}::${classId}::${qid}`;
      if (seen.has(uniq)) continue;
      seen.add(uniq);
      counts[idx] += 1;
    }

    return days.map((day, i) => ({ day, completed: counts[i] }));
  }, [
    allResponses,
    students,
    selectedClassId,
    selectedSubjectId,
    selectedTopicId,
  ]);

  // Y-axel: snygga "nice" steg + grid
  const yInfo = useMemo(() => {
    const maxVal =
      completedPerDay14.reduce((m, d) => Math.max(m, d.completed), 0) || 1;
    const nTicks = 4;
    const rawStep = Math.ceil(maxVal / nTicks);
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10].map((b) => b * pow10);
    const step =
      candidates.find((c) => c >= rawStep) ?? candidates[candidates.length - 1];
    const maxTick = step * Math.ceil(maxVal / step);
    const ticks: number[] = [];
    for (let v = 0; v <= maxTick; v += step) ticks.push(v);
    return { maxTick: Math.max(maxTick, 1), step, ticks };
  }, [completedPerDay14]);

  // Texter för diagram
  const isAllClasses = selectedClassId === ALL_CLASSES;
  const unitShort = isAllClasses ? "klass–quiz" : "quiz";
  const unitLong = isAllClasses ? "klass–quiz-kombinationer" : "quiz";
  const chartExplainer = isAllClasses
    ? "Visar antal olika klass–quiz-kombinationer per dag. Om en klass genomför samma quiz flera gånger samma dag räknas det som 1."
    : "Visar antal olika quiz som den här klassen genomförde per dag. Om samma quiz körs flera gånger samma dag räknas det som 1.";
  const totalCompleted = useMemo(
    () => completedPerDay14.reduce((sum, p) => sum + p.completed, 0),
    [completedPerDay14]
  );
  const maxDayInfo = useMemo(() => {
    let max = 0;
    let day: string | null = null;
    for (const p of completedPerDay14) {
      if (p.completed > max) {
        max = p.completed;
        day = p.day;
      }
    }
    return { max, day };
  }, [completedPerDay14]);

  // ────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#080923] text-white w-full">
      {/* Header */}
      <div className="px-6 pt-0 pb-0 -mt-2 md:-mt-3 -mb-1 md:-mb-2 flex items-center justify-between flex-nowrap">
        <div className="h-[110px] md:h-[140px] lg:h-[160px] w-[360px] md:w-[420px] lg:w-[520px] overflow-hidden flex items-center">
          <img
            src={frageTitle}
            alt="FrågeFejden"
            className="h-[140%] md:h-[160%] lg:h-[180%] w-auto max-w-none select-none pointer-events-none"
          />
        </div>

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

      {/* KPI-kort */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 px-6 pt-0">
        {/* Genomsnitt deltagare – FIX: bara EN ikonruta */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={averageParticipantsIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">Genomsnitt deltagare</p>
              <p className="mt-1 text-3xl font-extrabold leading-none">
                {loading ? "…" : avgParticipants ?? "—"}
              </p>
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
              <p className="mt-1 text-3xl font-extrabold leading-none">
                {myQuizzesLoading
                  ? "…"
                  : myQuizzes == null
                  ? "—"
                  : myQuizzes.length}
              </p>
              {myQuizzesError && (
                <p className="text-xs text-red-200 mt-1">{myQuizzesError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Genomsnitt svar per elev */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] min-h-[120px]">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-black/25">
              <img src={averageAnswerIcon} alt="" className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm opacity-90">
                Genomsnitt svar per elev{" "}
                {selectedClassId === ALL_CLASSES ? "(alla klasser)" : "(klass)"}
              </p>
              <p
                className="mt-1 text-3xl font-extrabold leading-none"
                aria-live="polite"
              >
                {answersLoading
                  ? "…"
                  : answersError
                  ? "—"
                  : avgAnswersPerStudent == null
                  ? "—"
                  : avgAnswersPerStudent.toFixed(1)}
              </p>
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
              <p className="mt-1 text-3xl font-extrabold leading-none">
                {loading ? "…" : bestScore ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Diagram + Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pt-5">
        {/* Genomförda Quiz (bar chart) */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_10px_26px_rgba(0,0,0,0.25)] min-h-[320px]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Genomförda Quiz</h2>
            <span className="text-xs text-white/70">Senaste 14 dagar</span>
          </div>

          <div className="mt-4 rounded-xl bg-black/15 p-3 sm:p-4">
            {completedPerDay14.length === 0 ? (
              <div className="h-[220px] grid place-items-center text-white/70">
                Inga quiz genomförda ännu
              </div>
            ) : (
              <>
                {/* Y-axel + bars */}
                <div className="flex gap-2 sm:gap-3">
                  {/* Y-etiketter */}
                  <div className="w-10 sm:w-12 flex flex-col justify-between text-[10px] sm:text-xs text-white/70 pr-1">
                    {yInfo.ticks
                      .slice()
                      .reverse()
                      .map((t) => (
                        <div key={t} className="leading-none whitespace-nowrap">
                          {t}
                        </div>
                      ))}
                  </div>

                  {/* Bars + grid */}
                  <div className="relative flex-1 min-w-0">
                    {/* Gridlines */}
                    {yInfo.ticks.map((t) => {
                      const pct = (t / (yInfo.maxTick || 1)) * 100;
                      return (
                        <div
                          key={`grid-${t}`}
                          className="absolute left-0 right-0 border-t border-white/10"
                          style={{ bottom: `${pct}%` }}
                        />
                      );
                    })}

                    {/* Bars */}
                    <div className="h-[220px] flex items-end gap-1 sm:gap-1.5 relative">
                      {(() => {
                        const maxVal =
                          completedPerDay14.reduce(
                            (m, d) => Math.max(m, d.completed),
                            0
                          ) || 1;
                        return completedPerDay14.map((d: ChartPoint) => {
                          const h = (d.completed / maxVal) * 100;
                          return (
                            <div
                              key={d.day}
                              className="group flex-1 min-w-[8px] rounded-t-md"
                              style={{ height: "100%" }}
                            >
                              <div
                                className="w-full rounded-t-md transition-all duration-200"
                                style={{
                                  height: `${h}%`,
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)",
                                  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                                }}
                                title={`${labelFull(d.day)}: ${
                                  d.completed
                                } ${unitLong}`}
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* X-etiketter */}
                    <div
                      className="mt-2 grid"
                      style={{
                        gridTemplateColumns: `repeat(${completedPerDay14.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {completedPerDay14.map((d: ChartPoint, idx: number) => (
                        <div
                          key={`label-${d.day}`}
                          className="text-[10px] sm:text-xs text-white/70 text-center select-none rotate-45 origin-top-right translate-y-2 whitespace-nowrap"
                          title={labelFull(d.day)}
                        >
                          {idx % labelStep === 0 ? labelShort(d.day) : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer förklaring + totals (separata kolumner/rader) */}
                <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-2 text-[11px] text-white/70">
                  <p className="leading-snug">{chartExplainer}</p>
                  <p className="leading-snug xl:text-right">
                    Totalt i perioden: {totalCompleted} {unitLong}
                    <span className="mx-1 hidden xl:inline">•</span>
                    <br className="xl:hidden" />
                    Högsta dagsvärde: {maxDayInfo.max} {unitShort}
                    {maxDayInfo.day ? ` (${labelShort(maxDayInfo.day)})` : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-[#3D1C87] p-5 shadow-[0_10px_26px_rgba(0,0,0,0.25)] min-h-[280px]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              Leaderboard{" "}
              {selectedClassId === ALL_CLASSES
                ? "(Alla klasser)"
                : "(Denna klass)"}
            </h2>
            <img src={trophy} alt="Trophy" className="h-7 w-7 drop-shadow" />
          </div>

          <div className="mt-4 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 text-sm bg-black/10 px-3 py-2">
              <span>Namn</span>
              <span>Klass</span>
              <span className="text-right pr-1">Poäng</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto divide-y divide-white/10">
              {leaderboardRows.map((r, i) => (
                <div
                  key={(r.userId ?? r.id ?? i) + String(r._classId)}
                  className="grid grid-cols-3 items-center px-3 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-white/70 w-6 text-right">
                      {i + 1}
                    </span>
                    {r._displayName}
                  </span>
                  <span className="text-white/80">{r._classLabel || "—"}</span>
                  <span className="text-right pr-1">{r._points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filterrad */}
      <section className="w-full flex justify-center pt-6 px-6">
        <div className="flex flex-wrap gap-4">
          <input type="date" className="rounded-md px-3 py-1 text-black" />
          <select
            className="rounded-md px-3 py-1 text-black"
            value={selectedClassId ?? ""}
            onChange={(e) => setSelectedClassId(e.target.value || null)}
          >
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

          <select
            className="rounded-md px-3 py-1 text-black"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value={ALL_SUBJECTS}>Alla ämnen</option>
            {!subjects.length && <option value="">(Inga ämnen)</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-md px-3 py-1 text-black"
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            disabled={selectedSubjectId === ALL_SUBJECTS || !topics.length}
          >
            <option value={ALL_TOPICS}>— Välj kurs —</option>
            {selectedSubjectId !== ALL_SUBJECTS &&
              topics.map((t) => (
                <option key={t.topicId} value={t.topicId}>
                  {t.name}
                </option>
              ))}
          </select>

          <input
            type="text"
            placeholder="Sök elev…"
            className="rounded-md px-3 py-1 text-black"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </section>

      {/* Tabell */}
      <section className="px-6 pt-5 pb-10">
        <div className="overflow-x-auto rounded-2xl bg-black/10 ring-1 ring-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#3D1C87] text-left text-sm">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 cursor-pointer select-none"
                  >
                    Användarnamn{" "}
                    <span className="opacity-80">
                      {caret(sortBy === "name")}
                    </span>
                  </button>
                </th>

                {showClassColumn && (
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("class")}
                      className="flex items-center gap-1 cursor-pointer select-none"
                    >
                      Klass{" "}
                      <span className="opacity-80">
                        {caret(sortBy === "class")}
                      </span>
                    </button>
                  </th>
                )}

                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("score")}
                    className="flex items-center gap-1 cursor-pointer select-none"
                  >
                    Poäng{" "}
                    <span className="opacity-80">
                      {caret(sortBy === "score")}
                    </span>
                  </button>
                </th>

                <th className="px-4 py-3">
                  <span className="flex items-center gap-1 select-none">
                    Rätt %
                  </span>
                </th>

                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("time")}
                    className="flex items-center gap-1 cursor-pointer select-none"
                  >
                    Tidsgenomsnitt{" "}
                    <span className="opacity-80">
                      {caret(sortBy === "time")}
                    </span>
                  </button>
                </th>
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
                rows.map((s: any, i: number) => {
                  const name = s._displayName;
                  const sid = String(s.id ?? s.userId ?? "");

                  const rightPctNum = perStudentCorrectPct.get(sid);
                  const rightPct =
                    rightPctNum == null ? "0%" : `${rightPctNum}%`;

                  const avgTime = !hasResponses
                    ? "—"
                    : s._timeSec == null
                    ? "0s"
                    : `${s._timeSec}s`;

                  return (
                    <tr
                      key={s.id ?? s.userId ?? s.email ?? name ?? i}
                      className="border-t border-white/10 hover:bg-white/5 transition"
                    >
                      <td className="px-4 py-3">{name}</td>
                      {showClassColumn && (
                        <td className="px-4 py-3">{s._classLabel || "—"}</td>
                      )}
                      <td className="px-4 py-3">{s._points}</td>
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
