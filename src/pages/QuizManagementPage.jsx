import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import {
  Plus, Trash2, ChevronUp, ChevronDown, X, Eye, Save, CloudUpload,
  CloudOff, ListChecks, GripVertical, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const QUESTION_TYPES = [
  { value: 'multiple-choice', label: 'Single answer (MCQ)' },
  { value: 'multiple-select', label: 'Multiple answer (MCQ)' },
  { value: 'true-false', label: 'True / False' }
];

const blankQuestion = () => ({
  questionText: '',
  questionType: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
  points: 1
});

const blankQuiz = () => ({
  _id: '',
  title: '',
  description: '',
  instructions: '',
  moduleId: '',
  lessonId: '',
  timeLimitMinutes: 15,
  passingPercentage: 70,
  maxAttempts: 0,
  feedbackMode: 'deferred',
  deadline: '',
  published: false,
  questions: []
});

// Build a form-friendly question from the API shape (correctAnswer is an
// option index for single/true-false, an array of indexes for multi-select).
const questionToForm = (q) => {
  const options = (q.options || []).map((o) => String(o));
  if (q.questionType === 'multiple-select') {
    return { ...q, options, correctAnswer: Array.isArray(q.correctAnswer) ? q.correctAnswer.map(Number) : [] };
  }
  if (q.questionType === 'true-false') {
    const opts = options.length >= 2 ? options : ['True', 'False'];
    return { ...q, options: opts, correctAnswer: q.correctAnswer === '' || q.correctAnswer === undefined || q.correctAnswer === null ? '' : Number(q.correctAnswer) };
  }
  return { ...q, options, correctAnswer: q.correctAnswer === '' || q.correctAnswer === undefined || q.correctAnswer === null ? '' : Number(q.correctAnswer) };
};

const questionToPayload = (q) => {
  const options = q.questionType === 'true-false' ? ['True', 'False'] : q.options.map((o) => o.trim()).filter((o) => o !== '');
  let correctAnswer;
  if (q.questionType === 'multiple-select') {
    correctAnswer = (q.correctAnswer || []).map((i) => options.indexOf(q.options[i])).filter((i) => i >= 0).sort((a, b) => a - b);
  } else {
    correctAnswer = q.correctAnswer === '' ? '' : options.indexOf(q.options[Number(q.correctAnswer)]);
    if (correctAnswer < 0) correctAnswer = '';
  }
  return {
    _id: q._id || undefined,
    questionText: q.questionText.trim(),
    questionType: q.questionType,
    options,
    correctAnswer,
    explanation: q.explanation || '',
    points: Number(q.points) || 1
  };
};

const validateQuestion = (formQ) => {
  const q = questionToPayload(formQ);
  if (!q.questionText) return 'Question text is required.';
  if (formQ.questionType === 'true-false') {
    if (q.correctAnswer === '') return 'Select the correct true/false answer.';
  } else {
    if (q.options.length < 4) return 'Provide all four answer options.';
    if (formQ.questionType === 'multiple-select') {
      if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) return 'Select at least one correct option.';
    } else if (q.correctAnswer === '') {
      return 'Select the correct option.';
    }
  }
  return '';
};

const QuizManagementPage = () => {
  const { notify } = useFeedback();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [modules, setModules] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [view, setView] = useState('list'); // list | editor
  const [quiz, setQuiz] = useState(blankQuiz());
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [publishErrors, setPublishErrors] = useState([]);
  const [expanded, setExpanded] = useState({});

  const lessons = useMemo(
    () => modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title }))),
    [modules]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/courses?limit=100');
        const list = res.data.courses || [];
        setCourses(list);
        if (list.length) setSelectedCourseId(list[0]._id);
      } catch (err) {
        notify(err.response?.data?.message || 'Failed to load courses');
      }
    })();
  }, []);

  const loadQuizzes = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoadingList(true);
    try {
      const [qRes, currRes] = await Promise.all([
        api.get(`/quizzes/admin/quizzes?courseId=${courseId}`),
        api.get(`/curriculum/courses/${courseId}/curriculum`)
      ]);
      setQuizzes(qRes.data.quizzes || []);
      setModules(currRes.data.modules || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoadingList(false);
    }
  }, [notify]);

  useEffect(() => {
    if (selectedCourseId) loadQuizzes(selectedCourseId);
  }, [selectedCourseId, loadQuizzes]);

  const openEditor = (existing) => {
    setPublishErrors([]);
    setPreviewing(false);
    if (existing) {
      setQuiz({
        ...blankQuiz(),
        ...existing,
        moduleId: existing.moduleId || '',
        lessonId: existing.lessonId || '',
        deadline: existing.deadline ? new Date(existing.deadline).toISOString().slice(0, 16) : '',
        questions: (existing.questions || []).map(questionToForm)
      });
    } else {
      setQuiz(blankQuiz());
    }
    setExpanded({ 0: true });
    setView('editor');
  };

  const totalMarks = quiz.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  // ---------- question editing ----------
  const updateQuestion = (idx, patch) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    }));
  };

  const addQuestion = () => {
    setQuiz((prev) => {
      const next = [...prev.questions, blankQuestion()];
      setExpanded((e) => ({ ...e, [next.length - 1]: true }));
      return { ...prev, questions: next };
    });
  };

  const removeQuestion = (idx) => {
    setQuiz((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const moveQuestion = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= quiz.questions.length) return;
    setQuiz((prev) => {
      const arr = [...prev.questions];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...prev, questions: arr };
    });
  };

  const changeQuestionType = (idx, type) => {
    updateQuestion(idx, {
      questionType: type,
      options: type === 'true-false' ? ['True', 'False'] : (['', '', '', '']),
      correctAnswer: type === 'multiple-select' ? [] : ''
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[oIdx] = value;
        return { ...q, options };
      })
    }));
  };

  const addOption = (qIdx) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q))
    }));
  };

  const removeOption = (qIdx, oIdx) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;
        const options = q.options.filter((_, oi) => oi !== oIdx);
        // Re-map correct answer indexes after removal
        const remap = (val) => {
          if (val === '' || val === null) return val;
          if (Array.isArray(val)) return val.filter((v) => v !== oIdx).map((v) => (v > oIdx ? v - 1 : v));
          if (val === oIdx) return '';
          return val > oIdx ? val - 1 : val;
        };
        return { ...q, options, correctAnswer: remap(q.correctAnswer) };
      })
    }));
  };

  const moveOption = (qIdx, oIdx, dir) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const target = oIdx + dir;
        if (target < 0 || target >= q.options.length) return q;
        const options = [...q.options];
        [options[oIdx], options[target]] = [options[target], options[oIdx]];
        const swap = (val) => {
          if (Array.isArray(val)) return val.map((v) => (v === oIdx ? target : v === target ? oIdx : v)).sort((a, b) => a - b);
          if (val === oIdx) return target;
          if (val === target) return oIdx;
          return val;
        };
        return { ...q, options, correctAnswer: swap(q.correctAnswer) };
      })
    }));
  };

  const toggleCorrect = (qIdx, oIdx) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.questionType === 'multiple-select') {
          const set = new Set(q.correctAnswer || []);
          set.has(oIdx) ? set.delete(oIdx) : set.add(oIdx);
          return { ...q, correctAnswer: [...set].sort((a, b) => a - b) };
        }
        return { ...q, correctAnswer: q.correctAnswer === oIdx ? '' : oIdx };
      })
    }));
  };

  // ---------- save / publish ----------
  const buildPayload = () => {
    const errors = [];
    if (!quiz.title.trim()) errors.push('Quiz title is required.');
    quiz.questions.forEach((q, idx) => {
      const err = validateQuestion(q);
      if (err) errors.push(`Q${idx + 1}: ${err}`);
    });
    const payload = {
      title: quiz.title.trim(),
      description: quiz.description,
      instructions: quiz.instructions,
      courseId: selectedCourseId,
      moduleId: quiz.moduleId || '',
      lessonId: quiz.lessonId || '',
      timeLimitMinutes: Number(quiz.timeLimitMinutes) || 0,
      passingPercentage: Number(quiz.passingPercentage) || 0,
      maxAttempts: Number(quiz.maxAttempts) || 0,
      feedbackMode: quiz.feedbackMode,
      deadline: quiz.deadline ? new Date(quiz.deadline).toISOString() : null,
      questions: quiz.questions.map(questionToPayload)
    };
    return { payload, errors };
  };

  const saveQuiz = async (publish) => {
    const { payload, errors } = buildPayload();
    if (errors.length) {
      setPublishErrors(errors);
      notify('Fix the highlighted issues before saving', 'error');
      return;
    }
    if (publish && payload.questions.length === 0) {
      setPublishErrors(['Add at least one question before publishing.']);
      return;
    }
    setPublishErrors([]);
    setSaving(true);
    payload.published = Boolean(publish);
    try {
      if (quiz._id) {
        await api.put(`/quizzes/admin/quizzes/${quiz._id}`, payload);
      } else {
        const res = await api.post('/quizzes/admin/quizzes', payload);
        setQuiz((prev) => ({ ...prev, _id: res.data.quiz._id }));
      }
      notify(publish ? 'Quiz published' : 'Quiz saved as draft', 'success');
      await loadQuizzes(selectedCourseId);
      if (publish) setView('list');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setPublishErrors(Array.isArray(apiErrors) ? apiErrors : [err.response?.data?.message || 'Save failed']);
      notify(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const quickTogglePublish = async (q) => {
    try {
      if (q.published) {
        await api.patch(`/quizzes/admin/quizzes/${q._id}/unpublish`);
        notify('Quiz unpublished', 'success');
      } else {
        await api.patch(`/quizzes/admin/quizzes/${q._id}/publish`);
        notify('Quiz published', 'success');
      }
      loadQuizzes(selectedCourseId);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (Array.isArray(errs)) notify(errs[0]);
      else notify(err.response?.data?.message || 'Action failed');
    }
  };

  const deleteQuiz = async (q) => {
    if (!window.confirm(`Delete "${q.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/quizzes/admin/quizzes/${q._id}`);
      notify('Quiz deleted', 'success');
      loadQuizzes(selectedCourseId);
    } catch (err) {
      if (err.response?.data?.code === 'QUIZ_HAS_ATTEMPTS') {
        if (window.confirm(`${err.response.data.message} Delete anyway?`)) {
          await api.delete(`/quizzes/admin/quizzes/${q._id}?confirm=true`);
          notify('Quiz deleted', 'success');
          loadQuizzes(selectedCourseId);
        }
      } else {
        notify(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const moveQuizInList = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= quizzes.length) return;
    const arr = [...quizzes];
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setQuizzes(arr);
    api.put('/quizzes/admin/reorder', {
      courseId: selectedCourseId,
      quizIds: arr.map((q) => q._id)
    }).catch((err) => notify(err.response?.data?.message || 'Reorder failed'));
  };

  // ===================== RENDER =====================
  if (view === 'editor') {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to quizzes
          </button>
          <div className="flex gap-2">
            <button onClick={() => setPreviewing((p) => !p)} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-canvas">
              <Eye className="h-4 w-4" /> {previewing ? 'Hide preview' : 'Preview'}
            </button>
            <button onClick={() => saveQuiz(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md border border-brand/20 bg-brand-soft px-3 py-2 text-xs font-bold text-brand hover:bg-line-soft disabled:opacity-50">
              <Save className="h-4 w-4" /> Save draft
            </button>
            <button onClick={() => saveQuiz(true)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy-deep disabled:opacity-50">
              <CloudUpload className="h-4 w-4" /> {saving ? 'Saving...' : 'Publish'}
            </button>
          </div>
        </div>

        {publishErrors.length > 0 && (
          <div className="rounded-lg border border-danger/25 bg-danger-soft p-3 text-xs text-danger space-y-1">
            <p className="font-bold">Please fix the following:</p>
            <ul className="list-disc pl-4 space-y-0.5">{publishErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        <div className={`grid gap-4 ${previewing ? 'lg:grid-cols-2' : ''}`}>
          {/* Editor form */}
          <div className="space-y-4">
            <div className="bg-surface rounded-lg border border-line p-4 space-y-3">
              <div>
                <label className="admin-label">Quiz title</label>
                <input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} className="admin-input text-sm" placeholder="e.g. Module 2 Checkpoint Quiz" />
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea rows={2} value={quiz.description} onChange={(e) => setQuiz({ ...quiz, description: e.target.value })} className="admin-input text-xs" placeholder="Short summary students see before starting" />
              </div>
              <div>
                <label className="admin-label">Instructions</label>
                <textarea rows={2} value={quiz.instructions} onChange={(e) => setQuiz({ ...quiz, instructions: e.target.value })} className="admin-input text-xs" placeholder="Rules shown on the quiz start screen" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="admin-label">Module</label>
                  <select value={quiz.moduleId} onChange={(e) => setQuiz({ ...quiz, moduleId: e.target.value, lessonId: '' })} className="admin-input text-xs cursor-pointer">
                    <option value="">Entire course / no specific module</option>
                    {modules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Lesson (optional)</label>
                  <select value={quiz.lessonId} onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })} className="admin-input text-xs cursor-pointer" disabled={!quiz.moduleId}>
                    <option value="">Whole module</option>
                    {lessons.filter((l) => !quiz.moduleId || l.moduleId === quiz.moduleId).map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="admin-label">Duration (min)</label>
                  <input type="number" min="0" value={quiz.timeLimitMinutes} onChange={(e) => setQuiz({ ...quiz, timeLimitMinutes: e.target.value })} className="admin-input text-xs" />
                </div>
                <div>
                  <label className="admin-label">Pass %</label>
                  <input type="number" min="0" max="100" value={quiz.passingPercentage} onChange={(e) => setQuiz({ ...quiz, passingPercentage: e.target.value })} className="admin-input text-xs" />
                </div>
                <div>
                  <label className="admin-label">Max attempts</label>
                  <input type="number" min="0" value={quiz.maxAttempts} onChange={(e) => setQuiz({ ...quiz, maxAttempts: e.target.value })} className="admin-input text-xs" />
                </div>
                <div>
                  <label className="admin-label">Deadline</label>
                  <input type="datetime-local" value={quiz.deadline} onChange={(e) => setQuiz({ ...quiz, deadline: e.target.value })} className="admin-input h-8 text-[11px]" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div>
                  <label className="admin-label">Feedback mode</label>
                  <div className="inline-flex rounded-md border border-line overflow-hidden text-xs">
                    <button type="button" onClick={() => setQuiz({ ...quiz, feedbackMode: 'immediate' })} className={`px-3 py-1.5 font-semibold ${quiz.feedbackMode === 'immediate' ? 'bg-navy text-white' : 'bg-surface text-ink-soft'}`}>Practice</button>
                    <button type="button" onClick={() => setQuiz({ ...quiz, feedbackMode: 'deferred' })} className={`px-3 py-1.5 font-semibold ${quiz.feedbackMode === 'deferred' ? 'bg-navy text-white' : 'bg-surface text-ink-soft'}`}>Assessment</button>
                  </div>
                </div>
                <div className="text-[11px] text-ink-soft">
                  Total marks: <span className="font-bold text-ink">{totalMarks}</span> · {quiz.questions.length} question(s)
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {quiz.questions.map((q, idx) => {
                const qErr = validateQuestion(q);
                return (
                  <div key={q._id || idx} className="bg-surface rounded-lg border border-line shadow-card">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-line-soft">
                      <button type="button" onClick={() => setExpanded((e) => ({ ...e, [idx]: !e[idx] }))} className="flex items-center gap-2 font-bold text-xs text-ink">
                        <GripVertical className="h-4 w-4 text-line" />
                        Question {idx + 1}
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${qErr ? 'bg-warning-soft text-[#92400e]' : 'bg-success-soft text-[#15803d]'}`}>{qErr ? 'Incomplete' : 'Ready'}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                        <button onClick={() => moveQuestion(idx, 1)} disabled={idx === quiz.questions.length - 1} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                        <button onClick={() => removeQuestion(idx)} className="p-1 text-ink-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>

                    {expanded[idx] && (
                      <div className="p-4 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <textarea rows={2} value={q.questionText} onChange={(e) => updateQuestion(idx, { questionText: e.target.value })} placeholder="Type the question..." className="admin-input flex-1" />
                          <div className="flex gap-2 shrink-0">
                            <select value={q.questionType} onChange={(e) => changeQuestionType(idx, e.target.value)} className="rounded-md border border-line p-2 bg-canvas text-xs cursor-pointer">
                              {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <div className="flex items-center gap-1 rounded-md border border-line px-2">
                              <span className="text-ink-soft">Marks</span>
                              <input type="number" min="0" value={q.points} onChange={(e) => updateQuestion(idx, { points: Number(e.target.value) })} className="w-12 p-1 text-center" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-bold text-ink-soft">{q.questionType === 'multiple-select' ? 'Tick all correct options:' : 'Select the correct answer:'}</p>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2 rounded-lg border border-line-soft p-1.5">
                              <input
                                type={q.questionType === 'multiple-select' ? 'checkbox' : 'radio'}
                                name={`correct-${idx}`}
                                checked={q.questionType === 'multiple-select' ? (q.correctAnswer || []).includes(oIdx) : q.correctAnswer === oIdx}
                                onChange={() => toggleCorrect(idx, oIdx)}
                                className="h-4 w-4 accent-brand"
                                aria-label={`Mark option ${oIdx + 1} correct`}
                              />
                              <input value={opt} disabled={q.questionType === 'true-false'} onChange={(e) => updateOption(idx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} className="flex-1 rounded-md border border-line p-1.5 text-xs disabled:bg-canvas disabled:text-ink-faint" />
                              {q.questionType !== 'true-false' && (
                                <div className="flex items-center gap-0.5">
                                  <button type="button" onClick={() => moveOption(idx, oIdx, -1)} disabled={oIdx === 0} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                                  <button type="button" onClick={() => moveOption(idx, oIdx, 1)} disabled={oIdx === q.options.length - 1} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                                  <button type="button" onClick={() => removeOption(idx, oIdx)} disabled={q.options.length <= 2} className="p-1 text-ink-faint hover:text-danger disabled:opacity-30"><X className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </div>
                          ))}
                          {q.questionType !== 'true-false' && (
                            <button type="button" onClick={() => addOption(idx)} className="inline-flex items-center gap-1 text-brand font-bold hover:underline"><Plus className="h-3.5 w-3.5" /> Add option</button>
                          )}
                        </div>

                        <div>
                          <label className="admin-label">Explanation (shown with feedback)</label>
                          <textarea rows={2} value={q.explanation} onChange={(e) => updateQuestion(idx, { explanation: e.target.value })} className="admin-input placeholder="Why this answer is correct..." />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={addQuestion} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-line py-2.5 text-xs font-bold text-brand hover:bg-brand-soft">
                <Plus className="h-4 w-4" /> Add question
              </button>
            </div>
          </div>

          {/* Preview */}
          {previewing && (
            <div className="bg-canvas rounded-lg border border-line p-4 space-y-3 lg:sticky lg:top-4 self-start max-h-[90vh] overflow-y-auto">
              <h3 className="text-xs font-bold uppercase text-ink-soft flex items-center gap-1.5"><Eye className="h-4 w-4" /> Student preview (answers hidden)</h3>
              <div className="bg-surface rounded-lg border border-line p-4">
                <h4 className="font-bold text-sm text-ink">{quiz.title || 'Untitled quiz'}</h4>
                <p className="text-[11px] text-ink-soft mt-1">
                  {quiz.questions.length} questions · {totalMarks} marks · Pass {quiz.passingPercentage}% · {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'Untimed'} · {quiz.feedbackMode === 'immediate' ? 'Practice' : 'Assessment'} mode
                </p>
                <div className="mt-4 space-y-4">
                  {quiz.questions.map((q, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-semibold text-ink">{idx + 1}. {q.questionText || <span className="text-ink-faint">Question text…</span>}</p>
                      <div className="mt-1.5 space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2 rounded-lg bg-canvas px-2 py-1 text-ink-soft">
                            <span className={`h-3.5 w-3.5 rounded-full border ${q.questionType === 'multiple-select' ? 'rounded-sm' : ''} border-line`} />
                            {opt || <span className="text-ink-faint">Option…</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {quiz.questions.length === 0 && <p className="text-xs text-ink-faint italic">No questions added yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===================== LIST VIEW =====================
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink">Quiz Management</h1>
          <p className="text-xs text-ink-soft mt-1">Build, preview, publish and reorder quizzes for each course module or lesson.</p>
        </div>
        <button onClick={() => openEditor(null)} className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-md bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-deep">
          <Plus className="h-4 w-4" /> New quiz
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg border border-line flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs font-bold text-ink shrink-0">Select course:</label>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="admin-input w-full sm:flex-1 sm:max-w-md text-xs font-semibold cursor-pointer">
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loadingList ? (
        <div className="text-center py-10 text-ink-faint text-sm">Loading quizzes...</div>
      ) : quizzes.length === 0 ? (
        <div className="bg-surface p-10 rounded-lg border text-center text-ink-soft text-sm">
          <ListChecks className="h-8 w-8 mx-auto text-line mb-2" />
          No quizzes for this course yet. Click <span className="font-bold">New quiz</span> to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q, idx) => (
            <div key={q._id} className="bg-surface rounded-lg border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-card">
              <div className="flex items-start gap-2 shrink-0">
                <button onClick={() => moveQuizInList(idx, -1)} disabled={idx === 0} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                <button onClick={() => moveQuizInList(idx, 1)} disabled={idx === quizzes.length - 1} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-ink truncate">{q.title}</h3>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${q.published ? 'bg-success-soft text-[#15803d]' : 'bg-line-soft text-ink-soft'}`}>{q.published ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 truncate">
                  {q.moduleTitle ? `${q.moduleTitle}` : 'Whole course'}{q.lessonTitle ? ` · ${q.lessonTitle}` : ''} · {q.questions?.length || 0} questions · {q.totalMarks} marks · Pass {q.passingPercentage}% · {q.feedbackMode === 'immediate' ? 'Practice' : 'Assessment'}
                </p>
                <p className="text-[11px] text-ink-faint mt-0.5">{q.attemptCount || 0} attempt(s) recorded</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEditor(q)} className="rounded-lg bg-brand-soft text-brand hover:bg-line-soft font-bold px-3 py-1.5 text-xs">Edit</button>
                <button onClick={() => quickTogglePublish(q)} className={`rounded-lg font-bold px-3 py-1.5 text-xs inline-flex items-center gap-1 ${q.published ? 'bg-warning-soft text-[#92400e] hover:bg-warning/20' : 'bg-success-soft text-[#15803d] hover:bg-success/20'}`}>
                  {q.published ? <><CloudOff className="h-3.5 w-3.5" /> Unpublish</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Publish</>}
                </button>
                <button onClick={() => deleteQuiz(q)} className="rounded-lg p-1.5 text-ink-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizManagementPage;
