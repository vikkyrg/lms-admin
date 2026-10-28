import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data.payments || []);
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to load payments' });
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
      setNotification({ type: 'success', message: 'Refund initiated successfully!' });
      setRefundModal({ open: false, payment: null });
      fetchPayments();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Refund processing failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Payment & Refund Management</h1>
        <p className="text-xs text-gray-500 mt-1">Review student transaction logs, order status, and process authorized refunds</p>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          notification.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline ml-4">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Order / Payment ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">Loading transactions...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">No payment transactions found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{p.student?.name || 'Unknown'}</p>
                      <p className="text-[11px] text-gray-400">{p.student?.email}</p>
                    </td>
                    <td className="p-4 font-semibold text-gray-800">{p.course?.title || 'Unknown Course'}</td>
                    <td className="p-4 font-bold text-gray-900">
                      ₹{p.amount}
                      {p.refundAmount > 0 && (
                        <span className="block text-[10px] text-red-500 font-normal">
                          Refunded: ₹{p.refundAmount}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      <div>Ord: {p.orderId}</div>
                      {p.paymentId && <div className="text-gray-400">Pay: {p.paymentId}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'refunded' ? 'bg-red-50 text-red-700' :
                        p.status === 'partially_refunded' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {p.status === 'completed' && (
                        <button
                          onClick={() => {
                            setRefundModal({ open: true, payment: p });
                            setRefundAmount(p.amount - (p.refundAmount || 0));
                            setRefundReason('');
                          }}
                          className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="h-3 w-3" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {refundModal.open && refundModal.payment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-gray-900">Process Refund</h3>
            <p className="text-xs text-gray-500">
              Refunding payment for <span className="font-semibold text-gray-800">{refundModal.payment.course?.title}</span>.
            </p>
            <form onSubmit={handleRefund} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  required
                  max={refundModal.payment.amount - (refundModal.payment.refundAmount || 0)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for Refund</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Student requested cancellation within guarantee period"
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRefundModal({ open: false, payment: null })}
                  className="px-4 py-2 border rounded-xl text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;

