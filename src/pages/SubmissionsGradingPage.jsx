import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';

const SubmissionsGradingPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState({ open: false, subId: null });
  const [marks, setMarks] = useState(85);
  const [feedback, setFeedback] = useState('');
  const { notify } = useFeedback();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments/submissions/all');
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/submissions/${gradeModal.subId}/grade`, {
        marksObtained: marks,
        feedback
      });
      setGradeModal({ open: false, subId: null });
      fetchSubmissions();
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Student Assignment Submissions</h1>
        <p className="text-xs text-gray-500 mt-1">Review student project links, evaluate results, and provide feedback</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Assignment</th>
                <th className="p-4">Course</th>
                <th className="p-4">Submission Text / URL</th>
                <th className="p-4">Status / Score</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No assignment submissions received yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{sub.studentId?.name}</td>
                    <td className="p-4 font-semibold text-gray-800">{sub.assignmentId?.title}</td>
                    <td className="p-4">{sub.courseId?.title}</td>
                    <td className="p-4 max-w-xs truncate text-indigo-600">
                      <a href={sub.submissionText} target="_blank" rel="noreferrer" className="underline">
                        {sub.submissionText || 'Text submission'}
                      </a>
                    </td>
                    <td className="p-4">
                      {sub.status === 'graded' ? (
                        <span className="font-bold text-emerald-600">
                          {sub.marksObtained} / {sub.assignmentId?.totalMarks || 100}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setGradeModal({ open: true, subId: sub._id });
                          setMarks(sub.marksObtained || 90);
                          setFeedback(sub.feedback || 'Great implementation!');
                        }}
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        {sub.status === 'graded' ? 'Regrade' : 'Grade Submission'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Modal */}
      {gradeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900">Evaluate Student Submission</h3>
            <form onSubmit={handleGrade} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Marks Awarded</label>
                <input
                  type="number"
                  required
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Admin Feedback</label>
                <textarea
                  rows={4}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Code quality, architecture comments..."
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setGradeModal({ open: false, subId: null })}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  Save Marks &amp; Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsGradingPage;
