import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import {
  ExternalLink, Download, Eye, FileText, GitBranch, Link2,
  CheckCircle2, RotateCcw, Inbox
} from 'lucide-react';

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  late: 'Late',
  under_review: 'Under Review',
  graded: 'Graded',
  returned_for_revision: 'Returned for Revision',
  resubmission_required: 'Returned for Revision'
};

const statusBadge = (status) => {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-amber-50 text-amber-700',
    late: 'bg-orange-50 text-orange-700',
    under_review: 'bg-blue-50 text-blue-700',
    graded: 'bg-emerald-50 text-emerald-700',
    returned_for_revision: 'bg-rose-50 text-rose-700',
    resubmission_required: 'bg-rose-50 text-rose-700'
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const SubmissionsGradingPage = () => {
  const { notify } = useFeedback();
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ courseId: '', moduleId: '', assignmentId: '', status: 'all', search: '' });
  const [openSub, setOpenSub] = useState(null);
  const [marks, setMarks] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [saving, setSaving] = useState(false);

  const [modules, setModules] = useState([]);

  useEffect(() => {
    api.get('/courses?limit=100')
      .then((res) => setCourses(res.data.courses || []))
      .catch((err) => notify(err.response?.data?.message || 'Failed to load courses'));
  }, []);

  useEffect(() => {
    if (!filters.courseId) { setModules([]); return; }
    api.get(`/curriculum/courses/${filters.courseId}/curriculum`)
      .then((res) => setModules(res.data.modules || []))
      .catch(() => setModules([]));
  }, [filters.courseId]);

  const assignmentOptions = useMemo(() => {
    const ids = new Set(submissions.map((s) => String(s.assignmentId?._id)));
    return submissions
      .filter((s, idx) => s.assignmentId && [...ids].indexOf(String(s.assignmentId._id)) === idx)
      .map((s) => s.assignmentId);
  }, [submissions]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.courseId) params.set('courseId', filters.courseId);
      if (filters.moduleId) params.set('moduleId', filters.moduleId);
      if (filters.assignmentId) params.set('assignmentId', filters.assignmentId);
      if (filters.status !== 'all') params.set('status', filters.status);
      const res = await api.get(`/assignments/submissions/all?${params.toString()}`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [filters, notify]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const visible = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return submissions;
    return submissions.filter((s) =>
      `${s.studentId?.name || ''} ${s.studentId?.email || ''} ${s.assignmentId?.title || ''}`.toLowerCase().includes(term)
    );
  }, [submissions, filters.search]);

  const openDetail = async (sub) => {
    setOpenSub(sub);
    setMarks(sub.marksObtained ?? 0);
    setFeedbackText(sub.feedback || '');
    // Moving a fresh submission into review reflects that a grader opened it.
    if (['submitted', 'late'].includes(sub.status)) {
      try {
        const res = await api.put(`/assignments/submissions/${sub._id}/grade`, { action: 'review' });
        const updated = res.data.submission;
        setSubmissions((prev) => prev.map((s) => (s._id === updated._id ? { ...s, status: updated.status } : s)));
        setOpenSub((prev) => (prev && prev._id === updated._id ? { ...prev, status: updated.status } : prev));
      } catch (err) {
        // Non-blocking: review flag is cosmetic.
      }
    }
  };

  const submitGrade = async (action) => {
    setSaving(true);
    try {
      const payload = action === 'grade'
        ? { action: 'grade', marksObtained: Number(marks), feedback: feedbackText }
        : { action: 'return', feedback: feedbackText };
      const res = await api.put(`/assignments/submissions/${openSub._id}/grade`, payload);
      setSubmissions((prev) => prev.map((s) => (s._id === res.data.submission._id ? res.data.submission : s)));
      setOpenSub(null);
      notify(action === 'grade' ? 'Submission graded' : 'Returned for revision', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Grading failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (sub) => {
    try {
      const res = await api.get(`/assignments/submissions/${sub._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = sub.fileName || 'submission-file';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify('This submission file is unavailable');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Submissions &amp; Grading</h1>
        <p className="text-xs text-gray-500 mt-1">Review text, files, GitHub and live project submissions, then grade or return them for revision.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="block text-xs">
          <span className="font-bold text-gray-600">Course</span>
          <select value={filters.courseId} onChange={(e) => setFilters({ ...filters, courseId: e.target.value, moduleId: '', assignmentId: '' })} className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2 font-semibold text-gray-800">
            <option value="">All courses</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-gray-600">Module</span>
          <select value={filters.moduleId} onChange={(e) => setFilters({ ...filters, moduleId: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2 font-semibold text-gray-800" disabled={!filters.courseId}>
            <option value="">All modules</option>
            {modules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-gray-600">Assignment</span>
          <select value={filters.assignmentId} onChange={(e) => setFilters({ ...filters, assignmentId: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2 font-semibold text-gray-800">
            <option value="">All assignments</option>
            {assignmentOptions.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-gray-600">Status</span>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 p-2 font-semibold text-gray-800">
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="late">Late</option>
            <option value="under_review">Under Review</option>
            <option value="graded">Graded</option>
            <option value="returned_for_revision">Returned</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-bold text-gray-600">Student search</span>
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or email" className="mt-1 w-full rounded-xl border border-gray-300 p-2" />
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Assignment / Course</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading submissions...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400">
                    <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No submissions match the selected filters.
                  </td>
                </tr>
              ) : visible.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{sub.studentId?.name}</p>
                    <p className="text-[11px] text-gray-400">{sub.studentId?.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{sub.assignmentId?.title}</p>
                    <p className="text-[11px] text-gray-400">{sub.courseId?.title}</p>
                  </td>
                  <td className="p-4">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                    {sub.submissionNumber > 1 && <span className="ml-1 text-[10px] text-gray-400">(v{sub.submissionNumber})</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(sub.status)}`}>{STATUS_LABELS[sub.status] || sub.status}</span>
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                    {sub.status === 'graded' ? `${sub.marksObtained} / ${sub.assignmentId?.totalMarks ?? '—'}` : '—'}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => openDetail(sub)} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg text-xs">
                      <Eye className="h-3.5 w-3.5" /> {sub.status === 'graded' ? 'View / Regrade' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail + grading modal */}
      {openSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">{openSub.assignmentId?.title}</h3>
                <p className="text-xs text-gray-500">{openSub.studentId?.name} · {openSub.courseId?.title}</p>
              </div>
              <button onClick={() => setOpenSub(null)} className="p-1 text-gray-400 hover:text-gray-700"><span className="text-xl leading-none">×</span></button>
            </div>

            {/* Submission content */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3 text-xs bg-gray-50/60">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(openSub.status)}`}>{STATUS_LABELS[openSub.status]}</span>
                <span className="text-gray-400">Due {openSub.assignmentId?.dueDate ? new Date(openSub.assignmentId.dueDate).toLocaleDateString() : '—'}</span>
              </div>

              {openSub.submissionText && (
                <div>
                  <p className="font-bold text-gray-600 mb-1 flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Text response</p>
                  <p className="whitespace-pre-wrap text-gray-800 rounded-lg bg-white border border-gray-200 p-3 max-h-48 overflow-y-auto">{openSub.submissionText}</p>
                </div>
              )}
              {openSub.githubUrl && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <a href={openSub.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline break-all flex items-center gap-1">GitHub repository <ExternalLink className="h-3 w-3" /></a>
                </div>
              )}
              {openSub.liveUrl && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-gray-500" />
                  <a href={openSub.liveUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline break-all flex items-center gap-1">Live project <ExternalLink className="h-3 w-3" /></a>
                </div>
              )}
              {openSub.fileUrl && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{openSub.fileName}</span>
                  <button onClick={() => downloadFile(openSub)} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white font-bold px-2.5 py-1 text-[11px]">
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              )}
              {!openSub.submissionText && !openSub.githubUrl && !openSub.liveUrl && !openSub.fileUrl && (
                <p className="text-gray-400 italic">No content in this submission yet.</p>
              )}
            </div>

            {/* Grading */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="font-bold text-gray-600">Marks (max {openSub.assignmentId?.totalMarks ?? 100})</span>
                  <input type="number" min="0" max={openSub.assignmentId?.totalMarks ?? 100} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-gray-300 p-2.5" />
                </label>
                <div className="flex items-end text-[11px] text-gray-500 pb-2">
                  Passing marks: {openSub.assignmentId?.passingMarks ?? '—'}
                </div>
              </div>
              <label className="block text-xs">
                <span className="font-bold text-gray-600">Detailed feedback</span>
                <textarea rows={4} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="What went well, what to improve..." className="mt-1 w-full rounded-xl border border-gray-300 p-2.5" />
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => submitGrade('grade')} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-xs disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Mark as Graded
                </button>
                <button onClick={() => submitGrade('return')} disabled={saving || !feedbackText.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-4 py-2.5 text-xs disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> Return for Revision
                </button>
              </div>
            </div>

            {/* Grading history */}
            {openSub.gradingHistory?.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Grading history</p>
                <div className="space-y-2">
                  {openSub.gradingHistory.map((h, i) => (
                    <div key={i} className="text-[11px] text-gray-600 rounded-lg bg-gray-50 border border-gray-200 p-2">
                      <span className="font-bold">{STATUS_LABELS[h.status] || h.status}</span>
                      {h.marksObtained !== undefined && h.marksObtained !== null && <> · {h.marksObtained} marks</>}
                      {' · '}{new Date(h.performedAt).toLocaleString()}
                      {h.feedback && <p className="mt-1 text-gray-500">{h.feedback}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsGradingPage;
