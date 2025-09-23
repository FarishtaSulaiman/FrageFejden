import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, BookOpen, FileText } from 'lucide-react';

import {
  topicApi,
  TopicDto,
  TopicSummaryDto,
  LevelRowDto,
} from '../../Api/TopicsApi/topics';

import {
  QuizzesApi,
  QuizSummaryDto,
  UUID,
} from '../../Api/QuizApi/Quizzes';

/* ---------- Local UI types ---------- */
interface ExtendedLevel extends LevelRowDto {
  quizzes: QuizSummaryDto[];
  studyText: string;
}

interface QuestionOptionForm {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionForm {
  stem: string;
  explanation: string;
  options: QuestionOptionForm[];
}

interface QuizFormData {
  title: string;
  description: string;
  isPublished: boolean;
  questions: QuizQuestionForm[];
}

interface LevelFormData {
  levelNumber: number;
  title: string;
  minXpUnlock: number;
  studyText: string;
}

interface TopicFormData {
  name: string;
  description: string;
  sortOrder: number;
}

const ManageSubjectTopicsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subjectId = (searchParams.get('subjectId') || '').trim();
  const classId = (searchParams.get('classId') || '').trim() || undefined;

  console.log("[Page] query params:", { subjectId, classId });

  // topic list + selection
  const [topics, setTopics] = useState<TopicSummaryDto[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const selectedTopic = useMemo(
    () => topics.find(t => t.topicId === selectedTopicId) || null,
    [topics, selectedTopicId]
  );

  // selected topic details + levels
  const [topicDetails, setTopicDetails] = useState<TopicDto | null>(null);
  const [levels, setLevels] = useState<ExtendedLevel[]>([]);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // modals
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicSummaryDto | null>(null);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ExtendedLevel | null>(null);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedLevelForQuiz, setSelectedLevelForQuiz] = useState<ExtendedLevel | null>(null);

  // forms
  const [topicForm, setTopicForm] = useState<TopicFormData>({ name: '', description: '', sortOrder: 0 });
  const [levelForm, setLevelForm] = useState<LevelFormData>({ levelNumber: 1, title: '', minXpUnlock: 0, studyText: '' });
  const [quizForm, setQuizForm] = useState<QuizFormData>({
    title: '',
    description: '',
    isPublished: false,
    questions: [
      {
        stem: '',
        explanation: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }
    ]
  });

  /* ========= load topics for subject ========= */
  useEffect(() => {
    if (!subjectId) {
      console.warn("[Page] No subjectId in URL");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        console.log("[Page] Loading topics for subjectId:", subjectId);
        const list = await topicApi.listBySubject(subjectId);
        console.log("[Page] topics:", list);
        setTopics(list);
        if (list.length && !selectedTopicId) {
          console.log("[Page] auto-select first topic:", list[0].topicId);
          setSelectedTopicId(list[0].topicId);
        }
      } catch (e) {
        console.error('[Page] Failed to load topics', e);
        setTopics([]);
        setSelectedTopicId('');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  /* ========= when topic changes, load details + levels ========= */
  useEffect(() => {
    if (!selectedTopicId) {
      console.warn("[Page] No selectedTopicId");
      setTopicDetails(null);
      setLevels([]);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        console.log("[Page] Loading topic details:", selectedTopicId);
        const t = await topicApi.get(selectedTopicId);
        console.log("[Page] topicDetails:", t, "server-derived subjectId:", (t as any).subjectId);
        setTopicDetails(t);
        await loadLevels(selectedTopicId);
      } catch (e) {
        console.error('[Page] Failed to load topic/levels', e);
        setTopicDetails(null);
        setLevels([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTopicId]);

  const loadLevels = async (tid: string) => {
    console.log("[Page] Loading levels for topic:", tid);
    const rows = await topicApi.listLevels(tid);
    console.log("[Page] levels:", rows);
    const withExtras: ExtendedLevel[] = await Promise.all(
      rows.map(async (level) => {
        try {
          const quizzes = await QuizzesApi.getPublishedQuizzes(undefined, tid as unknown as UUID, level.levelId as unknown as UUID);
          const study = await topicApi.getLevelStudy(tid, level.levelId);
          return { ...level, quizzes, studyText: study?.studyText || '' };
        } catch (e) {
          console.error('[Page] level extras failed', e);
          return { ...level, quizzes: [], studyText: '' };
        }
      })
    );
    console.log("[Page] levels + extras:", withExtras);
    setLevels(withExtras);
  };

  /* ========= UI helpers ========= */
  const toggleLevelExpansion = (levelId: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      next.has(levelId) ? next.delete(levelId) : next.add(levelId);
      return next;
    });
  };

  /* ========= Topic modal (create / edit) ========= */
  const openTopicModal = (topic?: TopicSummaryDto) => {
    setEditingTopic(topic ?? null);
    setTopicForm(
      topic
        ? { name: topic.name, description: topic.description || '', sortOrder: topic.sortOrder }
        : { name: '', description: '', sortOrder: topics.length }
    );
    setShowTopicModal(true);
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      alert('Saknar subjectId i URL: ?subjectId=...');
      return;
    }

    try {
      if (editingTopic) {
        console.log("[Page] Updating topic:", editingTopic.topicId, topicForm);
        await topicApi.update(editingTopic.topicId, {
          name: topicForm.name,
          description: topicForm.description,
          sortOrder: topicForm.sortOrder,
        });
      } else {
        console.log("[Page] Creating topic for subjectId:", subjectId, topicForm);
        const created = await topicApi.create({
          subjectId,
          name: topicForm.name,
          description: topicForm.description,
          sortOrder: topicForm.sortOrder,
        });
        console.log("[Page] topic created:", created);
        const newId = (created as any).topicId || (created as any).id;
        if (newId) setSelectedTopicId(newId);
      }
      setShowTopicModal(false);
      const list = await topicApi.listBySubject(subjectId);
      setTopics(list);
    } catch (err) {
      console.error('[Page] Save topic error', err);
      alert('Kunde inte spara topic. Försök igen.');
    }
  };

  /* ========= Level CRUD ========= */
  const openLevelModal = (level?: ExtendedLevel | null) => {
    const lv = level || null;
    setEditingLevel(lv);
    setLevelForm(
      lv
        ? { levelNumber: lv.levelNumber, title: lv.title || '', minXpUnlock: lv.minXpUnlock, studyText: lv.studyText || '' }
        : { levelNumber: levels.length + 1, title: '', minXpUnlock: levels.length * 100, studyText: '' }
    );
    setShowLevelModal(true);
  };

  const handleLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;

    try {
      if (editingLevel) {
        console.log("[Page] Updating level:", editingLevel.levelId, levelForm);
        await topicApi.updateLevel(editingLevel.levelId, {
          levelNumber: levelForm.levelNumber,
          title: levelForm.title,
          minXpUnlock: levelForm.minXpUnlock,
        });
        await topicApi.updateLevelStudy(selectedTopicId, editingLevel.levelId, { studyText: levelForm.studyText });
      } else {
        console.log("[Page] Creating level for topic:", selectedTopicId, levelForm);
        const created = await topicApi.createLevel(selectedTopicId, {
          levelNumber: levelForm.levelNumber,
          title: levelForm.title,
          minXpUnlock: levelForm.minXpUnlock,
        });
        if (levelForm.studyText) {
          await topicApi.updateLevelStudy(selectedTopicId, created.levelId, { studyText: levelForm.studyText });
        }
      }
      setShowLevelModal(false);
      await loadLevels(selectedTopicId);
    } catch (err) {
      console.error('[Page] Save level error', err);
      alert('Kunde inte spara nivån. Försök igen.');
    }
  };

  const handleDeleteLevel = async (level: ExtendedLevel) => {
    if (!selectedTopicId) return;
    if (!confirm(`Är du säker på att du vill ta bort nivå ${level.levelNumber}? Detta tar bort alla quiz.`)) return;

    try {
      console.log("[Page] Deleting level:", level.levelId);
      await topicApi.deleteLevel(level.levelId);
      await loadLevels(selectedTopicId);
    } catch (err) {
      console.error('[Page] Delete level error', err);
      alert('Kunde inte ta bort nivå. Försök igen.');
    }
  };

  /* ========= Quiz + Questions creation ========= */
  const openQuizModal = (level: ExtendedLevel) => {
    setSelectedLevelForQuiz(level);
    console.log("[Page] Open quiz modal for level:", level);
    setQuizForm({
      title: '',
      description: '',
      isPublished: false,
      questions: [
        {
          stem: '',
          explanation: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ]
        }
      ]
    });
    setShowQuizModal(true);
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId || !selectedLevelForQuiz) return;

    try {
      console.log("[Page] handleQuizSubmit START", {
        selectedTopicId,
        selectedLevelForQuiz,
        classId,
        quizForm,
        urlSubjectId: subjectId,
      });

      // sanity: fetch topic to see derived subjectId server will use
      const topic = await topicApi.get(selectedTopicId);
      console.log("[Page] topic from server before createQuiz:", topic);

      // Validate each question has exactly one correct option
      for (const q of quizForm.questions) {
        const correct = q.options.filter(o => o.isCorrect).length;
        if (correct !== 1) {
          alert('Varje fråga måste ha exakt ett korrekt alternativ.');
          return;
        }
      }

      // Create Questions (the endpoint you confirmed works) + create quiz w/o subjectId
      const res = await QuizzesApi.createQuizWithNewQuestions({
        topicId: selectedTopicId as UUID,
        levelId: selectedLevelForQuiz.levelId as UUID,
        classId: classId ? (classId as UUID) : undefined,
        title: quizForm.title,
        description: quizForm.description,
        isPublished: quizForm.isPublished,
        questions: quizForm.questions.map(q => ({
          stem: q.stem,
          explanation: q.explanation || null,
          options: q.options.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
        })),
      });

      console.log("[Page] Quiz created OK:", res);
      setShowQuizModal(false);
      await loadLevels(selectedTopicId);
    } catch (err: any) {
      console.error('[Page] Create quiz error', {
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
      });
      alert(`Kunde inte skapa quiz. ${err?.response?.data?.message || err?.message || ''}`);
    }
  };

  /* ========= Question form helpers ========= */
  const addQuizQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { stem: '', explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] }
      ]
    }));
  };

  const removeQuizQuestion = (idx: number) => {
    setQuizForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const addQuestionOption = (qIdx: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, { text: '', isCorrect: false }] } : q
      )
    }));
  };

  const removeQuestionOption = (qIdx: number, optIdx: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== optIdx) } : q
      )
    }));
  };

  const updateQuestionOption = (
    qIdx: number,
    optIdx: number,
    field: keyof QuestionOptionForm,
    value: any
  ) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        if (field === 'isCorrect' && value) {
          return { ...q, options: q.options.map((opt, oi) => ({ ...opt, isCorrect: oi === optIdx })) };
        }
        return { ...q, options: q.options.map((opt, oi) => (oi === optIdx ? { ...opt, [field]: value } : opt)) };
      })
    }));
  };

  /* ========= Render ========= */
  if (!subjectId) {
    return (
      <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Saknar subjectId</h1>
        <p className="text-white/70">Öppna sidan med <code>?subjectId=&lt;GUID&gt;</code> i URL:en.</p>
      </div>
    );
  }

  if (loading && !topics.length && !selectedTopicId) {
    return (
      <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Laddar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hantera ämne</h1>
        <p className="text-white/70">Välj eller skapa ett område (topic) och hantera nivåer & quiz.</p>
      </div>

      {/* Topic select + Create Topic */}
      <div className="mb-8 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[260px]">
          <label className="block mb-2 text-sm font-medium">Välj område (topic)</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {topics.length === 0 && <option value="">Inga topics – skapa ett nytt</option>}
            {topics.map(t => (
              <option key={t.topicId} value={t.topicId}>
                {t.name} {typeof t.levelCount === 'number' ? `(${t.levelCount} nivåer)` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => openTopicModal()}
          className="h-[42px] px-4 rounded-lg bg-white/20 hover:bg-white/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nytt Topic
        </button>

        {selectedTopic && (
          <button
            onClick={() => openTopicModal(selectedTopic)}
            className="h-[42px] px-4 rounded-lg bg-yellow-600 hover:bg-yellow-700 flex items-center gap-2"
            aria-label="Redigera valt topic"
          >
            <Edit2 className="w-4 h-4" />
            Redigera Topic
          </button>
        )}
      </div>

      {/* Selected topic header */}
      {selectedTopic && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{topicDetails?.name || selectedTopic.name}</h2>
          {topicDetails?.description && <p className="text-white/70">{topicDetails.description}</p>}
        </div>
      )}

      {/* Levels Management */}
      {selectedTopic && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Nivåer</h3>
            <button
              onClick={() => openLevelModal()}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny Nivå
            </button>
          </div>

          <div className="space-y-4">
            {levels.map(level => (
              <div key={level.levelId} className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleLevelExpansion(level.levelId)}>
                    {expandedLevels.has(level.levelId) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    <div>
                      <div className="text-lg font-semibold">Nivå {level.levelNumber}: {level.title || 'Utan titel'}</div>
                      <div className="text-sm text-white/70">Min XP: {level.minXpUnlock} | {level.quizzes?.length || 0} quiz</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openLevelModal(level)} className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded" aria-label="Redigera nivå">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => openQuizModal(level)} className="bg-blue-600 hover:bg-blue-700 p-2 rounded" aria-label="Skapa quiz">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteLevel(level)} className="bg-red-600 hover:bg-red-700 p-2 rounded" aria-label="Ta bort nivå">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedLevels.has(level.levelId) && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" />
                        <h4 className="font-medium">Studiematerial</h4>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap">
                        {level.studyText || 'Inget studiematerial tillagt än'}
                      </p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <h4 className="font-medium">Quiz ({level.quizzes?.length || 0})</h4>
                        </div>
                        <button onClick={() => openQuizModal(level)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          Nytt Quiz
                        </button>
                      </div>

                      {level.quizzes?.length ? (
                        <div className="space-y-2">
                          {level.quizzes.map(quiz => (
                            <div key={quiz.id} className="bg-white/10 rounded p-3 flex items-center justify-between">
                              <div>
                                <div className="font-medium">{quiz.title}</div>
                                <div className="text-sm text-white/70">{quiz.questionCount} frågor | {quiz.isPublished ? 'Publicerat' : 'Utkast'}</div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!confirm('Är du säker på att du vill ta bort detta quiz?')) return;
                                    try {
                                      console.log("[Page] Deleting quiz:", quiz.id);
                                      await QuizzesApi.deleteQuiz(quiz.id);
                                      await loadLevels(selectedTopicId);
                                    } catch (e) {
                                      console.error('[Page] Delete quiz error', e);
                                      alert('Kunde inte ta bort quiz. Försök igen.');
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 p-1 rounded"
                                  aria-label="Ta bort quiz"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-sm">Inga quiz skapade ännu</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!levels.length && (
              <div className="text-white/70 text-sm">Inga nivåer ännu. Skapa din första nivå.</div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Topic Modal ---------- */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1A1F36] p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{editingTopic ? 'Redigera Topic' : 'Skapa Nytt Topic'}</h3>
            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Namn *</label>
                <input
                  type="text"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Beskrivning</label>
                <textarea
                  value={topicForm.description}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-200 text-black h-20 resize-none"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Sorteringsordning</label>
                <input
                  type="number"
                  value={topicForm.sortOrder ?? 0}
                  onChange={(e) => setTopicForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowTopicModal(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700">
                  Avbryt
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
                  {editingTopic ? 'Uppdatera' : 'Skapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Level Modal ---------- */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[#1A1F36] p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8">
            <h3 className="text-xl font-bold mb-4">{editingLevel ? 'Redigera Nivå' : 'Skapa Ny Nivå'}</h3>
            <form onSubmit={handleLevelSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Nivånummer *</label>
                  <input
                    type="number"
                    value={levelForm.levelNumber}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, levelNumber: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Min XP för att låsa upp</label>
                  <input
                    type="number"
                    value={levelForm.minXpUnlock}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, minXpUnlock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm">Titel</label>
                <input
                  type="text"
                  value={levelForm.title}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Studiematerial</label>
                <textarea
                  value={levelForm.studyText}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, studyText: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-200 text-black h-32 resize-none"
                  placeholder="Skriv studiematerialet för denna nivå..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowLevelModal(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700">
                  Avbryt
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-green-600 hover:bg-green-700">
                  {editingLevel ? 'Uppdatera' : 'Skapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Quiz Modal ---------- */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-[#1A1F36] p-6 rounded-xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Skapa Quiz för Nivå {selectedLevelForQuiz?.levelNumber}</h3>
            <form onSubmit={handleQuizSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Quiz Titel *</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-200 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Beskrivning</label>
                  <textarea
                    value={quizForm.description}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-gray-200 text-black h-20 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publishQuiz"
                    checked={quizForm.isPublished}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                  />
                  <label htmlFor="publishQuiz" className="text-sm">Publicera direkt</label>
                </div>
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Frågor</h4>
                  <button type="button" onClick={addQuizQuestion} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Lägg till fråga
                  </button>
                </div>

                <div className="space-y-4">
                  {quizForm.questions.map((question, qIdx) => (
                    <div key={qIdx} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-medium">Fråga {qIdx + 1}</h5>
                        {quizForm.questions.length > 1 && (
                          <button type="button" onClick={() => removeQuizQuestion(qIdx)} className="bg-red-600 hover:bg-red-700 p-1 rounded" aria-label="Ta bort fråga">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block mb-1 text-sm">Frågetext *</label>
                          <textarea
                            value={question.stem}
                            onChange={(e) =>
                              setQuizForm(prev => ({
                                ...prev,
                                questions: prev.questions.map((q, i) => (i === qIdx ? { ...q, stem: e.target.value } : q))
                              }))
                            }
                            className="w-full px-3 py-2 rounded bg-gray-200 text-black h-20 resize-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-1 text-sm">Förklaring</label>
                          <textarea
                            value={question.explanation}
                            onChange={(e) =>
                              setQuizForm(prev => ({
                                ...prev,
                                questions: prev.questions.map((q, i) => (i === qIdx ? { ...q, explanation: e.target.value } : q))
                              }))
                            }
                            className="w-full px-3 py-2 rounded bg-gray-200 text-black h-16 resize-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm">Svarsalternativ</label>
                            <button type="button" onClick={() => addQuestionOption(qIdx)} className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                              <Plus className="w-2 h-2" />
                              Alternativ
                            </button>
                          </div>

                          <div className="space-y-2">
                            {question.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`question-${qIdx}`}
                                  checked={opt.isCorrect}
                                  onChange={() => updateQuestionOption(qIdx, optIdx, 'isCorrect', true)}
                                />
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => updateQuestionOption(qIdx, optIdx, 'text', e.target.value)}
                                  placeholder={`Alternativ ${optIdx + 1}`}
                                  className="flex-1 px-3 py-1 rounded bg-gray-200 text-black"
                                  required
                                />
                                {question.options.length > 2 && (
                                  <button type="button" onClick={() => removeQuestionOption(qIdx, optIdx)} className="bg-red-600 hover:bg-red-700 p-1 rounded" aria-label="Ta bort alternativ">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button type="button" onClick={() => setShowQuizModal(false)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700">
                  Avbryt
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
                  Skapa Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSubjectTopicsPage;
