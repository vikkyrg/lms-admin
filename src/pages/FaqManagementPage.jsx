import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            FAQ Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create, categorize, edit, and organize frequently asked questions displayed on the public FAQ page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions or answers..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Categories</option>
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active (Published)</option>
            <option value="inactive">Inactive (Draft)</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="order-asc">Category & Order</option>
              <option value="order-desc">Order (High to Low)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* FAQs List Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="text-xs sm:text-sm font-bold text-gray-700">
            Total FAQs: <span className="text-indigo-600">{faqs.length}</span>
          </div>
          <span className="text-xs text-gray-400">
            Active items automatically appear on the public /faq page
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-700">No FAQs Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {search || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search filters.'
                : 'Click "Add New FAQ" to create your first question and answer.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {faqs.map((item) => {
              const isExpanded = expandedFaqId === item._id;
              return (
                <div key={item._id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">
                          Order: #{item.displayOrder ?? 0}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.status === 'active' ? 'Published' : 'Unpublished'}
                        </span>
                      </div>

                      <h3
                        onClick={() => setExpandedFaqId(isExpanded ? null : item._id)}
                        className="font-bold text-gray-900 text-sm sm:text-base cursor-pointer hover:text-indigo-600 transition flex items-center gap-2"
                      >
                        <span>{item.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </h3>

                      {isExpanded ? (
                        <p className="mt-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          {item.answer}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                          {item.answer}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                          item.status === 'active'
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={item.status === 'active' ? 'Unpublish FAQ' : 'Publish FAQ'}
                      >
                        {item.status === 'active' ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit FAQ"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                {editingItem ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  FAQ Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {FAQ_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Question <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={300}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. What is the fee for each course?"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Answer <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter a clear, accurate, and comprehensive answer..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-0.5">Lower numbers display first</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="active">Active (Published)</option>
                    <option value="inactive">Inactive (Unpublished)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-base">Delete FAQ</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete this FAQ: &quot;{itemToDelete.question}&quot;?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqManagementPage;

