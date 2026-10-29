import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import {
  Plus, Trash2, X, Save, CloudUpload, CloudOff, ArrowLeft, Paperclip,
  CheckCircle2, ListChecks, Upload
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const SUBMISSION_TYPES = [
  { value: 'text', label: 'Text response' },
  { value: 'file', label: 'File upload' },
  { value: 'github', label: 'GitHub repository URL' },
  { value: 'live-url', label: 'Live project URL' }
];

const FILE_TYPE_OPTIONS = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.png', '.jpg'];

const blankAssignment = () => ({
  _id: '',
  title: '',
  description: '',
  instructions: '',
  learningObjectivesText: '',
  isProject: false,
  moduleId: '',
  lessonId: '',
  submissionTypes: ['text'],
  allowedFileTypes: [],
  maxFileSizeMb: 25,
  dueDate: '',
  totalMarks: 100,
  passingMarks: 40,
  rubric: '',
  allowLateSubmission: true,
  allowResubmission: 'before-grading',
  published: false
});

const AssignmentManagementPage = () => {
  const { notify } = useFeedback();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState('list');
  const [form, setForm] = useState(blankAssignment());
  const [referenceFile, setReferenceFile] = useState(null);
  const [starterFiles, setStarterFiles] = useState([]);
  const [existingReference, setExistingReference] = useState(null);
  const [existingStarters, setExistingStarters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const lessons = useMemo(() => modules.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title }))), [modules]);

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

  const loadAssignments = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const [aRes, currRes] = await Promise.all([
        api.get(`/assignments/admin/list?courseId=${courseId}`),
        api.get(`/curriculum/courses/${courseId}/curriculum`)
      ]);
      setAssignments(aRes.data.assignments || []);
      setModules(currRes.data.modules || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    if (selectedCourseId) loadAssignments(selectedCourseId);
  }, [selectedCourseId, loadAssignments]);

  const openEditor = (existing) => {
    setErrors([]);
    setReferenceFile(null);
    setStarterFiles([]);
    if (existing) {
      setForm({
        ...blankAssignment(),
        ...existing,
        moduleId: existing.moduleId || '',
        lessonId: existing.lessonId || '',
        learningObjectivesText: (existing.learningObjectives || []).join('\n'),
        dueDate: existing.dueDate ? new Date(existing.dueDate).toISOString().slice(0, 16) : '',
        submissionTypes: existing.submissionTypes || ['text'],
        allowedFileTypes: existing.allowedFileTypes || []
      });
      setExistingReference(existing.referenceFile && existing.referenceFile.fileUrl ? existing.referenceFile : null);
      setExistingStarters(existing.starterFiles || []);
    } else {
      setForm(blankAssignment());
      setExistingReference(null);
      setExistingStarters([]);
    }
    setView('editor');
  };

  const toggleInArray = (key, value) => {
    setForm((prev) => {
      const set = new Set(prev[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [key]: [...set] };
    });
  };

  const buildFormData = (publish) => {
    const fd = new FormData();
    const objectives = form.learningObjectivesText.split('\n').map((s) => s.trim()).filter(Boolean);
    fd.append('title', form.title.trim());
    fd.append('description', form.description);
    fd.append('instructions', form.instructions);
    fd.append('courseId', selectedCourseId);
    fd.append('moduleId', form.moduleId || '');
    fd.append('lessonId', form.lessonId || '');
    fd.append('learningObjectives', JSON.stringify(objectives));
    fd.append('isProject', String(Boolean(form.isProject)));
    fd.append('submissionTypes', JSON.stringify(form.submissionTypes));
    fd.append('allowedFileTypes', JSON.stringify(form.allowedFileTypes));
    fd.append('maxFileSizeMb', String(Number(form.maxFileSizeMb) || 25));
    fd.append('dueDate', form.dueDate ? new Date(form.dueDate).toISOString() : '');
    fd.append('totalMarks', String(Number(form.totalMarks) || 100));
    fd.append('passingMarks', String(Number(form.passingMarks) || 0));
    fd.append('rubric', form.rubric);
    fd.append('allowLateSubmission', String(Boolean(form.allowLateSubmission)));
    fd.append('allowResubmission', form.allowResubmission);
    fd.append('published', String(Boolean(publish)));
    if (referenceFile) fd.append('referenceFile', referenceFile);
    starterFiles.forEach((f) => fd.append('starterFiles', f));
    return fd;
  };

  const validate = () => {
    const errs = [];
    if (!form.title.trim()) errs.push('Title is required.');
    if (!form.dueDate) errs.push('Due date is required.');
    if (!form.instructions.trim() && !form.description.trim()) errs.push('Add a description or instructions.');
    if (form.submissionTypes.length === 0) errs.push('Select at least one submission type.');
    if (form.submissionTypes.includes('file') && form.allowedFileTypes.length === 0) {
      errs.push('Choose allowed file types (or remove the file submission type).');
    }
    if (Number(form.passingMarks) > Number(form.totalMarks)) errs.push('Passing marks cannot exceed total marks.');
    return errs;
  };

  const save = async (publish) => {
    const errs = validate();
    if (errs.length) { setErrors(errs); notify('Fix the highlighted issues'); return; }
    setErrors([]);
    setSaving(true);
    try {
      const fd = buildFormData(publish);
      if (form._id) {
        await api.put(`/assignments/admin/${form._id}`, fd);
      } else {
        await api.post('/assignments/admin', fd);
      }
      notify(publish ? 'Assignment published' : 'Assignment saved as draft', 'success');
      await loadAssignments(selectedCourseId);
      if (publish) setView('list');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setErrors(Array.isArray(apiErrors) ? apiErrors : [err.response?.data?.message || 'Save failed']);
      notify(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (a) => {
    try {
      await api.patch(`/assignments/admin/${a._id}/${a.published ? 'unpublish' : 'publish'}`);
      notify(a.published ? 'Assignment unpublished' : 'Assignment published', 'success');
      loadAssignments(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed');
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/assignments/admin/${a._id}`);
      notify('Assignment deleted', 'success');
      loadAssignments(selectedCourseId);
    } catch (err) {
      if (err.response?.data?.code === 'ASSIGNMENT_HAS_SUBMISSIONS') {
        if (window.confirm(`${err.response.data.message} Delete anyway?`)) {
          await api.delete(`/assignments/admin/${a._id}?confirm=true`);
          notify('Assignment deleted', 'success');
          loadAssignments(selectedCourseId);
        }
      } else {
        notify(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const needsFile = form.submissionTypes.includes('file');

  if (view === 'editor') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back to assignments</button>
          <div className="flex gap-2">
            <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"><Save className="h-4 w-4" /> Save draft</button>
            <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><CloudUpload className="h-4 w-4" /> {saving ? 'Saving...' : 'Publish'}</button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 space-y-1">
            <p className="font-bold">Please fix the following:</p>
            <ul className="list-disc pl-4">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Assignment title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm" placeholder="e.g. Build a CI/CD pipeline project" />
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" checked={form.isProject} onChange={(e) => setForm({ ...form, isProject: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              This is a real-world project
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Instructions</label>
            <textarea rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs" placeholder="Step-by-step what the student must do" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Learning objectives (one per line)</label>
            <textarea rows={3} value={form.learningObjectivesText} onChange={(e) => setForm({ ...form, learningObjectivesText: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs" placeholder={'Deploy a containerized app\nWrite automated tests'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Module</label>
              <select value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value, lessonId: '' })} className="w-full rounded-xl border border-gray-300 p-2 text-xs bg-gray-50">
                <option value="">Whole course</option>
                {modules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Lesson (optional)</label>
              <select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2 text-xs bg-gray-50" disabled={!form.moduleId}>
                <option value="">Whole module</option>
                {lessons.filter((l) => !form.moduleId || l.moduleId === form.moduleId).map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Submission types (students may use any checked option)</label>
            <div className="flex flex-wrap gap-2">
              {SUBMISSION_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => toggleInArray('submissionTypes', t.value)} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${form.submissionTypes.includes(t.value) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {needsFile && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Allowed file types</label>
              <div className="flex flex-wrap gap-2">
                {FILE_TYPE_OPTIONS.map((ext) => (
                  <button key={ext} type="button" onClick={() => toggleInArray('allowedFileTypes', ext)} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${form.allowedFileTypes.includes(ext) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600'}`}>{ext}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Due date</label>
              <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-lg border border-gray-300 p-1.5 text-[11px]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Total marks</label>
              <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Passing marks</label>
              <input type="number" min="0" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Max file (MB)</label>
              <input type="number" min="1" max="50" value={form.maxFileSizeMb} onChange={(e) => setForm({ ...form, maxFileSizeMb: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs" disabled={!needsFile} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Rubric / grading criteria</label>
            <textarea rows={3} value={form.rubric} onChange={(e) => setForm({ ...form, rubric: e.target.value })} className="w-full rounded-xl border border-gray-300 p-2.5 text-xs" placeholder="How marks are awarded..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Resubmission policy</label>
              <select value={form.allowResubmission} onChange={(e) => setForm({ ...form, allowResubmission: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-gray-50">
                <option value="never">Never</option>
                <option value="before-grading">Allowed until graded</option>
                <option value="after-revision">Only after being returned</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input type="checkbox" checked={form.allowLateSubmission} onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
                Allow late submission (marked as Late)
              </label>
            </div>
          </div>

          {/* Files */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Reference PDF / document (optional)</label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" /> {referenceFile ? referenceFile.name : (existingReference ? 'Replace file' : 'Choose file')}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.zip" onChange={(e) => setReferenceFile(e.target.files?.[0] || null)} />
              </label>
              {existingReference && !referenceFile && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><Paperclip className="h-3 w-3" /> {existingReference.fileName}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Starter files (optional, multiple)</label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                <Upload className="h-4 w-4" /> Add starter files
                <input type="file" multiple className="hidden" onChange={(e) => setStarterFiles(Array.from(e.target.files || []))} />
              </label>
              {starterFiles.length > 0 && <p className="text-[10px] text-gray-500 mt-1">{starterFiles.length} file(s) selected</p>}
              {existingStarters.length > 0 && starterFiles.length === 0 && <p className="text-[10px] text-gray-500 mt-1">{existingStarters.length} existing starter file(s)</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Assignment Management</h1>
          <p className="text-xs text-gray-500 mt-1">Create assignments and real-world projects tied to courses, modules and lessons.</p>
        </div>
        <button onClick={() => openEditor(null)} className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> New assignment</button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs font-bold text-gray-700 shrink-0">Select course:</label>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full sm:flex-1 sm:max-w-md bg-gray-50 border border-gray-300 text-xs rounded-xl p-2 font-semibold text-gray-800">
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border text-center text-gray-500 text-sm">
          <ListChecks className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          No assignments for this course yet. Click <span className="font-bold">New assignment</span> to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-gray-900">{a.title}</h3>
                  {a.isProject && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Project</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{a.published ? 'Published' : 'Draft'}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {a.moduleTitle || 'Whole course'}{a.lessonTitle ? ` · ${a.lessonTitle}` : ''} · {(a.submissionTypes || []).join(', ')} · {a.totalMarks} marks · Due {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{a.submissionCount || 0} submission(s) · {a.pendingGradingCount || 0} awaiting grading</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEditor(a)} className="rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 text-xs">Edit</button>
                <button onClick={() => quickToggle(a)} className={`rounded-lg font-bold px-3 py-1.5 text-xs inline-flex items-center gap-1 ${a.published ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                  {a.published ? <><CloudOff className="h-3.5 w-3.5" /> Unpublish</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Publish</>}
                </button>
                <button onClick={() => remove(a)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentManagementPage;
