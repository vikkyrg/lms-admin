import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Search,
  Filter,
  ArrowUpDown,
  Upload,
  X,
  CheckCircle,
  Eye,
  MessageSquareQuote
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const emptyForm = () => ({
  studentName: '',
  designation: '',
  courseName: '',
  batch: '',
  completionDate: '',
  review: '',
  rating: 5,
  image: '',
  status: 'active',
  displayOrder: 0
});

const TestimonialsManagementPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('order-asc');

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { notify } = useFeedback();

  useEffect(() => {
    fetchTestimonials();
  }, [statusFilter, sortOption]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (sortOption) params.append('sort', sortOption);

      const res = await api.get(`/testimonials/admin?${params.toString()}`);
      setTestimonials(res.data.testimonials || []);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
      notify({ type: 'error', message: 'Failed to load testimonials' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTestimonials();
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyForm());
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      studentName: item.studentName || '',
      designation: item.designation || '',
      courseName: item.courseName || '',
      batch: item.batch || '',
      completionDate: item.completionDate || '',
      review: item.review || '',
      rating: item.rating || 5,
      image: item.image || '',
      status: item.status || 'active',
      displayOrder: item.displayOrder ?? 0
    });
    setImageFile(null);
    setImagePreview(item.image || '');
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      notify({ type: 'error', message: 'Only JPG, JPEG, PNG, and WebP images are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify({ type: 'error', message: 'Image size cannot exceed 5MB' });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentName.trim() || !formData.review.trim()) {
      notify({ type: 'error', message: 'Please provide student name and review' });
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('studentName', formData.studentName.trim());
      data.append('designation', formData.designation.trim());
      data.append('courseName', formData.courseName.trim());
      data.append('batch', formData.batch.trim());
      data.append('completionDate', formData.completionDate.trim());
      data.append('review', formData.review.trim());
      data.append('rating', formData.rating);
      data.append('status', formData.status);
      data.append('displayOrder', formData.displayOrder);

      if (imageFile) {
        data.append('imageFile', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingItem) {
        await api.put(`/testimonials/${editingItem._id}`, data);
        notify({ type: 'success', message: 'Testimonial updated successfully' });
      } else {
        await api.post('/testimonials', data);
        notify({ type: 'success', message: 'Testimonial created successfully' });
      }

      setModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Save testimonial error:', err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save testimonial'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/testimonials/${item._id}`, { status: newStatus });
      notify({
        type: 'success',
        message: `Testimonial set to ${newStatus}`
      });
      setTestimonials((prev) =>
        prev.map((t) => (t._id === item._id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Toggle status error:', err);
      notify({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/testimonials/${itemToDelete._id}`);
      notify({ type: 'success', message: 'Testimonial deleted successfully' });
      setItemToDelete(null);
      fetchTestimonials();
    } catch (err) {
      console.error('Delete error:', err);
      notify({ type: 'error', message: 'Failed to delete testimonial' });
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-ink flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-brand" />
            <span>Student Testimonials</span>
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Manage reviews displayed in the homepage Student Testimonials section
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-deep text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-surface rounded-lg border border-line p-3.5 shadow-card flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search by student, role, or review..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input pl-9"
          />
        </form>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-canvas border border-line rounded-md px-2.5 py-1.5 text-xs text-ink">
            <Filter className="h-3.5 w-3.5 text-ink-soft" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-canvas border border-line rounded-md px-2.5 py-1.5 text-xs text-ink">
            <ArrowUpDown className="h-3.5 w-3.5 text-ink-soft" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="order-asc">Order: Ascending</option>
              <option value="order-desc">Order: Descending</option>
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Testimonials Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-ink-soft">
            <thead className="bg-canvas text-ink-soft font-semibold uppercase border-b border-line-soft">
              <tr>
                <th className="p-4 w-16 text-center">Order</th>
                <th className="p-4">Student</th>
                <th className="p-4">Designation</th>
                <th className="p-4 max-w-xs">Review</th>
                <th className="p-4 text-center">Rating</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-ink-faint">
                    <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-ink-faint">
                    No testimonials found. Click "Add Testimonial" to create one.
                  </td>
                </tr>
              ) : (
                testimonials.map((item) => (
                  <tr key={item._id} className="hover:bg-canvas transition">
                    {/* Order */}
                    <td className="p-4 text-center font-bold text-ink">
                      <span className="w-7 h-7 rounded-lg bg-canvas border border-line inline-flex items-center justify-center text-xs">
                        {item.displayOrder}
                      </span>
                    </td>

                    {/* Student Name & Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.studentName}
                            className="w-10 h-10 rounded-full object-cover border border-line shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-10 h-10 rounded-full bg-navy text-white border border-line font-bold flex items-center justify-center text-xs shrink-0 ${
                            item.image ? 'hidden' : 'flex'
                          }`}
                        >
                          {getInitials(item.studentName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink leading-snug truncate">
                            {item.studentName}
                          </p>
                          <p className="text-[11px] text-ink-faint truncate">
                            Added {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="p-4 font-semibold text-ink">
                      {item.designation}
                    </td>

                    {/* Review Preview */}
                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-2 text-ink-soft" title={item.review}>
                        "{item.review}"
                      </p>
                    </td>

                    {/* Rating */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-warning-soft border border-warning/20 px-2 py-1 rounded-md text-[#b45309] font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-[#F8D568] text-[#d97706]" />
                        <span>{item.rating}</span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          item.status === 'active'
                            ? 'bg-success-soft text-[#15803d] border border-success/20 hover:bg-[#dcfce7]'
                            : 'bg-canvas text-ink-soft border border-line hover:bg-line-soft'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-success' : 'bg-ink-faint'
                          }`}
                        />
                        <span>{item.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-ink-soft hover:text-brand hover:bg-brand-soft rounded-md transition"
                          title="Edit Testimonial"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-ink-soft hover:text-danger hover:bg-danger-soft rounded-md transition"
                          title="Delete Testimonial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Testimonial Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-overlay border border-line max-h-[90vh] overflow-y-auto admin-modal-in">
            <div className="flex justify-between items-center pb-4 border-b border-line-soft">
              <h3 className="font-bold text-ink text-base sm:text-lg">
                {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-ink-faint hover:text-ink-soft rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                  Student Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="admin-input"
                />
              </div>

              {/* Student Designation & Course Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. DevOps Engineer / Student"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="e.g. DevOps & Cloud Engineering Masterclass"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Batch & Completion Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Batch Information (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g. Batch 2026-Q1"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Completion Date (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.completionDate}
                    onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                    placeholder="e.g. October 2026"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Student Review */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider">
                    Student Review <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] text-ink-faint font-medium">
                    {formData.review.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={formData.review}
                  onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                  placeholder="Enter the student's authentic learning experience..."
                  className="admin-input"
                />
              </div>

              {/* Rating & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Rating <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="admin-input cursor-pointer"
                  >
                    <option value={5}>5 Stars (★★★★★)</option>
                    <option value={4}>4 Stars (★★★★☆)</option>
                    <option value={3}>3 Stars (★★★☆☆)</option>
                    <option value={2}>2 Stars (★★☆☆☆)</option>
                    <option value={1}>1 Star (★☆☆☆☆)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                  Visibility Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                      className="text-brand focus:outline-none"
                    />
                    <span>Active (Visible on Homepage)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={() => setFormData({ ...formData, status: 'inactive' })}
                      className="text-brand focus:outline-none"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Student Image Upload */}
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">
                  Student Photo / Avatar (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({ ...formData, image: '' });
                        }}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-canvas border border-dashed border-line flex items-center justify-center text-ink-faint shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}

                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 border border-line rounded-md text-xs font-semibold text-ink hover:bg-canvas transition">
                    <Upload className="w-3.5 h-3.5 text-ink-soft" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-ink-faint mt-1">
                  If left empty, student initials will be displayed automatically.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-soft">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-navy hover:bg-navy-deep text-white rounded-md text-xs font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full p-5 shadow-overlay border border-line space-y-4 admin-modal-in">
            <h3 className="font-bold text-ink text-base">Delete Testimonial?</h3>
            <p className="text-xs text-ink-soft">
              Are you sure you want to delete the testimonial for{' '}
              <strong className="text-ink">{itemToDelete.studentName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-3.5 py-2 bg-danger hover:bg-[#b91c1c] text-white rounded-md text-xs font-semibold transition shadow-sm disabled:opacity-50"
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

export default TestimonialsManagementPage;

