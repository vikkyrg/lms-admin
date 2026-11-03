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
    draft: 'bg-line-soft text-ink-soft',
    submitted: 'bg-warning-soft text-[#92400e]',
    late: 'bg-warning-soft text-[#c2410c]',
    under_review: 'bg-brand-soft text-brand',
    graded: 'bg-success-soft text-[#15803d]',
    returned_for_revision: 'bg-danger-soft text-danger',
    resubmission_required: 'bg-danger-soft text-danger'
  };
  return map[status] || 'bg-line-soft text-ink-soft';
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
        <h1 className="text-lg font-bold text-ink">Submissions &amp; Grading</h1>
        <p className="text-xs text-ink-soft mt-1">Review text, files, GitHub and live project submissions, then grade or return them for revision.</p>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg border border-line p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="block text-xs">
          <span className="font-semibold text-ink-soft">Course</span>
          <select value={filters.courseId} onChange={(e) => setFilters({ ...filters, courseId: e.target.value, moduleId: '', assignmentId: '' })} className="admin-input mt-1 font-semibold">
            <option value="">All courses</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-semibold text-ink-soft">Module</span>
          <select value={filters.moduleId} onChange={(e) => setFilters({ ...filters, moduleId: e.target.value })} className="admin-input mt-1 font-semibold" disabled={!filters.courseId}>
            <option value="">All modules</option>
            {modules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-semibold text-ink-soft">Assignment</span>
          <select value={filters.assignmentId} onChange={(e) => setFilters({ ...filters, assignmentId: e.target.value })} className="admin-input mt-1 font-semibold">
            <option value="">All assignments</option>
            {assignmentOptions.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-semibold text-ink-soft">Status</span>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="admin-input mt-1 font-semibold">
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="late">Late</option>
            <option value="under_review">Under Review</option>
            <option value="graded">Graded</option>
            <option value="returned_for_revision">Returned</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="font-semibold text-ink-soft">Student search</span>
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or email" className="admin-input mt-1 />
        </label>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs text-ink-soft">
            <thead className="bg-canvas text-ink-soft font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Assignment / Course</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-ink-faint">Loading submissions...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-ink-faint">
                    <Inbox className="h-8 w-8 mx-auto mb-2 text-line" />
                    No submissions match the selected filters.
                  </td>
                </tr>
              ) : visible.map((sub) => (
                <tr key={sub._id} className="hover:bg-canvas">
                  <td className="p-4">
                    <p className="font-bold text-ink">{sub.studentId?.name}</p>
                    <p className="text-[11px] text-ink-faint">{sub.studentId?.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-ink">{sub.assignmentId?.title}</p>
                    <p className="text-[11px] text-ink-faint">{sub.courseId?.title}</p>
                  </td>
                  <td className="p-4">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                    {sub.submissionNumber > 1 && <span className="ml-1 text-[10px] text-ink-faint">(v{sub.submissionNumber})</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(sub.status)}`}>{STATUS_LABELS[sub.status] || sub.status}</span>
                  </td>
                  <td className="p-4 font-bold text-ink">
                    {sub.status === 'graded' ? `${sub.marksObtained} / ${sub.assignmentId?.totalMarks ?? '—'}` : '—'}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => openDetail(sub)} className="inline-flex items-center gap-1 bg-brand-soft text-brand hover:bg-line-soft font-bold px-3 py-1.5 rounded-lg text-xs">
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
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-surface rounded-t-xl sm:rounded-lg border border-line shadow-overlay admin-modal-in max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[94vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-ink">{openSub.assignmentId?.title}</h3>
                <p className="text-xs text-ink-soft">{openSub.studentId?.name} · {openSub.courseId?.title}</p>
              </div>
              <button onClick={() => setOpenSub(null)} className="p-1 text-ink-faint hover:text-ink"><span className="text-xl leading-none">×</span></button>
            </div>

            {/* Submission content */}
            <div className="rounded-lg border border-line p-4 space-y-3 text-xs bg-canvas">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge(openSub.status)}`}>{STATUS_LABELS[openSub.status]}</span>
                <span className="text-ink-faint">Due {openSub.assignmentId?.dueDate ? new Date(openSub.assignmentId.dueDate).toLocaleDateString() : '—'}</span>
              </div>

              {openSub.submissionText && (
                <div>
                  <p className="font-semibold text-ink-soft mb-1 flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Text response</p>
                  <p className="whitespace-pre-wrap text-ink rounded-lg bg-surface border border-line p-3 max-h-48 overflow-y-auto">{openSub.submissionText}</p>
                </div>
              )}
              {openSub.githubUrl && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-ink-soft" />
                  <a href={openSub.githubUrl} target="_blank" rel="noreferrer" className="text-brand underline break-all flex items-center gap-1">GitHub repository <ExternalLink className="h-3 w-3" /></a>
                </div>
              )}
              {openSub.liveUrl && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-ink-soft" />
                  <a href={openSub.liveUrl} target="_blank" rel="noreferrer" className="text-brand underline break-all flex items-center gap-1">Live project <ExternalLink className="h-3 w-3" /></a>
                </div>
              )}
              {openSub.fileUrl && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ink-soft" />
                  <span className="text-ink">{openSub.fileName}</span>
                  <button onClick={() => downloadFile(openSub)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-navy text-white hover:bg-navy-deep font-bold px-2.5 py-1 text-[11px]">
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              )}
              {!openSub.submissionText && !openSub.githubUrl && !openSub.liveUrl && !openSub.fileUrl && (
                <p className="text-ink-faint italic">No content in this submission yet.</p>
              )}
            </div>

            {/* Grading */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="font-semibold text-ink-soft">Marks (max {openSub.assignmentId?.totalMarks ?? 100})</span>
                  <input type="number" min="0" max={openSub.assignmentId?.totalMarks ?? 100} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="admin-input mt-1" />
                </label>
                <div className="flex items-end text-[11px] text-ink-soft pb-2">
                  Passing marks: {openSub.assignmentId?.passingMarks ?? '—'}
                </div>
              </div>
              <label className="block text-xs">
                <span className="font-semibold text-ink-soft">Detailed feedback</span>
                <textarea rows={4} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="What went well, what to improve..." className="admin-input mt-1" />
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => submitGrade('grade')} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-success hover:bg-[#15803d] text-white font-bold px-4 py-2.5 text-xs disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> Mark as Graded
                </button>
                <button onClick={() => submitGrade('return')} disabled={saving || !feedbackText.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-danger/25 bg-danger-soft text-danger hover:bg-[#fee2e2] font-bold px-4 py-2.5 text-xs disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> Return for Revision
                </button>
              </div>
            </div>

            {/* Grading history */}
            {openSub.gradingHistory?.length > 0 && (
              <div className="border-t border-line pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">Grading history</p>
                <div className="space-y-2">
                  {openSub.gradingHistory.map((h, i) => (
                    <div key={i} className="text-[11px] text-ink-soft rounded-lg bg-canvas border border-line p-2">
                      <span className="font-bold">{STATUS_LABELS[h.status] || h.status}</span>
                      {h.marksObtained !== undefined && h.marksObtained !== null && <> · {h.marksObtained} marks</>}
                      {' · '}{new Date(h.performedAt).toLocaleString()}
                      {h.feedback && <p className="mt-1 text-ink-soft">{h.feedback}</p>}
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
