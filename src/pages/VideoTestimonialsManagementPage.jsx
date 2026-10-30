import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  videoSourceType: 'external',
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
      videoSourceType: item.videoSourceType || 'external',
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
    setThumbnailPreview(item.thumbnailUrl || '');
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <VideoIcon className="h-6 w-6 text-indigo-600" />
            <span>Student Video Testimonials</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage student video success stories displayed on the AutoOps School homepage
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Video Testimonial</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, role, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
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
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="order-asc">Order: Ascending</option>
              <option value="order-desc">Order: Descending</option>
              <option value="newest">Newest First</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video Testimonials Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase border-b border-gray-100">
              <tr>
                <th className="p-4 w-16 text-center">Order</th>
                <th className="p-4 w-32">Thumbnail</th>
                <th className="p-4">Student & Role</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-center">Duration</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-400">
                    No video testimonials found. Click "Add Video Testimonial" to upload or link one.
                  </td>
                </tr>
              ) : (
                videos.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition">
                    {/* Display Order */}
                    <td className="p-4 text-center font-bold text-gray-900">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 inline-flex items-center justify-center text-xs">
                        {item.displayOrder}
                      </span>
                    </td>

                    {/* Thumbnail preview */}
                    <td className="p-4">
                      <div
                        onClick={() => setPreviewVideo(item)}
                        className="relative w-24 aspect-video rounded-xl bg-slate-900 overflow-hidden cursor-pointer group shadow-2xs"
                        title="Click to preview video"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.studentName}
                            className="w-full h-full object-cover group-hover:opacity-80 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#102747]">
                            <VideoIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-[#F4D36B] text-[#102747] flex items-center justify-center shadow-sm">
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student Name & Designation */}
                    <td className="p-4">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 leading-snug truncate text-sm">
                          {item.studentName}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
                          {item.designation}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                        {item.videoSourceType === 'upload' ? (
                          <>
                            <Upload className="w-3 h-3 text-indigo-600" />
                            <span>MP4 Upload</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-3 h-3 text-red-500" />
                            <span>YouTube / URL</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-center font-medium text-gray-600">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDuration(item.duration)}</span>
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="p-4 text-center">
                      {item.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Featured</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
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
                          onClick={() => setPreviewVideo(item)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Preview Video"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Video Testimonial"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Video Testimonial"
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                {editingItem ? 'Edit Video Testimonial' : 'Add New Video Testimonial'}
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
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="e.g. Amit Verma"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Course Name & Student Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="e.g. DevOps Engineering Masterclass"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Student Designation / Role
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Cloud Engineer / DevOps Engineer"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Video Source Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Video Source Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-semibold transition ${
                      formData.videoSourceType === 'external'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sourceType"
                      checked={formData.videoSourceType === 'external'}
                      onChange={() => setFormData({ ...formData, videoSourceType: 'external' })}
                      className="text-indigo-600"
                    />
                    <span>External URL (YouTube)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-semibold transition ${
                      formData.videoSourceType === 'upload'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sourceType"
                      checked={formData.videoSourceType === 'upload'}
                      onChange={() => setFormData({ ...formData, videoSourceType: 'upload' })}
                      className="text-indigo-600"
                    />
                    <span>Upload MP4 Video</span>
                  </label>
                </div>
              </div>

              {/* Video Source Input / Upload */}
              {formData.videoSourceType === 'external' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    YouTube or Video URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Accepts standard YouTube watch links, shorts, or direct embed URLs.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Upload MP4 Video File {!editingItem && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span>{videoFile ? videoFile.name : 'Choose MP4 Video File'}</span>
                      <input
                        type="file"
                        accept="video/mp4, video/webm, video/quicktime"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                    </label>
                    {formData.videoUrl && !videoFile && (
                      <span className="text-xs text-emerald-600 font-semibold">
                        Existing video uploaded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Maximum file size: 100MB. Duration is automatically detected if supported.
                  </p>
                </div>
              )}

              {/* Thumbnail Image */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Video Thumbnail Image (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {thumbnailPreview ? (
                    <div className="relative w-28 aspect-video rounded-xl overflow-hidden border border-gray-300 shrink-0">
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview('');
                          setFormData({ ...formData, thumbnailUrl: '' });
                        }}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 aspect-video rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                      <VideoIcon className="w-5 h-5" />
                    </div>
                  )}

                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                    <span>Upload Thumbnail</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  For YouTube videos, the high-resolution thumbnail is extracted automatically if left empty.
                </p>
              </div>

              {/* Duration & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Duration in Seconds
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    placeholder="e.g. 180 (for 3 mins)"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-gray-400 block mt-1">
                    Formatted: {formatDuration(formData.duration)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Description / Highlight (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key career transition takeaway..."
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Status & Featured */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>Highlight as Featured</span>
                  </label>
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Delete Video Testimonial?</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete the video testimonial for{' '}
              <strong className="text-gray-900">{itemToDelete.studentName}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
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
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-[#102747] rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d213c]">
              <div>
                <h3 className="text-white font-bold text-sm">
                  {previewVideo.studentName} — Preview
                </h3>
                <p className="text-xs text-gray-400">{previewVideo.designation}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              {previewVideo.videoUrl.includes('youtube.com') || previewVideo.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={`${previewVideo.videoUrl}${previewVideo.videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  title="Preview"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <video src={previewVideo.videoUrl} controls autoPlay className="w-full h-full object-contain">
                  Your browser does not support HTML5 video playback.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTestimonialsManagementPage;

