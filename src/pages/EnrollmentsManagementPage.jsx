import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  Phone,
  Mail,
  Check,
  X,
  Trash2,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import { useAdminNotifications } from '../context/AdminNotificationsContext';
import { courseTypeLabel, formatCoursePrice, isFreeCourse, paymentSummary } from '../utils/courseAccess';
import {
  DataTable,
  SearchBar,
  StatusBadge,
  Modal,
  ActionMenu,
  btn
} from '../components/ui';

const studentOf = (enr) => enr?.student || enr?.user || {};

// Requests tied to a gateway-verified payment, or enrollments that already
// received course access, must not be deleted (payment/progress history).
const hasVerifiedPayment = (enr) =>
  Boolean(enr?.payment) && ['completed', 'refunded', 'partially_refunded'].includes(enr.payment.status);
const canDeleteEnrollment = (enr) =>
  ['pending_approval', 'rejected'].includes(enr?.status) && !hasVerifiedPayment(enr);

const STATUS_FILTERS = [
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'approved', label: 'Approved (Active)' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
  { id: 'all', label: 'All' }
];

const EnrollmentsManagementPage = () => {
  const { notify, confirm } = useFeedback();
  const { markEnrollmentsRead, refresh: refreshNotificationCounts } = useAdminNotifications();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  // Rejection modal state
  const [rejectingEnrollment, setRejectingEnrollment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/enrollments/admin/list?status=${filter}&limit=100`);
      if (res.data.success) {
        setEnrollments(res.data.enrollments || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not fetch enrollments list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [filter]);

  // Opening the approvals page counts as reviewing all current pending requests,
  // so clear the sidebar unread badge. This never approves/rejects anyone.
  useEffect(() => {
    markEnrollmentsRead();
  }, [markEnrollmentsRead]);

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

  const handleDelete = async (enrollment) => {
    const student = studentOf(enrollment);
    const ok = await confirm({
      title: 'Delete Enrollment Request?',
      message: `Are you sure you want to delete this enrollment request for ${student.name || 'this student'} (${enrollment.course?.title || 'this course'})? The student's account will NOT be deleted, and any payment records are preserved. This action cannot be undone.`
    });

    if (!ok) return;

    try {
      setProcessingId(enrollment._id);
      const res = await api.delete(`/enrollments/admin/${enrollment._id}`);
      if (res.data.success) {
        notify({
          type: 'success',
          title: 'Enrollment Deleted',
          message: res.data.message || 'Enrollment request deleted. Student account preserved.'
        });
        await fetchEnrollments();
        // Keep the sidebar unread badge in sync (deleted pending requests
        // must not keep counting as unread notifications).
        refreshNotificationCounts();
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Could not delete the enrollment request.'
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

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (enr) => {
        const student = studentOf(enr);
        return (
          <div className="min-w-0">
            <div className="font-semibold text-ink">{student.name || 'Unknown User'}</div>
            <div className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 text-ink-faint shrink-0" />
              <span className="truncate">{student.email || 'No email'}</span>
            </div>
            <div className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-ink-faint shrink-0" />
              {student.phone || <span className="text-warning italic">No phone entered</span>}
            </div>
          </div>
        );
      }
    },
    {
      key: 'course',
      header: 'Course',
      className: 'max-w-[240px]',
      render: (enr) => (
        <div className="min-w-0">
          <div className="font-medium text-ink truncate">{enr.course?.title || 'Unknown Course'}</div>
          <div className="text-xs text-ink-soft mt-0.5">
            Enrolled on {new Date(enr.createdAt).toLocaleDateString('en-IN')}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (enr) => {
        const free = isFreeCourse(enr.course);
        return (
          <div>
            <StatusBadge value={free ? 'trial' : 'paid'} label={courseTypeLabel(enr.course)} tone={free ? 'success' : 'info'} />
            <div className="text-[11px] text-ink-soft mt-1">{free ? 'Price on record: ₹0' : formatCoursePrice(enr.course)}</div>
          </div>
        );
      }
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (enr) => {
        const payment = paymentSummary(enr);
        return (
          <div>
            <StatusBadge value={payment.label} tone={payment.tone} />
            {enr.payment ? (
              <div className="text-[11px] text-ink-faint mt-1 space-y-0.5">
                <div className="truncate max-w-[180px]" title={enr.payment.orderId || ''}>Order: {enr.payment.orderId || '—'}</div>
                <div className="truncate max-w-[180px]" title={enr.payment.paymentId || ''}>Payment: {enr.payment.paymentId || 'not captured yet'}</div>
              </div>
            ) : (
              <div className="text-[11px] text-ink-faint mt-1 italic">
                {isFreeCourse(enr.course) ? 'No order for free enrollments' : 'Awaiting gateway payment'}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'access',
      header: 'Access Period',
      render: (enr) =>
        enr.accessStartDate && enr.accessExpiryDate ? (
          <div className="text-xs space-y-0.5">
            <div className="text-ink-soft">
              <span className="font-semibold text-ink">Start:</span> {new Date(enr.accessStartDate).toLocaleDateString('en-IN')}
            </div>
            <div className="text-ink-soft">
              <span className="font-semibold text-ink">Expires:</span> {new Date(enr.accessExpiryDate).toLocaleDateString('en-IN')}
            </div>
            {enr.status === 'approved' && (
              <div className="text-success font-semibold text-[11px]">
                {enr.daysRemaining > 0 ? `${enr.daysRemaining} days remaining` : 'Expiring today'}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-ink-faint italic">3 months, from approval date</span>
        )
    },
    {
      key: 'status',
      header: 'Status',
      render: (enr) => (
        <div>
          <StatusBadge
            value={enr.status}
            label={enr.status === 'pending_approval' ? 'Pending' : enr.status === 'approved' ? 'Approved · Active' : undefined}
            tone={enr.status === 'approved' ? 'success' : undefined}
          />
          {enr.status === 'rejected' && enr.rejectionReason && (
            <p className="text-xs text-danger mt-1 max-w-[220px] italic line-clamp-2" title={enr.rejectionReason}>
              “{enr.rejectionReason}”
            </p>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[120px] text-center shrink-0',
      render: (enr) => {
        const isPending = enr.status === 'pending_approval';
        const isProcessing = processingId === enr._id;
        const paidButUnverified = !isFreeCourse(enr.course) && enr.payment?.status !== 'completed';

        // For pending enrollments: display direct compact Green Checkmark & Red Cross buttons
        if (isPending) {
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleApprove(enr)}
                disabled={isProcessing || paidButUnverified}
                title={paidButUnverified ? 'Cannot approve: Gateway payment not verified' : 'Approve & Grant Access'}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 text-emerald-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectingEnrollment(enr);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
                title="Reject Enrollment"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-300 text-rose-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          );
        }

        // For other status tabs (Approved / Rejected / Expired): provide secondary action buttons without overflowing
        if (enr.status === 'rejected' || enr.status === 'expired') {
          return (
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApprove(enr)}
                disabled={isProcessing}
                title="Re-approve & grant access"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {canDeleteEnrollment(enr) && (
                <button
                  type="button"
                  onClick={() => handleDelete(enr)}
                  disabled={isProcessing}
                  title="Delete Request"
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        }

        return (
          <span className="text-xs text-ink-faint italic select-none">
            {enr.status === 'approved' ? 'Active' : '—'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Page intro */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand" />
            Approvals &amp; Access
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Review free and paid enrollments, verify gateway payments, approve 3-calendar-month access, or reject applications.
          </p>
        </div>
        {filter === 'pending_approval' && !loading && filteredEnrollments.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft border border-warning/20 px-3 py-1 text-xs font-semibold text-[#92400e]">
            <Clock className="h-3.5 w-3.5" /> {filteredEnrollments.length} pending request{filteredEnrollments.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        rows={filteredEnrollments}
        loading={loading}
        error={error}
        onRetry={fetchEnrollments}
        minWidthClass="min-w-[980px]"
        empty={{
          title: 'No enrollments found',
          message: `No records match the current filter “${STATUS_FILTERS.find((t) => t.id === filter)?.label || filter}”.`
        }}
        toolbar={
          <>
            {/* Status filter segmented control */}
            <div className="flex flex-wrap items-center gap-1 rounded-md bg-canvas border border-line p-0.5">
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    filter === tab.id
                      ? 'bg-surface text-navy shadow-sm border border-line'
                      : 'text-ink-soft hover:text-ink border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search student, email or course…"
              className="ml-auto w-full max-w-xs"
            />
          </>
        }
      />

      {/* Reject Modal */}
      <Modal
        open={Boolean(rejectingEnrollment)}
        onClose={() => setRejectingEnrollment(null)}
        title="Reject Enrollment"
        description={
          rejectingEnrollment
            ? `${studentOf(rejectingEnrollment).name} · ${rejectingEnrollment.course?.title || 'Course'}`
            : undefined
        }
      >
        <form onSubmit={submitReject} className="space-y-4">
          <div>
            <label className="admin-label" htmlFor="rejection-reason">Rejection Reason</label>
            <textarea
              id="rejection-reason"
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Payment verification mismatch, incomplete profile details, or duplicate enrollment…"
              className="admin-input"
            />
            <p className="mt-1.5 text-xs text-ink-faint">The student sees this reason in their dashboard and notifications.</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setRejectingEnrollment(null)} className={btn('secondary')}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingId === rejectingEnrollment?._id}
              className={btn('danger')}
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnrollmentsManagementPage;
