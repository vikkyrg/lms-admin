import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  FileText,
  DollarSign,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import { courseTypeLabel, formatCoursePrice, isFreeCourse, paymentSummary } from '../utils/courseAccess';

const studentOf = (enr) => enr?.student || enr?.user || {};

const toneClass = (tone) => {
  switch (tone) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800';
    case 'warning':
      return 'bg-amber-100 text-amber-800';
    case 'danger':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const EnrollmentsManagementPage = () => {
  const { notify, confirm } = useFeedback();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');
  const [search, setSearch] = useState('');
  
  // Rejection modal state
  const [rejectingEnrollment, setRejectingEnrollment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/enrollments/admin/list?status=${filter}&limit=100`);
      if (res.data.success) {
        setEnrollments(res.data.enrollments || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Error loading enrollments',
        message: err.response?.data?.message || 'Could not fetch enrollments list'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [filter]);

  const handleApprove = async (enrollment) => {
    const ok = await confirm({
      title: 'Approve Enrollment & Grant 3-Month Access?',
      message: `Are you sure you want to approve ${studentOf(enrollment).name || 'this student'} for "${enrollment.course?.title}"? This will activate their access for exactly 3 calendar months starting today.`
    });

    if (!ok) return;

    try {
      setProcessingId(enrollment._id);
      const res = await api.put(`/enrollments/admin/${enrollment._id}/approve`);
      if (res.data.success) {
        notify({
          type: 'success',
          title: 'Enrollment Approved',
          message: `Access granted until ${new Date(res.data.data.accessExpiryDate).toLocaleDateString()}`
        });
        fetchEnrollments();
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Approval Failed',
        message: err.response?.data?.message || 'Failed to approve enrollment'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    if (!rejectingEnrollment) return;

    try {
      setProcessingId(rejectingEnrollment._id);
      const res = await api.put(`/enrollments/admin/${rejectingEnrollment._id}/reject`, {
        reason: rejectionReason
      });
      if (res.data.success) {
        notify({
          type: 'success',
          title: 'Enrollment Rejected',
          message: 'Enrollment has been marked as rejected.'
        });
        setRejectingEnrollment(null);
        setRejectionReason('');
        fetchEnrollments();
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Rejection Failed',
        message: err.response?.data?.message || 'Failed to reject enrollment'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    const term = search.toLowerCase();
    const student = studentOf(e);
    const studentName = student.name?.toLowerCase() || '';
    const studentEmail = student.email?.toLowerCase() || '';
    const courseTitle = e.course?.title?.toLowerCase() || '';
    return studentName.includes(term) || studentEmail.includes(term) || courseTitle.includes(term);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved / Active
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5" /> Access Expired
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-indigo-600" />
            Enrollment Approvals &amp; 3-Month Access
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review free and paid enrollments, check verified payments, approve access for exactly 3 calendar months, or reject applications.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pending_approval', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved (Active)' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'expired', label: 'Expired' },
            { id: 'all', label: 'All Enrollments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by student name, email, or course title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-500">Loading enrollment records...</p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">No enrollments found</p>
            <p className="text-xs text-slate-500">No records match the current filter "{filter}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Student Details</th>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Course Type</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3">Access Period (3 Mos)</th>
                  <th className="px-5 py-3">Enrollment Status</th>
                  <th className="px-5 py-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr) => {
                  const isPending = enr.status === 'pending_approval';
                  const isProcessing = processingId === enr._id;
                  const student = studentOf(enr);
                  const free = isFreeCourse(enr.course);
                  const payment = paymentSummary(enr);
                  // A paid course can only be approved once the backend has
                  // verified the Razorpay payment (server enforces this too).
                  const paidButUnverified = !free && enr.payment?.status !== 'completed';

                  return (
                    <tr key={enr._id} className="hover:bg-slate-50/60 transition">
                      {/* Student info */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{student.name || 'Unknown User'}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {student.email || 'No email'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.phone || <span className="text-amber-600 italic">No phone entered</span>}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {enr.course?.title || 'Unknown Course'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Enrolled on {new Date(enr.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Course type */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          free ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {courseTypeLabel(enr.course)}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {free ? 'Price on record: ₹0' : formatCoursePrice(enr.course)}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${toneClass(payment.tone)}`}>
                          {payment.label}
                        </span>
                        {enr.payment ? (
                          <div className="text-[11px] text-slate-400 mt-1 break-all">
                            <div>Order: {enr.payment.orderId || '—'}</div>
                            <div>Payment: {enr.payment.paymentId || 'not captured yet'}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-1 italic">
                            {free ? 'No Razorpay order for free enrollments' : 'Awaiting a verified gateway payment'}
                          </div>
                        )}
                      </td>

                      {/* Access window */}
                      <td className="px-5 py-4">
                        {enr.accessStartDate && enr.accessExpiryDate ? (
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-700">
                              <span className="font-semibold">Start:</span> {new Date(enr.accessStartDate).toLocaleDateString()}
                            </div>
                            <div className="text-slate-700">
                              <span className="font-semibold">Expires:</span> {new Date(enr.accessExpiryDate).toLocaleDateString()}
                            </div>
                            {enr.status === 'approved' && (
                              <div className="text-emerald-700 font-semibold text-[11px]">
                                {enr.daysRemaining > 0 ? `${enr.daysRemaining} days remaining` : 'Expiring today'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Calculated upon approval (3 calendar mos)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(enr.status)}
                        {enr.status === 'rejected' && enr.rejectionReason && (
                          <p className="text-xs text-rose-600 mt-1 max-w-xs italic">
                            "{enr.rejectionReason}"
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(enr)}
                              disabled={isProcessing || paidButUnverified}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                              title={paidButUnverified
                                ? 'This is a paid course without a verified payment yet'
                                : 'Approve student and grant 3-month access'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingEnrollment(enr);
                                setRejectionReason('');
                              }}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition"
                              title="Reject enrollment"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : enr.status === 'rejected' ? (
                          <button
                            onClick={() => handleApprove(enr)}
                            disabled={isProcessing}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                          >
                            Re-approve
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No action needed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingEnrollment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Reject Enrollment
              </h3>
              <button
                onClick={() => setRejectingEnrollment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              You are rejecting enrollment for <strong className="text-slate-900">{studentOf(rejectingEnrollment).name}</strong> in{' '}
              <strong className="text-slate-900">{rejectingEnrollment.course?.title}</strong>. Please provide a reason for the student.
            </p>

            <form onSubmit={submitReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Payment verification mismatch, incomplete profile details, or duplicate enrollment..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingEnrollment(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingEnrollment._id}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsManagementPage;

