import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';
import { StatusBadge, Modal, btn } from '../components/ui';

const FAQ_CATEGORIES = [
  'Fees & Pricing',
  'Payment Plans',
  'Course Prerequisites',
  'Course Access & Recordings',
  'Certificates',
  'Enrollment & Support'
];

const emptyFaqForm = () => ({
  category: 'Fees & Pricing',
  question: '',
  answer: '',
  displayOrder: 1,
  status: 'active'
});

const FaqManagementPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('order-asc');

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyFaqForm());
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Accordion preview state in admin
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  const { notify } = useFeedback();

  useEffect(() => {
    fetchFaqs();
  }, [categoryFilter, statusFilter, sortOption]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (sortOption) params.append('sort', sortOption);

      const res = await api.get(`/faqs/admin?${params.toString()}`);
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      notify({ type: 'error', message: 'Failed to load FAQs' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFaqs();
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyFaqForm());
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category || 'Fees & Pricing',
      question: item.question || '',
      answer: item.answer || '',
      displayOrder: item.displayOrder ?? 1,
      status: item.status || 'active'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      notify({ type: 'error', message: 'Please provide both question and answer' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: formData.category,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        displayOrder: Number(formData.displayOrder) || 0,
        status: formData.status
      };

      if (editingItem) {
        await api.put(`/faqs/${editingItem._id}`, payload);
        notify({ type: 'success', message: 'FAQ updated successfully' });
      } else {
        await api.post('/faqs', payload);
        notify({ type: 'success', message: 'FAQ created successfully' });
      }

      setModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error('Save FAQ error:', err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save FAQ'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/faqs/${item._id}`, { status: newStatus });
      notify({
        type: 'success',
        message: `FAQ ${newStatus === 'active' ? 'published' : 'unpublished'}`
      });
      fetchFaqs();
    } catch (err) {
      console.error('Toggle status error:', err);
      notify({ type: 'error', message: 'Failed to update FAQ status' });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/faqs/${itemToDelete._id}`);
      notify({ type: 'success', message: 'FAQ deleted successfully' });
      setItemToDelete(null);
      fetchFaqs();
    } catch (err) {
      console.error('Delete FAQ error:', err);
      notify({ type: 'error', message: 'Failed to delete FAQ' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand" />
            FAQ Management
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Create, categorize and organize questions displayed on the public FAQ page.
          </p>
        </div>
        <button type="button" onClick={handleOpenCreateModal} className={btn('primary')}>
          <Plus className="w-4 h-4" />
          Add New FAQ
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-3.5 rounded-lg border border-line shadow-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or answers…"
            className="admin-input pl-9"
            aria-label="Search FAQs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-input w-auto h-9 text-xs cursor-pointer"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {FAQ_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-input w-auto h-9 text-xs cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active (Published)</option>
            <option value="inactive">Inactive (Draft)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-faint" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="admin-input w-auto h-9 text-xs cursor-pointer"
              aria-label="Sort FAQs"
            >
              <option value="order-asc">Category & Order</option>
              <option value="order-desc">Order (High to Low)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* FAQ accordion list */}
      <div className="bg-surface rounded-lg border border-line shadow-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-line flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-ink-soft">
            Total FAQs: <span className="text-navy font-bold">{faqs.length}</span>
          </div>
          <span className="text-[11px] text-ink-faint">Active items appear automatically on the public /faq page</span>
        </div>

        {loading ? (
          <div className="divide-y divide-line-soft" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-4 space-y-2">
                <span className="block admin-skeleton h-3 w-28" />
                <span className="block admin-skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <div className="py-12 text-center px-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink-faint border border-line">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h3 className="mt-3 font-semibold text-ink text-sm">No FAQs found</h3>
            <p className="mt-1 text-xs text-ink-soft max-w-sm mx-auto">
              {search || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Click “Add New FAQ” to create your first question and answer.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line-soft">
            {faqs.map((item) => {
              const isExpanded = expandedFaqId === item._id;
              return (
                <div key={item._id} className="px-4 py-3.5 hover:bg-canvas/60 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-[#2258c9] ring-1 ring-inset ring-brand/15">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-medium text-ink-faint">
                          Order: #{item.displayOrder ?? 0}
                        </span>
                        <StatusBadge
                          value={item.status === 'active' ? 'published' : 'draft'}
                          label={item.status === 'active' ? 'Published' : 'Unpublished'}
                          tone={item.status === 'active' ? 'success' : 'neutral'}
                        />
                      </div>

                      <h3
                        onClick={() => setExpandedFaqId(isExpanded ? null : item._id)}
                        className="font-semibold text-ink text-[13px] sm:text-sm cursor-pointer hover:text-brand transition flex items-center gap-2"
                      >
                        <span>{item.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-ink-faint shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-ink-faint shrink-0" />
                        )}
                      </h3>

                      {isExpanded ? (
                        <p className="mt-2 text-[13px] text-ink-soft leading-relaxed bg-canvas p-3 rounded-md border border-line-soft">
                          {item.answer}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-ink-soft line-clamp-1">{item.answer}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className="p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-canvas border border-transparent hover:border-line transition"
                        title={item.status === 'active' ? 'Unpublish FAQ' : 'Publish FAQ'}
                      >
                        {item.status === 'active' ? (
                          <Eye className="w-4 h-4 text-success" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-md text-ink-faint hover:text-brand hover:bg-brand-soft border border-transparent hover:border-brand/20 transition"
                        title="Edit FAQ"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger-soft border border-transparent hover:border-danger/20 transition"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit FAQ Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit FAQ' : 'Add New FAQ'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label" htmlFor="faq-category">FAQ Category <span className="text-danger">*</span></label>
            <select
              id="faq-category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="admin-input cursor-pointer"
            >
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label" htmlFor="faq-question">Question <span className="text-danger">*</span></label>
            <input
              id="faq-question"
              type="text"
              required
              maxLength={300}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="e.g. What is the fee for each course?"
              className="admin-input"
            />
          </div>

          <div>
            <label className="admin-label" htmlFor="faq-answer">Answer <span className="text-danger">*</span></label>
            <textarea
              id="faq-answer"
              required
              rows={4}
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Enter a clear, accurate, and comprehensive answer…"
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label" htmlFor="faq-order">Display Order</label>
              <input
                id="faq-order"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                className="admin-input"
              />
              <p className="text-[11px] text-ink-faint mt-1">Lower numbers display first</p>
            </div>

            <div>
              <label className="admin-label" htmlFor="faq-status">Publish Status</label>
              <select
                id="faq-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="admin-input cursor-pointer"
              >
                <option value="active">Active (Published)</option>
                <option value="inactive">Inactive (Unpublished)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className={btn('secondary')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={btn('primary')}
            >
              {submitting ? 'Saving…' : editingItem ? 'Update FAQ' : 'Create FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Delete FAQ"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              disabled={deleting}
              className={btn('secondary')}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={btn('danger')}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-ink-soft leading-relaxed">
          Are you sure you want to permanently delete this FAQ:
          <span className="font-semibold text-ink"> “{itemToDelete?.question}”</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default FaqManagementPage;
