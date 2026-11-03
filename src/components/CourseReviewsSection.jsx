import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Play,
  Upload,
  X,
  Check,
  Video,
  FileText,
  Eye,
  Calendar,
  Sparkles,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import VideoPlayerModal from '../components/VideoPlayerModal';
import { resolveMediaUrl } from '../utils/videoUtils';

const emptyReviewForm = (courseId = '') => ({
  courseId: courseId || '',
  reviewerName: '',
  reviewerDesignation: '',
  reviewerAvatar: '',
  reviewType: 'text',
  headline: '',
  content: '',
  rating: 5,
  reviewDate: new Date().toISOString().split('T')[0],
  videoSourceType: 'external',
  videoUrl: '',
  videoThumbnail: '',
  duration: 0,
  status: 'published',
  displayOrder: 0
});

const CourseReviewsSection = ({
  courseId,
  courseTitle = 'Course',
  notify,
  courses = []
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyReviewForm(courseId));
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [previewReview, setPreviewReview] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchReviews();
    }
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/admin?courseId=${courseId}`);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      notify?.({ type: 'error', message: 'Failed to load course reviews' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingReview(null);
    setFormData(emptyReviewForm(courseId));
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setAvatarFile(null);
    setAvatarPreview('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingReview(item);
    const existingCourseId = item.courseId?._id || item.courseId || courseId;
    setFormData({
      courseId: existingCourseId,
      reviewerName: item.reviewerName || item.studentName || '',
      reviewerDesignation: item.reviewerDesignation || item.designation || '',
      reviewerAvatar: item.reviewerAvatar || item.studentAvatar || '',
      reviewType: item.reviewType || 'text',
      headline: item.headline || item.title || '',
      content: item.content || item.comment || '',
      rating: item.rating || 5,
      reviewDate: item.reviewDate
        ? new Date(item.reviewDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      videoSourceType: item.videoSourceType || 'external',
      videoUrl: item.videoUrl || '',
      videoThumbnail: item.videoThumbnail || item.thumbnailUrl || '',
      duration: item.duration || 0,
      status: item.status === 'active' ? 'published' : item.status === 'inactive' ? 'draft' : item.status || 'published',
      displayOrder: item.displayOrder ?? 0
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(item.videoThumbnail || item.thumbnailUrl ? resolveMediaUrl(item.videoThumbnail || item.thumbnailUrl) : '');
    setAvatarFile(null);
    setAvatarPreview(item.reviewerAvatar || item.studentAvatar ? resolveMediaUrl(item.reviewerAvatar || item.studentAvatar) : '');
    setModalOpen(true);
  };

  const handleToggleStatus = async (review) => {
    const isCurrentlyPublished = review.status === 'published' || review.status === 'active';
    const newStatus = isCurrentlyPublished ? 'draft' : 'published';
    try {
      await api.put(`/reviews/${review._id}`, { status: newStatus }, {
        headers: { 'Content-Type': 'application/json' }
      });
      notify?.({
        type: 'success',
        message: `Review marked as ${newStatus}`
      });
      await fetchReviews();
    } catch (err) {
      notify?.({ type: 'error', message: 'Failed to update review status' });
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await api.delete(`/reviews/${reviewToDelete._id}`);
      notify?.({ type: 'success', message: 'Review deleted successfully from MongoDB' });
      setReviewToDelete(null);
      await fetchReviews();
    } catch (err) {
      notify?.({ type: 'error', message: 'Failed to delete review' });
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    if (!formData.reviewerName.trim() || !formData.content.trim()) {
      notify?.({
        type: 'error',
        message: 'Please provide reviewer name and review content'
      });
      return;
    }

    if (
      formData.reviewType === 'video' &&
      formData.videoSourceType === 'upload' &&
      !videoFile &&
      !editingReview?.videoFileId
    ) {
      notify?.({ type: 'error', message: 'Please select a video file (MP4/WebM) to upload' });
      return;
    }

    setSubmitting(true);
    try {
      const activeCourseId = courseId || formData.courseId;
      if (!activeCourseId) {
        notify?.({ type: 'error', message: 'Course ID is missing for this review.' });
        setSubmitting(false);
        return;
      }

      const hasBinaryFiles = Boolean(videoFile || thumbnailFile || avatarFile);

      if (!hasBinaryFiles) {
        // Direct JSON payload for text reviews or external URL reviews
        const jsonPayload = {
          courseId: activeCourseId,
          reviewerName: formData.reviewerName.trim(),
          studentName: formData.reviewerName.trim(),
          reviewerDesignation: formData.reviewerDesignation.trim(),
          designation: formData.reviewerDesignation.trim(),
          reviewerAvatar: formData.reviewerAvatar || '',
          studentAvatar: formData.reviewerAvatar || '',
          reviewType: formData.reviewType,
          headline: formData.headline.trim(),
          title: formData.headline.trim(),
          content: formData.content.trim(),
          comment: formData.content.trim(),
          rating: Number(formData.rating) || 5,
          reviewDate: formData.reviewDate,
          videoSourceType: formData.videoSourceType,
          videoUrl: formData.videoUrl.trim(),
          videoThumbnail: formData.videoThumbnail.trim(),
          thumbnailUrl: formData.videoThumbnail.trim(),
          duration: Number(formData.duration) || 0,
          status: formData.status,
          displayOrder: Number(formData.displayOrder) || 0
        };

        if (editingReview) {
          await api.put(`/reviews/${editingReview._id}`, jsonPayload, {
            headers: { 'Content-Type': 'application/json' }
          });
          notify?.({ type: 'success', message: 'Review updated successfully in MongoDB' });
        } else {
          await api.post('/reviews', jsonPayload, {
            headers: { 'Content-Type': 'application/json' }
          });
          notify?.({ type: 'success', message: 'Review added successfully to course in MongoDB' });
        }
      } else {
        // Multipart FormData for uploaded videos, thumbnails, or avatars
        const data = new FormData();
        data.append('courseId', activeCourseId);
        data.append('reviewerName', formData.reviewerName.trim());
        data.append('studentName', formData.reviewerName.trim());
        data.append('reviewerDesignation', formData.reviewerDesignation.trim());
        data.append('designation', formData.reviewerDesignation.trim());
        data.append('reviewType', formData.reviewType);
        data.append('headline', formData.headline.trim());
        data.append('title', formData.headline.trim());
        data.append('content', formData.content.trim());
        data.append('comment', formData.content.trim());
        data.append('rating', formData.rating);
        data.append('reviewDate', formData.reviewDate);
        data.append('status', formData.status);
        data.append('displayOrder', formData.displayOrder);

        if (formData.reviewerAvatar) {
          data.append('reviewerAvatar', formData.reviewerAvatar);
          data.append('studentAvatar', formData.reviewerAvatar);
        }
        if (avatarFile) {
          data.append('avatarFile', avatarFile);
        }

        if (formData.reviewType === 'video') {
          data.append('videoSourceType', formData.videoSourceType);
          data.append('videoUrl', formData.videoUrl.trim());
          data.append('duration', formData.duration);
          data.append('videoThumbnail', formData.videoThumbnail.trim());
          data.append('thumbnailUrl', formData.videoThumbnail.trim());
          if (videoFile) data.append('videoFile', videoFile);
          if (thumbnailFile) data.append('thumbnailFile', thumbnailFile);
        }

        if (editingReview) {
          await api.put(`/reviews/${editingReview._id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          notify?.({ type: 'success', message: 'Review updated successfully in MongoDB' });
        } else {
          await api.post('/reviews', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          notify?.({ type: 'success', message: 'Review added successfully to course in MongoDB' });
        }
      }

      setModalOpen(false);
      // Immediately refresh reviews list for this course from MongoDB
      await fetchReviews();
    } catch (err) {
      console.error('Save review error:', err);
      notify?.({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save review in database'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating = 5) => {
    const num = Math.max(1, Math.min(5, Number(rating) || 5));
    return (
      <div className="flex items-center gap-0.5 text-[#F8D568]">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= num ? 'fill-[#F8D568] text-[#F8D568]' : 'text-line fill-line-soft'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-4 border-t border-line bg-canvas/70 p-4 rounded-lg border border-line">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-[#173765] uppercase tracking-wide flex items-center gap-2">
            <Star className="w-4 h-4 text-warning fill-[#F8D568]" />
            4. Course Reviews &amp; Testimonials ({reviews.length})
          </h4>
          <p className="text-[11px] text-ink-soft mt-0.5">
            Manage text-based and video-based reviews specifically attached to <span className="font-semibold text-ink">{courseTitle}</span>. These appear dynamically on the student course details page.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173765] hover:bg-[#0f213d] text-white rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Course Review</span>
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-ink-faint">Loading reviews from database...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-line rounded-lg space-y-1 bg-surface">
          <Star className="w-8 h-8 text-accent mx-auto opacity-70" />
          <p className="text-xs text-ink-soft font-medium">No reviews added for this course yet</p>
          <p className="text-[10px] text-ink-faint">
            Click "Add Course Review" to attach video stories or written testimonials directly to this course.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line border border-line rounded-lg bg-surface overflow-hidden shadow-sm">
          {reviews.map((rev) => {
            const isVideo = rev.reviewType === 'video';
            const isPublished = rev.status === 'published' || rev.status === 'active';
            const reviewerName = rev.reviewerName || rev.studentName || 'Reviewer';
            const designation = rev.reviewerDesignation || rev.designation || '';
            const headline = rev.headline || rev.title || '';
            const content = rev.content || rev.comment || '';
            const avatarUrl = rev.reviewerAvatar || rev.studentAvatar ? resolveMediaUrl(rev.reviewerAvatar || rev.studentAvatar) : '';
            const thumbUrl = rev.videoThumbnail || rev.thumbnailUrl ? resolveMediaUrl(rev.videoThumbnail || rev.thumbnailUrl) : '';

            return (
              <div
                key={rev._id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-canvas transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Thumbnail / Avatar */}
                  {isVideo ? (
                    <div
                      className="relative w-16 h-11 rounded-lg bg-navy-deep overflow-hidden shrink-0 cursor-pointer group border border-line"
                      onClick={() => setPlayingVideo(rev)}
                      title="Click to preview video"
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-navy text-ink-faint">
                          <Video className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-navy-deep/30 flex items-center justify-center group-hover:bg-navy-deep/10 transition">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-line"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#173765] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {reviewerName[0] || 'S'}
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-ink text-xs truncate">
                        {reviewerName}
                      </span>
                      {designation && (
                        <span className="text-[10px] text-ink-faint">
                          ({designation})
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isVideo
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-warning-soft text-[#92400e] border border-warning/20'
                        }`}
                      >
                        {isVideo ? 'Video' : 'Text'}
                      </span>
                      {renderStars(rev.rating)}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(rev)}
                        title="Click to toggle publish/draft"
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer transition ${
                          isPublished
                            ? 'bg-success-soft text-[#15803d] border border-success/20 hover:bg-success-soft'
                            : 'bg-canvas text-ink-soft border border-line hover:bg-line-soft'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </button>
                      <span className="text-[10px] text-ink-faint font-mono">
                        Order: {rev.displayOrder || 0}
                      </span>
                    </div>

                    {headline && (
                      <p className="font-semibold text-ink text-xs truncate">
                        {headline}
                      </p>
                    )}
                    <p className="text-[11px] text-ink-soft line-clamp-2">
                      "{content}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setPreviewReview(rev)}
                    className="p-1.5 text-ink-soft hover:text-brand rounded-md hover:bg-canvas cursor-pointer"
                    title="Preview Review Card"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rev)}
                    className="p-1.5 text-ink-soft hover:text-blue-600 rounded-md hover:bg-blue-50 cursor-pointer"
                    title="Edit Review"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(rev)}
                    className="p-1.5 text-ink-soft hover:text-danger rounded-md hover:bg-danger-soft cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Form (Add / Edit) - Portaled to document.body to isolate from parent forms */}
      {typeof document !== 'undefined' && modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-navy-deep/50 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xl max-h-[90vh] max-h-[90dvh] flex-col overflow-hidden rounded-lg sm:rounded-lg bg-surface shadow-overlay border border-line-soft z-10 text-xs text-ink">
            {/* Fixed Header */}
            <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-line bg-surface">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingReview ? 'Edit Course Review' : 'Add Course Review'}
                </h3>
                <p className="text-[11px] text-ink-soft">
                  Course: <span className="font-semibold text-ink">{courseTitle}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-ink-faint hover:text-ink-soft p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-ink">
              {/* Read-only Course Banner when scoped to a specific course: NO dropdown */}
              {courseId ? (
                <div className="bg-brand-soft border border-brand/15 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#2f6fed]" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2f6fed] block">
                        Course
                      </span>
                      <span className="text-xs font-bold text-[#173765]">
                        {courseTitle || 'Selected Course'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-surface text-[#173765] px-2.5 py-1 rounded-lg border border-line">
                    Automatic Association
                  </span>
                </div>
              ) : courses.length > 0 ? (
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Select Target Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="admin-input w-full text-ink"
                    required
                  >
                    <option value="" className="text-ink bg-surface">-- Choose Course --</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id} className="text-ink bg-surface">
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Review Type Selection */}
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Review Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reviewType: 'text' })}
                    className={`p-2.5 rounded-lg border text-center font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.reviewType === 'text'
                        ? 'border-[#173765] bg-[#FFE58A]/30 text-[#173765]'
                        : 'border-line hover:bg-canvas text-ink'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-[#2f6fed]" />
                    <span>Text Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reviewType: 'video' })}
                    className={`p-2.5 rounded-lg border text-center font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.reviewType === 'video'
                        ? 'border-[#173765] bg-[#FFE58A]/30 text-[#173765]'
                        : 'border-line hover:bg-canvas text-ink'
                    }`}
                  >
                    <Video className="w-4 h-4 text-[#2f6fed]" />
                    <span>Video Review</span>
                  </button>
                </div>
              </div>

              {/* Reviewer Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Reviewer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.reviewerName}
                    onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                    className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Reviewer Designation / Role (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior DevOps Engineer"
                    value={formData.reviewerDesignation}
                    onChange={(e) => setFormData({ ...formData, reviewerDesignation: e.target.value })}
                    className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                  />
                </div>
              </div>

              {/* Star Rating & Review Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Star Rating (Optional)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="admin-input w-full text-ink font-bold cursor-pointer"
                  >
                    <option value={5} className="text-ink bg-surface">★★★★★ (5 Stars)</option>
                    <option value={4} className="text-ink bg-surface">★★★★☆ (4 Stars)</option>
                    <option value={3} className="text-ink bg-surface">★★★☆☆ (3 Stars)</option>
                    <option value={2} className="text-ink bg-surface">★★☆☆☆ (2 Stars)</option>
                    <option value={1} className="text-ink bg-surface">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Review Date
                  </label>
                  <input
                    type="date"
                    value={formData.reviewDate}
                    onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                    className="admin-input w-full text-ink font-medium"
                  />
                </div>
              </div>

              {/* Profile Image (Avatar) Upload */}
              <div className="bg-canvas p-2.5 rounded-lg border border-line flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-line-soft overflow-hidden shrink-0 flex items-center justify-center border border-line">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-ink-soft">
                      {formData.reviewerName?.[0] || 'S'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-canvas border border-line rounded-lg cursor-pointer text-xs font-semibold text-ink shadow-sm">
                    <Upload className="w-3 h-3 text-[#2f6fed]" />
                    <span>Upload Reviewer Avatar (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-ink-soft block mt-0.5">
                    JPG, PNG, WebP
                  </span>
                </div>
              </div>

              {/* Review Headline & Content */}
              <div>
                <label className="block font-semibold text-ink mb-1">
                  Review Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastered Production Kubernetes in 6 weeks!"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  Review Content / Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about the learning experience, labs, practical implementation..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none leading-relaxed font-normal"
                />
              </div>

              {/* VIDEO SPECIFIC FIELDS */}
              {formData.reviewType === 'video' && (
                <div className="space-y-3 bg-brand-soft/60 p-3.5 rounded-lg border border-brand/20 text-ink">
                  <h5 className="font-bold text-[#173765] text-xs flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#2f6fed]" /> Video Media Configuration
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Video Source
                      </label>
                      <select
                        value={formData.videoSourceType}
                        onChange={(e) => setFormData({ ...formData, videoSourceType: e.target.value })}
                        className="admin-input w-full text-ink font-medium"
                      >
                        <option value="upload" className="text-ink bg-surface">Upload Video File to MongoDB GridFS (Binary)</option>
                        <option value="external" className="text-ink bg-surface">External Video Link (YouTube / Vimeo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 120"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) || 0 })}
                        className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                      />
                    </div>
                  </div>

                  {formData.videoSourceType === 'upload' ? (
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Upload Video File (MP4, WebM, MOV - Stored in MongoDB GridFS)
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(e) => setVideoFile(e.target.files[0])}
                        className="w-full p-2 border border-line rounded-lg bg-surface text-xs text-ink file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-canvas file:text-ink hover:file:bg-line-soft cursor-pointer"
                      />
                      {videoFile && (
                        <p className="text-[11px] text-[#15803d] font-medium mt-1">
                          Selected: {videoFile.name} ({Math.round(videoFile.size / (1024 * 1024))} MB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Video URL (YouTube or Vimeo)
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                      />
                    </div>
                  )}

                  {/* Video Thumbnail Upload */}
                  <div>
                    <label className="block font-semibold text-ink mb-1">
                      Video Thumbnail Image
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-12 bg-line-soft rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-line">
                        {thumbnailPreview ? (
                          <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Video className="w-4 h-4 text-ink-faint" />
                        )}
                      </div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-canvas border border-line rounded-lg cursor-pointer text-xs font-semibold text-ink shadow-sm">
                        <Upload className="w-3 h-3 text-[#2f6fed]" />
                        <span>Upload Video Thumbnail</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setThumbnailFile(file);
                              setThumbnailPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Status (Published / Draft) & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Review Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="admin-input w-full text-ink font-semibold cursor-pointer"
                  >
                    <option value="published" className="text-ink bg-surface">Published (Visible on Website)</option>
                    <option value="draft" className="text-ink bg-surface">Draft (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">
                    Display Order (Sorting)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-line rounded-lg bg-surface text-ink placeholder:text-ink-faint focus:ring-2 focus:ring-[#173765]/20 focus:border-[#173765] outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Footer with Buttons */}
            <div className="shrink-0 flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-line bg-surface">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-ink-soft hover:bg-canvas font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-[#173765] hover:bg-[#0f213d] text-white font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to MongoDB...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#FFE58A]" />
                    <span>{editingReview ? 'Update Review' : 'Save Review'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Portaled to document.body */}
      {typeof document !== 'undefined' && reviewToDelete && createPortal(
        <div className="fixed inset-0 z-50 bg-navy-deep/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full p-5 space-y-4 shadow-overlay border border-line-soft text-center">
            <div className="w-12 h-12 bg-danger-soft text-danger rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-ink text-base">Delete Review?</h4>
            <p className="text-xs text-ink-soft">
              Are you sure you want to remove the review from "{reviewToDelete.reviewerName || reviewToDelete.studentName}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="w-1/2 py-2 border rounded-lg text-ink-soft hover:bg-canvas text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-1/2 py-2 bg-danger hover:bg-[#b91c1c] text-white rounded-md text-xs font-semibold shadow-sm cursor-pointer transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Review Card Preview Modal - Portaled to document.body */}
      {typeof document !== 'undefined' && previewReview && createPortal(
        <div className="fixed inset-0 z-50 bg-navy-deep/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full p-5 space-y-4 shadow-overlay border border-line-soft">
            <div className="flex items-center justify-between pb-2 border-b border-line-soft">
              <span className="text-xs font-bold text-ink-soft uppercase">Review Card Preview</span>
              <button
                type="button"
                onClick={() => setPreviewReview(null)}
                className="text-ink-faint hover:text-ink-soft cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg border border-line p-4 space-y-3 shadow-sm bg-[#F8FAFC]">
              {previewReview.reviewType === 'video' && (
                <div className="aspect-video bg-navy-deep rounded-lg overflow-hidden relative flex items-center justify-center">
                  {previewReview.videoThumbnail || previewReview.thumbnailUrl ? (
                    <img
                      src={resolveMediaUrl(previewReview.videoThumbnail || previewReview.thumbnailUrl)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="w-8 h-8 text-white/50" />
                  )}
                  <div className="absolute inset-0 bg-navy-deep/30 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#2f6fed] text-white flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                {renderStars(previewReview.rating)}
                <span className="text-[10px] text-ink-faint">
                  {new Date(previewReview.reviewDate || previewReview.createdAt).toLocaleDateString()}
                </span>
              </div>

              {(previewReview.headline || previewReview.title) && (
                <h5 className="font-bold text-[#173765] text-xs">{previewReview.headline || previewReview.title}</h5>
              )}
              <p className="text-xs text-ink-soft leading-relaxed italic">
                "{previewReview.content || previewReview.comment}"
              </p>

              <div className="pt-3 border-t border-line flex items-center gap-2.5">
                {previewReview.reviewerAvatar || previewReview.studentAvatar ? (
                  <img
                    src={resolveMediaUrl(previewReview.reviewerAvatar || previewReview.studentAvatar)}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-line"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#173765] text-white font-bold text-xs flex items-center justify-center">
                    {(previewReview.reviewerName || previewReview.studentName)?.[0] || 'S'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#173765] text-xs">{previewReview.reviewerName || previewReview.studentName}</p>
                  <p className="text-[10px] text-ink-faint">{previewReview.reviewerDesignation || previewReview.designation || courseTitle}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewReview(null)}
              className="w-full py-2 bg-canvas hover:bg-line-soft text-ink text-xs font-semibold rounded-lg cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </div>
  );
};

export default CourseReviewsSection;
