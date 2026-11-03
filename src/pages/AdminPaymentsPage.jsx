import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, RotateCcw } from 'lucide-react';
import { DataTable, SearchBar, FilterDropdown, StatusBadge, Modal, ActionMenu, btn } from '../components/ui';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refundModal, setRefundModal] = useState({ open: false, payment: null });
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundModal.payment) return;
    setSubmitting(true);
    try {
      await api.post(`/payments/${refundModal.payment._id}/refund`, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason
      });
      setNotification({ type: 'success', message: 'Refund initiated successfully.' });
      setRefundModal({ open: false, payment: null });
      fetchPayments();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Refund processing failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const visiblePayments = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [p.student?.name, p.student?.email, p.course?.title, p.orderId, p.paymentId]
      .some((f) => String(f || '').toLowerCase().includes(term));
  });

  const totalCollected = payments
    .filter((p) => p.status === 'completed' || p.status === 'partially_refunded')
    .reduce((sum, p) => sum + (p.amount || 0) - (p.refundAmount || 0), 0);

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{p.student?.name || 'Unknown'}</p>
          <p className="text-xs text-ink-soft truncate">{p.student?.email || '—'}</p>
        </div>
      )
    },
    {
      key: 'course',
      header: 'Course',
      className: 'max-w-[220px]',
      render: (p) => <span className="text-ink font-medium truncate block">{p.course?.title || 'Unknown Course'}</span>
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'w-[130px]',
      render: (p) => (
        <div>
          <p className="font-semibold text-ink tabular-nums whitespace-nowrap">{formatMoney(p.amount)}</p>
          {p.refundAmount > 0 && (
            <p className="text-[10px] text-danger font-medium">Refunded: {formatMoney(p.refundAmount)}</p>
          )}
        </div>
      )
    },
    {
      key: 'ids',
      header: 'Order / Payment ID',
      render: (p) => (
        <div className="font-mono text-[11px] text-ink-soft space-y-0.5">
          <div className="truncate max-w-[180px]" title={p.orderId || ''}>Ord: {p.orderId || '—'}</div>
          {p.paymentId && <div className="truncate max-w-[180px] text-ink-faint" title={p.paymentId}>Pay: {p.paymentId}</div>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[130px]',
      render: (p) => <StatusBadge value={p.status} />
    },
    {
      key: 'date',
      header: 'Date',
      className: 'w-[120px]',
      render: (p) => <span className="text-ink-soft whitespace-nowrap text-xs">{new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[52px]',
      render: (p) =>
        p.status === 'completed' ? (
          <ActionMenu
            items={[
              {
                label: 'Process refund…',
                icon: RotateCcw,
                tone: 'danger',
                onClick: () => {
                  setRefundModal({ open: true, payment: p });
                  setRefundAmount(p.amount - (p.refundAmount || 0));
                  setRefundReason('');
                }
              }
            ]}
            label="Payment actions"
          />
        ) : null
    }
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand" />
            Payments &amp; Refunds
          </h1>
          <p className="text-xs text-ink-soft mt-1">Student transaction logs, gateway order status, and authorized refunds</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-soft shadow-card">
          Net collected <span className="font-bold text-navy tabular-nums">{formatMoney(totalCollected)}</span>
        </span>
      </div>

      {notification && (
        <div className={`px-4 py-2.5 rounded-md text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'error' ? 'bg-danger-soft text-danger border-danger/20' : 'bg-success-soft text-[#15803d] border-success/20'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline ml-4 cursor-pointer">Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={visiblePayments}
        loading={loading}
        error={error}
        onRetry={fetchPayments}
        minWidthClass="min-w-[980px]"
        empty={{
          title: 'No payment transactions found',
          message: search || statusFilter ? 'Try adjusting the search or status filter.' : undefined
        }}
        toolbar={
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search student, course, order ID…" className="w-full max-w-xs" />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              label="Payment status"
              className="w-40 ml-auto"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'initiated', label: 'Initiated' },
                { value: 'partially_refunded', label: 'Partially Refunded' },
                { value: 'refunded', label: 'Refunded' },
                { value: 'failed', label: 'Failed' }
              ]}
            />
          </>
        }
      />

      {/* Refund modal */}
      <Modal
        open={refundModal.open && Boolean(refundModal.payment)}
        onClose={() => setRefundModal({ open: false, payment: null })}
        title="Process Refund"
        description={refundModal.payment ? `${refundModal.payment.course?.title || 'Course'} · ${refundModal.payment.student?.name || 'Student'}` : undefined}
      >
        <form onSubmit={handleRefund} className="space-y-4 text-[13px]">
          <div>
            <label className="admin-label" htmlFor="refund-amount">Refund Amount (₹)</label>
            <input
              id="refund-amount"
              type="number"
              required
              max={refundModal.payment ? refundModal.payment.amount - (refundModal.payment.refundAmount || 0) : undefined}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="admin-input"
            />
            {refundModal.payment ? (
              <p className="mt-1 text-xs text-ink-faint">
                Maximum refundable: {formatMoney(refundModal.payment.amount - (refundModal.payment.refundAmount || 0))}
              </p>
            ) : null}
          </div>
          <div>
            <label className="admin-label" htmlFor="refund-reason">Reason for Refund</label>
            <textarea
              id="refund-reason"
              rows={3}
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Student requested cancellation within guarantee period"
              className="admin-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRefundModal({ open: false, payment: null })}
              className={btn('secondary')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={btn('danger')}
            >
              {submitting ? 'Processing…' : 'Confirm Refund'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPaymentsPage;
