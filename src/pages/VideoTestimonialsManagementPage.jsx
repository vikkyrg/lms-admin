import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { resolveMediaUrl } from '../utils/videoUtils';
import VideoPlayerModal from '../components/VideoPlayerModal';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Search,
  Filter,
  ArrowUpDown,
  Upload,
  X,
  Clock,
  Video as VideoIcon,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const emptyVideoForm = () => ({
  studentName: '',
  designation: '',
  courseName: '',
  videoSourceType: 'upload',
  videoUrl: '',
  thumbnailUrl: '',
  duration: 0,
  description: '',
  status: 'active',
  displayOrder: 0,
  isFeatured: false
});

const VideoTestimonialsManagementPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('order-asc');

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyVideoForm());
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  const { notify } = useFeedback();

  useEffect(() => {
    fetchVideos();
  }, [statusFilter, sortOption]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (sortOption) params.append('sort', sortOption);

      const res = await api.get(`/video-testimonials/admin?${params.toString()}`);
      setVideos(res.data.videoTestimonials || []);
    } catch (err) {
      console.error('Failed to load video testimonials:', err);
      notify({ type: 'error', message: 'Failed to load video testimonials' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyVideoForm());
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      studentName: item.studentName || '',
      designation: item.designation || '',
      courseName: item.courseName || '',
      videoSourceType: item.videoSourceType || 'upload',
      videoUrl: item.videoUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      duration: item.duration || 0,
      description: item.description || '',
      status: item.status || 'active',
      displayOrder: item.displayOrder ?? 0,
      isFeatured: Boolean(item.isFeatured)
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(item.thumbnailUrl ? resolveMediaUrl(item.thumbnailUrl) : '');
    setModalOpen(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      notify({ type: 'error', message: 'Only JPG, JPEG, PNG, and WebP images are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify({ type: 'error', message: 'Thumbnail cannot exceed 5MB' });
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      notify({ type: 'error', message: 'Video file size cannot exceed 100MB' });
      return;
    }

    setVideoFile(file);

    // Attempt HTML5 video element duration detection
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src);
        const durationSec = Math.round(tempVideo.duration);
        if (durationSec > 0 && !formData.duration) {
          setFormData((prev) => ({ ...prev, duration: durationSec }));
        }
      };
      tempVideo.src = URL.createObjectURL(file);
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.studentName.trim()) {
      notify({ type: 'error', message: 'Please enter student name' });
      return;
    }

    if (formData.videoSourceType === 'upload' && !videoFile && !formData.videoUrl) {
      notify({ type: 'error', message: 'Please upload an MP4 video file' });
      return;
    }

    if (formData.videoSourceType === 'external' && !formData.videoUrl.trim()) {
      notify({ type: 'error', message: 'Please enter a valid YouTube or external video URL' });
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('studentName', formData.studentName.trim());
      data.append('designation', formData.designation.trim());
      data.append('courseName', formData.courseName.trim());
      data.append('videoSourceType', formData.videoSourceType);
      data.append('videoUrl', formData.videoUrl.trim());
      data.append('duration', formData.duration || 0);
      data.append('description', formData.description.trim());
      data.append('status', formData.status);
      data.append('displayOrder', formData.displayOrder || 0);
      data.append('isFeatured', formData.isFeatured);

      if (videoFile) {
        data.append('videoFile', videoFile);
      }
      if (thumbnailFile) {
        data.append('thumbnailFile', thumbnailFile);
      } else if (formData.thumbnailUrl) {
        data.append('thumbnailUrl', formData.thumbnailUrl.trim());
      }

      if (editingItem) {
        await api.put(`/video-testimonials/${editingItem._id}`, data);
        notify({ type: 'success', message: 'Video testimonial updated successfully' });
      } else {
        await api.post('/video-testimonials', data);
        notify({ type: 'success', message: 'Video testimonial created successfully' });
      }

      setModalOpen(false);
      fetchVideos();
    } catch (err) {
      console.error('Save video error:', err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save video testimonial'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/video-testimonials/${item._id}`, { status: newStatus });
      notify({ type: 'success', message: `Video set to ${newStatus}` });
      setVideos((prev) =>
        prev.map((v) => (v._id === item._id ? { ...v, status: newStatus } : v))
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
      await api.delete(`/video-testimonials/${itemToDelete._id}`);
      notify({ type: 'success', message: 'Video testimonial deleted successfully' });
      setItemToDelete(null);
      fetchVideos();
    } catch (err) {
      console.error('Delete video error:', err);
      notify({ type: 'error', message: 'Failed to delete video' });
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ink tracking-tight">
            Video Testimonials
          </h1>
          <p className="text-xs text-ink-soft mt-1">
            Upload MP4 video stories or link YouTube reviews. All uploaded video files are stored directly in MongoDB.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-deep text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video Testimonial</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-lg border border-line shadow-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or designation..."
            className="admin-input pl-9"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Filter className="w-3.5 h-3.5 text-ink-faint" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-line rounded-md px-2.5 py-1.5 text-xs bg-surface text-ink font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ink-soft">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-faint" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-line rounded-md px-2.5 py-1.5 text-xs bg-surface text-ink font-medium cursor-pointer"
            >
              <option value="order-asc">Order (Lowest first)</option>
              <option value="order-desc">Order (Highest first)</option>
              <option value="newest">Newest first</option>
              <option value="duration">Longest duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Testimonials Table */}
      <div className="bg-surface rounded-lg border border-line shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink-soft border-collapse">
            <thead className="bg-canvas border-b border-line text-ink-soft font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 w-12 text-center">Order</th>
                <th className="p-4 w-28">Preview</th>
                <th className="p-4">Student & Details</th>
                <th className="p-4 w-28">Storage</th>
                <th className="p-4 w-24 text-center">Duration</th>
                <th className="p-4 w-24 text-center">Featured</th>
                <th className="p-4 w-24 text-center">Status</th>
                <th className="p-4 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-ink-faint">
                    Loading video testimonials...
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-ink-faint">
                    No video testimonials found. Click "Add Video Testimonial" to upload or link one.
                  </td>
                </tr>
              ) : (
                videos.map((item) => (
                  <tr key={item._id} className="hover:bg-canvas transition">
                    <td className="p-4 text-center font-bold text-ink">
                      <span className="w-7 h-7 rounded-lg bg-canvas border border-line inline-flex items-center justify-center text-xs">
                        {item.displayOrder}
                      </span>
                    </td>

                    <td className="p-4">
                      <div
                        onClick={() => setPreviewVideo(item)}
                        className="relative w-24 aspect-video rounded-lg bg-navy-deep overflow-hidden cursor-pointer group shadow-card"
                        title="Click to preview video"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={resolveMediaUrl(item.thumbnailUrl)}
                            alt={item.studentName}
                            className="w-full h-full object-cover group-hover:opacity-80 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 bg-navy-deep">
                            <VideoIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-accent text-navy flex items-center justify-center shadow-sm">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="min-w-0">
                        <p className="font-bold text-ink leading-snug truncate text-sm">
                          {item.studentName}
                        </p>
                        <p className="text-xs font-semibold text-ink-soft truncate mt-0.5">
                          {item.designation}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-ink-faint line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink bg-canvas border border-line px-2 py-0.5 rounded-md">
                        {item.videoSourceType === 'upload' ? (
                          <>
                            <Upload className="w-3 h-3 text-brand" />
                            <span>MongoDB Raw</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-3 h-3 text-danger" />
                            <span>YouTube / URL</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-4 text-center font-medium text-ink-soft">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-ink-faint" />
                        <span>{formatDuration(item.duration)}</span>
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {item.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#92400e] bg-warning-soft border border-warning/20 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-warning" />
                          <span>Featured</span>
                        </span>
                      ) : (
                        <span className="text-ink-faint text-xs">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          item.status === 'active'
                            ? 'bg-success-soft text-[#15803d] border border-success/20 hover:bg-[#dcfce7]'
                            : 'bg-canvas text-ink-soft border border-line hover:bg-line-soft'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-success' : 'bg-ink-faint'
                          }`}
                        />
                        <span>{item.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-md text-ink-faint hover:text-brand hover:bg-brand-soft transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                          title="Delete"
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-2xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-overlay border border-line admin-modal-in">
            <div className="flex items-center justify-between pb-4 border-b border-line-soft">
              <h2 className="text-lg font-bold text-ink">
                {editingItem ? 'Edit Video Testimonial' : 'Add New Video Testimonial'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-canvas text-ink-soft hover:bg-canvas flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Designation / Company
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. DevOps Engineer at Wipro"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="e.g. Complete DevOps Engineering Bootcamp"
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Video Source Type
                  </label>
                  <select
                    value={formData.videoSourceType}
                    onChange={(e) => setFormData({ ...formData, videoSourceType: e.target.value })}
                    className="admin-input cursor-pointer"
                  >
                    <option value="upload">Upload MP4 Video (Stored in MongoDB)</option>
                    <option value="external">External Video Link (YouTube / Vimeo)</option>
                  </select>
                </div>
              </div>

              {/* Upload section if "upload" */}
              {formData.videoSourceType === 'upload' ? (
                <div className="space-y-2 bg-brand-soft/50 p-4 rounded-lg border border-brand/15">
                  <label className="block text-xs font-bold text-navy">
                    Upload MP4 / WebM Video File (Max 100MB)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileChange}
                    className="w-full text-xs text-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-deep cursor-pointer"
                  />
                  {editingItem && editingItem.videoSourceType === 'upload' && !videoFile && (
                    <p className="text-[11px] text-ink-soft mt-1">
                      Current video is already saved in MongoDB. Leave blank to keep existing video, or select a new file to replace it.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    External Video URL * (YouTube / Vimeo)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="admin-input"
                  />
                </div>
              )}

              {/* Thumbnail Upload */}
              <div className="space-y-2 bg-canvas p-4 rounded-lg border border-line">
                <label className="block text-xs font-bold text-ink">
                  Custom Video Thumbnail (JPG, PNG, WebP)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    className="text-xs text-ink-soft file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-deep cursor-pointer"
                  />
                  {thumbnailPreview && (
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden border border-line shrink-0">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Brief Student Feedback / Testimonial Quote
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Share a short highlight from the student's learning experience..."
                  className="admin-input"
                />
              </div>

              {/* Status and Display Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="admin-input"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-brand focus:ring-brand h-4 w-4"
                    />
                    <span>Highlight as Featured</span>
                  </label>
                </div>
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
                  {submitting ? 'Saving...' : 'Save Video Testimonial'}
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
            <h3 className="font-bold text-ink text-base">Delete Video Testimonial?</h3>
            <p className="text-xs text-ink-soft">
              Are you sure you want to delete the video testimonial for{' '}
              <strong className="text-ink">{itemToDelete.studentName}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-3.5 py-2 border border-line rounded-md text-xs font-semibold text-ink hover:bg-canvas disabled:opacity-50"
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

      {/* Video Preview Modal using shared component */}
      <VideoPlayerModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
    </div>
  );
};

export default VideoTestimonialsManagementPage;
