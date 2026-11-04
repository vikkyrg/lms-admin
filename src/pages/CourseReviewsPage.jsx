import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Star,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  BookOpen,
  Calendar,
  Sparkles,
  AlertCircle,
  User,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useAdminNotifications } from '../context/AdminNotificationsContext';

const emptyReview = {
  courseId: '',
  studentName: '',
  studentEmail: '',
  rating: 5,
  title: '',
  content: '',
  reviewDate: new Date().toISOString().split('T')[0],
  status: 'published'
};

const CourseReviewsPage = () => {
  const { markReviewsRead } = useAdminNotifications();
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyReview);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchInitialData();
    // Mark reviews notification badge as read when opening this page
    if (markReviewsRead) {
      markReviewsRead();
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, reviewsRes] = await Promise.all([
        api.get('/courses/admin/list').catch(() => ({ data: { courses: [] } })),
        api.get('/reviews/admin')
      ]);

      setCourses(coursesRes.data?.courses || []);
      setReviews(reviewsRes.data?.reviews || []);
    } catch (err) {
      console.error('Error fetching course reviews:', err);
      showFeedback('error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      const courseIdVal = item.courseId?._id || item.courseId;
      if (selectedCourse !== 'all' && courseIdVal !== selectedCourse) {
        return false;
      }

      if (selectedStatus !== 'all') {
        const curStatus = item.status === 'active' ? 'published' : item.status === 'inactive' ? 'draft' : item.status;
        if (curStatus !== selectedStatus) return false;
      }

      if (selectedRating !== 'all' && item.rating !== Number(selectedRating)) {
        return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const name = (item.reviewerName || item.studentName || '').toLowerCase();
        const email = (item.studentEmail || '').toLowerCase();
        const title = (item.headline || item.title || '').toLowerCase();
        const content = (item.content || item.comment || '').toLowerCase();
        const courseTitle = (item.courseId?.title || '').toLowerCase();
        return (
          name.includes(query) ||
          email.includes(query) ||
          title.includes(query) ||
          content.includes(query) ||
          courseTitle.includes(query)
        );
      }

      return true;
    });
  }, [reviews, selectedCourse, selectedStatus, selectedRating, search]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      ...emptyReview,
      courseId: courses[0]?._id || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setFormData({
      id: item._id,
      courseId: item.courseId?._id || item.courseId || '',
      studentName: item.reviewerName || item.studentName || '',
      studentEmail: item.studentEmail || '',
      rating: item.rating || 5,
      title: item.headline || item.title || '',
      content: item.content || item.comment || '',
      reviewDate: item.reviewDate
        ? new Date(item.reviewDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status: item.status || 'published'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.courseId) {
      setFormError('Please select a course');
      return;
    }
    if (!formData.studentName.trim()) {
      setFormError('Please enter student name');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Please enter review description');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        courseId: formData.courseId,
        studentName: formData.studentName.trim(),
        reviewerName: formData.studentName.trim(),
        studentEmail: formData.studentEmail?.trim() || '',
        rating: Number(formData.rating) || 5,
        headline: formData.title.trim() || formData.studentName.trim(),
        title: formData.title.trim() || formData.studentName.trim(),
        content: formData.content.trim(),
        comment: formData.content.trim(),
        reviewDate: formData.reviewDate,
        status: formData.status,
        reviewType: 'text'
      };

      if (isEditing && formData.id) {
        const res = await api.put(`/reviews/${formData.id}`, payload);
        if (res.data?.success) {
          showFeedback('success', 'Review updated successfully');
          setIsModalOpen(false);
          fetchInitialData();
        }
      } else {
        const res = await api.post(`/courses/${formData.courseId}/reviews`, payload);
        if (res.data?.success) {
          showFeedback('success', 'Review created successfully');
          setIsModalOpen(false);
          fetchInitialData();
        }
      }
    } catch (err) {
      console.error('Error saving review:', err);
      setFormError(err.response?.data?.message || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.patch(`/reviews/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        showFeedback('success', `Review marked as ${newStatus}`);
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus, isRead: true } : r))
        );
      }
    } catch (err) {
      console.error('Error changing review status:', err);
      showFeedback('error', 'Failed to update review status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/reviews/${deleteTarget._id}`);
      if (res.data?.success) {
        showFeedback('success', 'Review deleted successfully');
        setReviews((prev) => prev.filter((r) => r._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      showFeedback('error', 'Failed to delete review');
    }
  };

  const renderStars = (count = 5) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= count ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Published</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const publishedCount = reviews.filter((r) => r.status === 'published' || r.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
              <MessageSquare className="w-5 h-5 text-[#2563EB]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#142B50] tracking-tight">
              Course Reviews Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage, approve, edit, and publish dynamic student testimonials for each individual course.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142B50] hover:bg-[#0f213d] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F4D36B]" />
            <span>Add Review Manually</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Reviews</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{reviews.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending Approvals</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Published Active</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{publishedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Rating filter */}
          <div>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Ratings (1–5)</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Loading course reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No reviews found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || selectedCourse !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or course filter.'
                : 'No course reviews have been created or submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFBFD] text-slate-500 uppercase tracking-wider font-extrabold border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Content</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {filteredReviews.map((item) => {
                  const studentName = item.reviewerName || item.studentName || 'Student';
                  const studentEmail = item.studentEmail || item.studentId?.email || '';
                  const courseTitle = item.courseId?.title || 'Unknown Course';
                  const headline = item.headline || item.title || '';
                  const content = item.content || item.comment || '';
                  const dateStr = item.reviewDate
                    ? new Date(item.reviewDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{studentName}</div>
                        {studentEmail && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {studentEmail}
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#142B50] bg-blue-50/60 px-2.5 py-1 rounded-lg border border-blue-100/60 text-[11px]">
                          {courseTitle}
                        </span>
                      </td>

                      {/* Rating */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {renderStars(item.rating)}
                          <span className="font-bold text-slate-700 ml-1">{item.rating}</span>
                        </div>
                      </td>

                      {/* Title & Message */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {headline && (
                          <div className="font-bold text-slate-900 line-clamp-1 mb-0.5">
                            {headline}
                          </div>
                        )}
                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                          {content}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve Checkmark */}
                          {item.status !== 'published' && item.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item._id, 'published')}
                              className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                              title="Approve & Publish Review"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Quick Reject X */}
                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item._id, 'rejected')}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                              title="Reject Review"
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                            title="Edit Review"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition shadow-2xs cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Review Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#FAFBFD]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-[#2563EB]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-black text-[#142B50] text-base">
                  {isEditing ? 'Edit Course Review' : 'Add Course Review'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto min-h-0 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Course select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Course *</label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Student Email (optional)</label>
                  <input
                    type="email"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Rating & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Rating (1–5 Stars) *</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Good)</option>
                    <option value={2}>2 Stars (Fair)</option>
                    <option value={1}>1 Star (Poor)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Review Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['published', 'pending', 'rejected'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                        formData.status === s
                          ? s === 'published'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : s === 'pending'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-gray-200 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Review Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Great practical assignments and clear explanations!"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Review Description / Feedback *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Share feedback on curriculum, mentorship, labs, and skills learned..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#142B50] hover:bg-[#0f213d] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Course Review?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete the review by{' '}
                <strong className="text-slate-800">
                  {deleteTarget.reviewerName || deleteTarget.studentName}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-gray-300 text-slate-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReviewsPage;

