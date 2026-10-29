import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Upload, 
  X, 
  ExternalLink, 
  Download, 
  Check, 
  AlertCircle,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { ConfirmDialog, useFeedback } from '../components/Feedback';
import { courseTypeLabel, formatCoursePrice, isFreeCourse, resolveThumbnailUrl, PLACEHOLDER_THUMB } from '../utils/courseAccess';
import { openMaterial } from '../utils/materialAccess';
import { Image as ImageIcon } from 'lucide-react';

const emptyCourseForm = () => ({
  title: '',
  shortDescription: '',
  description: '',
  thumbnail: '',
  category: '',
  level: 'Beginner',
  language: 'English',
  duration: '10 Hours',
  curriculumTitle: '',
  learningOutcomes: '',
  price: 0,
  discountPrice: 0,
  isFree: true,
  status: 'published'
});

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [busyMaterialId, setBusyMaterialId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const { notify, confirm } = useFeedback();

  // Basic course form state
  const [formData, setFormData] = useState(emptyCourseForm());

  // Course modules/headings state.
  // moduleHeadings is the editable list of titles; existingModuleIds keeps the
  // MongoDB _id of every already-saved module (aligned by index) so editing can
  // update, add and delete real curriculum records instead of ignoring them.
  const [moduleHeadings, setModuleHeadings] = useState(['']);
  const [existingModuleIds, setExistingModuleIds] = useState([]);
  // Curriculum module ids removed in the form but still in the DB until save
  const [modulesToDelete, setModulesToDelete] = useState([]);

  // Course materials (PDFs) state
  // existingMaterials: fetched from backend when editing an existing course
  const [existingMaterials, setExistingMaterials] = useState([]);
  // pendingNewPdfs: newly staged files selected in this session to upload when saving
  // each item: { id, file, title, description, moduleTag }
  const [pendingNewPdfs, setPendingNewPdfs] = useState([]);
  // Material replacement modal / state
  const [replacingMaterialId, setReplacingMaterialId] = useState(null);
  const [replacementFile, setReplacementFile] = useState(null);
  const [isReplacing, setIsReplacing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Admin endpoint returns every status, so drafts and unpublished courses
      // stay manageable from this table.
      const [cRes, catRes] = await Promise.all([
        api.get('/courses/admin/list?limit=100&status=all'),
        api.get('/categories')
      ]);
      setCourses(cRes.data.courses || cRes.data.data || []);
      setCategories(catRes.data.categories || []);
      if (catRes.data.categories?.length > 0) {
        setFormData((prev) => ({ ...prev, category: prev.category || catRes.data.categories[0]._id }));
      }
    } catch (err) {
      console.error(err);
      notify({ type: 'error', message: 'Error fetching course list' });
    } finally {
      setLoading(false);
    }
  };

  // Open Add New Course modal
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({ ...emptyCourseForm(), category: categories[0]?._id || '' });
    setThumbnailFile(null);
    setThumbnailPreview('');
    setModuleHeadings(['Module 1: Introduction & Fundamentals']);
    setExistingModuleIds([]);
    setModulesToDelete([]);
    setExistingMaterials([]);
    setPendingNewPdfs([]);
    setModalOpen(true);
  };

  // Open Edit Course modal & load existing materials + modules
  const handleOpenEdit = async (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      category: course.category?._id || course.category || '',
      level: course.level || 'Beginner',
      language: course.language || 'English',
      duration: course.duration || '10 Hours',
      curriculumTitle: course.curriculumTitle || '',
      learningOutcomes: (course.learningOutcomes || []).join('\n'),
      price: course.price || 0,
      discountPrice: course.discountPrice || 0,
      isFree: course.isFree !== undefined ? course.isFree : true,
      status: course.status || 'published'
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnail ? resolveThumbnailUrl(course.thumbnail) : '');
    setPendingNewPdfs([]);
    setExistingMaterials([]);
    setModuleHeadings(['']);
    setExistingModuleIds([]);
    setModulesToDelete([]);

    try {
      // Fetch existing curriculum modules and materials for this course in parallel.
      // The admin curriculum endpoint is the full-structure one and answers `modules`.
      const [matRes, currRes] = await Promise.all([
        api.get(`/materials/course/${course._id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/curriculum/courses/${course._id}/curriculum`).catch(() => ({ data: { modules: [] } }))
      ]);

      setExistingMaterials(matRes.data.data || matRes.data.materials || []);

      const mods = currRes.data.modules || currRes.data.curriculum || [];
      if (mods.length > 0) {
        setModuleHeadings(mods.map((m) => m.title));
        setExistingModuleIds(mods.map((m) => m._id));
      } else {
        setModuleHeadings(['Module 1: Introduction']);
        setExistingModuleIds([]);
      }
    } catch (err) {
      console.error('Failed to load course details / materials:', err);
    }

    setModalOpen(true);
  };

  // Add / Remove Module headings in form
  // Each heading keeps its own slot in existingModuleIds, so a saved module can
  // be renamed (PUT) or removed (DELETE) against the real curriculum records.
  const addModuleHeading = () => {
    setModuleHeadings((prev) => [...prev, `Module ${prev.length + 1}: `]);
    setExistingModuleIds((prev) => [...prev, null]);
  };

  const updateModuleHeading = (index, value) => {
    const updated = [...moduleHeadings];
    updated[index] = value;
    setModuleHeadings(updated);
  };

  const removeModuleHeading = (index) => {
    if (moduleHeadings.length <= 1) return;
    const removedId = existingModuleIds[index];
    setModuleHeadings((prev) => prev.filter((_, i) => i !== index));
    setExistingModuleIds((prev) => prev.filter((_, i) => i !== index));
    if (removedId) setModulesToDelete((prev) => [...prev, removedId]);
  };

  // Push the editable headings onto MongoDB through the existing curriculum API
  const syncModules = async (courseId) => {
    const entries = moduleHeadings
      .map((heading, index) => ({ index, title: (heading || '').trim(), id: existingModuleIds[index] }))
      .filter((entry) => entry.title.length > 0);

    const syncedIds = [...existingModuleIds];

    for (let pos = 0; pos < entries.length; pos++) {
      const { index, title, id } = entries[pos];
      const order = pos + 1;
      try {
        if (id) {
          await api.put(`/curriculum/modules/${id}`, { title, order });
        } else {
          const created = await api.post('/curriculum/modules', { courseId, title, order });
          syncedIds[index] = created.data.module?._id || null;
        }
      } catch (mErr) {
        console.warn('Module sync notice:', mErr);
      }
    }

    for (const staleId of modulesToDelete) {
      try {
        await api.delete(`/curriculum/modules/${staleId}`);
      } catch (dErr) {
        console.warn('Module deletion notice:', dErr);
      }
    }

    setExistingModuleIds(syncedIds);
    setModulesToDelete([]);
  };

  // Handle image file selection for course thumbnail
  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      notify({
        type: 'error',
        message: 'Invalid file format. Please upload JPG, JPEG, PNG, or WebP.'
      });
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify({
        type: 'error',
        message: 'Image size exceeds maximum limit of 5MB.'
      });
      return;
    }

    setThumbnailFile(file);
    const localPreviewUrl = URL.createObjectURL(file);
    setThumbnailPreview(localPreviewUrl);
  };

  // Remove thumbnail
  const handleRemoveThumbnail = async () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormData((prev) => ({ ...prev, thumbnail: '', thumbnailImage: undefined }));

    if (editingCourse?._id && editingCourse.thumbnail) {
      try {
        await api.delete(`/courses/thumbnail/${editingCourse._id}`);
        notify({ type: 'success', message: 'Thumbnail removed from course.' });
      } catch (err) {
        console.warn('Thumbnail deletion notification:', err);
      }
    }
  };
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEntries = files.map((file) => ({
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      description: '',
      moduleTag: (moduleHeadings[0] || '').trim()
    }));

    setPendingNewPdfs((prev) => [...prev, ...newEntries]);
    e.target.value = null; // reset input
  };

  const updatePendingPdf = (id, field, value) => {
    setPendingNewPdfs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removePendingPdf = (id) => {
    setPendingNewPdfs((prev) => prev.filter((item) => item.id !== id));
  };

  // Delete existing material from DB
  const handleDeleteExistingMaterial = async (matId, matTitle) => {
    const ok = await confirm({
      title: 'Remove Course Document?',
      message: `Are you sure you want to remove "${matTitle}"? Enrolled students will no longer be able to download it.`
    });
    if (!ok) return;

    try {
      await api.delete(`/materials/${matId}`);
      setExistingMaterials((prev) => prev.filter((m) => m._id !== matId));
      notify({ type: 'success', message: 'Material removed successfully' });
    } catch (err) {
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Could not delete material'
      });
    }
  };

  // Replace existing material file
  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!replacingMaterialId || !replacementFile) return;

    try {
      setIsReplacing(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', replacementFile);

      // No manual Content-Type: axios sets the multipart boundary.
      const res = await api.put(`/materials/${replacingMaterialId}/replace`, formDataUpload);

      if (res.data.success) {
        notify({ type: 'success', message: 'Document file replaced successfully' });
        // Update local list
        setExistingMaterials((prev) =>
          prev.map((m) => (m._id === replacingMaterialId ? res.data.material : m))
        );
        setReplacingMaterialId(null);
        setReplacementFile(null);
      }
    } catch (err) {
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Failed to replace file'
      });
    } finally {
      setIsReplacing(false);
    }
  };

  // Form Submission: Saves course first, then syncs modules and uploads all staged PDFs
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingCourse(true);

    // Price is the single source of truth for the Free/Paid label everywhere:
    // a free course must never carry a charge in the database.
    const payload = { ...formData };
    if (payload.isFree) {
      payload.price = 0;
      payload.discountPrice = 0;
    }
    payload.learningOutcomes = String(payload.learningOutcomes || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    try {
      let savedCourseId = editingCourse?._id;

      // If a new thumbnail file was chosen, upload it to MongoDB first
      let uploadedThumbnailUrl = formData.thumbnail;
      let uploadedImageId = formData.thumbnailImage;

      if (thumbnailFile) {
        setUploadingThumbnail(true);
        const imgForm = new FormData();
        imgForm.append('thumbnail', thumbnailFile);
        if (savedCourseId) {
          imgForm.append('courseId', savedCourseId);
        }

        const imgRes = await api.post('/courses/thumbnail/upload', imgForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (imgRes.data?.success) {
          uploadedThumbnailUrl = imgRes.data.thumbnailUrl;
          uploadedImageId = imgRes.data.imageId;
          payload.thumbnail = uploadedThumbnailUrl;
          payload.thumbnailImage = uploadedImageId;
        }
      }

      if (editingCourse) {
        // Update existing course
        const updateRes = await api.put(`/courses/${editingCourse._id}`, payload);
        savedCourseId = updateRes.data.course?._id || editingCourse._id;
      } else {
        // Create new course
        const createRes = await api.post('/courses', payload);
        savedCourseId = createRes.data.course._id;
      }

      // Keep the curriculum in sync for both create and edit
      await syncModules(savedCourseId);

      // Upload any staged new PDFs associated with this course ID
      if (pendingNewPdfs.length > 0) {
        for (const pdfItem of pendingNewPdfs) {
          const uploadForm = new FormData();
          uploadForm.append('file', pdfItem.file);
          uploadForm.append('title', pdfItem.title || pdfItem.file.name);
          uploadForm.append('description', pdfItem.description || '');
          uploadForm.append('courseId', savedCourseId);
          if (pdfItem.moduleTag) uploadForm.append('moduleId', pdfItem.moduleTag);
          uploadForm.append('isPublished', 'true');

          await api.post('/materials/upload', uploadForm);
        }
      }

      notify({
        type: 'success',
        message: editingCourse
          ? 'Course and materials updated successfully.'
          : 'New course created and PDF materials attached successfully.'
      });

      setModalOpen(false);
      setEditingCourse(null);
      setPendingNewPdfs([]);
      fetchData();
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Error saving course and materials'
      });
    } finally {
      setSavingCourse(false);
      setUploadingThumbnail(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${courseToDelete}`);
      setCourseToDelete(null);
      notify({ type: 'success', message: 'Course deleted successfully' });
      fetchData();
    } catch (err) {
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Error deleting course'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Publish / unpublish straight from the table
  const handleTogglePublish = async (course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/courses/${course._id}`, { status: nextStatus });
      notify({
        type: 'success',
        message: `"${course.title}" is now ${nextStatus === 'published' ? 'visible in the student catalog' : 'hidden (draft)'}.`
      });
      fetchData();
    } catch (err) {
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Could not change the publishing status'
      });
    }
  };

  // Authenticated preview/download: the endpoint needs the admin bearer token,
  // so a plain <a href> navigation would always answer 401.
  const handleMaterialAction = async (mat, inline) => {
    setBusyMaterialId(mat._id);
    try {
      await openMaterial(mat, { inline });
    } catch (err) {
      notify({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Could not open this document'
      });
    } finally {
      setBusyMaterialId(null);
    }
  };

  const statusTone = (status) =>
    status === 'published'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'archived'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-amber-50 text-amber-700';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <ConfirmDialog
        open={Boolean(courseToDelete)}
        title="Delete course?"
        description="This removes the course, curriculum, and associated materials. This action cannot be undone."
        onCancel={() => setCourseToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Courses Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create courses with minimal required fields, attach PDF notes directly, and manage enrollments.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#173563] hover:bg-[#102747] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition"
        >
          <Plus className="h-4 w-4" /> Add New Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-4">Course Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price / Type</th>
                <th className="p-4">Curriculum</th>
                <th className="p-4">Students</th>
                <th className="p-4">Access Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveThumbnailUrl(c.thumbnail)}
                        alt=""
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_THUMB; }}
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
                      />
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{c.title}</p>
                        <p className="text-[11px] text-gray-400">{c.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-700">{c.category?.name || 'Uncategorised'}</td>
                  <td className="p-4">
                    <span className={`font-bold ${isFreeCourse(c) ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {formatCoursePrice(c)}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                      {courseTypeLabel(c)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">
                    <span className="font-semibold">{c.moduleCount || 0}</span> modules
                    <span className="block text-[10px] text-gray-400">{c.lessonCount || 0} lessons</span>
                  </td>
                  <td className="p-4 font-semibold text-gray-800">{c.enrollmentCount || 0}</td>
                  <td className="p-4 text-slate-700 font-medium">3 Calendar Months</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(c)}
                      title="Publish or unpublish this course"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition hover:opacity-80 ${statusTone(c.status)}`}
                    >
                      {c.status}
                    </button>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                      title="Edit Course & PDFs"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCourseToDelete(c._id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Course Modal (Add New Course & Edit Course with Integrated PDF Section) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Title */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCourse ? 'Edit Course & Learning Materials' : 'Create New Course with PDF Materials'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure course details, add module headings, and upload study PDFs in one unified form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* SECTION 1: Basic Course Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#173563] uppercase tracking-wide flex items-center gap-1.5">
                  1. Course Information
                </h4>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Production DevOps &amp; Kubernetes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-[#173563]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Short Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief 1-2 sentence overview shown in cards"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-[#173563]"
                  />
                </div>

                {/* Course Thumbnail Image Upload Component */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-gray-800 text-xs">
                      Course Thumbnail Image
                    </label>
                    <span className="text-[10px] text-gray-500">
                      JPG, PNG, WebP (Max 5MB) • Stored in MongoDB
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Thumbnail Preview Box */}
                    <div className="relative w-36 h-24 rounded-xl overflow-hidden bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail Preview"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_THUMB;
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                          <span className="text-[10px] block">No thumbnail</span>
                        </div>
                      )}
                    </div>

                    {/* Controls: Browse Files & Remove */}
                    <div className="space-y-2 flex-1 w-full text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#173563] hover:bg-[#102747] text-white rounded-lg cursor-pointer text-xs font-semibold shadow-xs transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{thumbnailPreview ? 'Change Thumbnail' : 'Upload Thumbnail'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleThumbnailSelect}
                            className="hidden"
                          />
                        </label>

                        {thumbnailPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveThumbnail}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Image</span>
                          </button>
                        )}
                      </div>

                      {thumbnailFile && (
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Selected: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)} KB)
                        </p>
                      )}

                      {!thumbnailFile && thumbnailPreview && (
                        <p className="text-[10px] text-gray-500">
                          Active thumbnail stored in MongoDB. Click "Change Thumbnail" to replace with a new image.
                        </p>
                      )}

                      {!thumbnailPreview && (
                        <p className="text-[10px] text-gray-400">
                          Select an image from your computer to store directly in MongoDB. If left blank, the branded placeholder will be shown.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Curriculum Description</label>
                  <textarea
                    rows={3}
                    placeholder="Detailed explanation of the course syllabus and topics covered..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-[#173563]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Learning Objectives</label>
                  <textarea
                    rows={4}
                    placeholder={'One objective per line, e.g.\nUnderstand Linux fundamentals.\nUse basic Linux terminal commands.'}
                    value={formData.learningOutcomes}
                    onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-[#173563]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Saved as a list on the course record and shown on the student course details page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 border rounded-xl bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Difficulty Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full p-2.5 border rounded-xl bg-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Course Type</label>
                    <select
                      value={formData.isFree ? 'true' : 'false'}
                      onChange={(e) => {
                        const isFree = e.target.value === 'true';
                        setFormData({
                          ...formData,
                          isFree,
                          price: isFree ? 0 : formData.price,
                          discountPrice: isFree ? 0 : formData.discountPrice
                        });
                      }}
                      className="w-full p-2.5 border rounded-xl bg-white"
                    >
                      <option value="true">Free Course</option>
                      <option value="false">Paid Course</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value) || 0);
                        // A ₹0 course is a free course: keep type and price in step
                        setFormData({ ...formData, price, isFree: price === 0 });
                      }}
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Discount Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.discountPrice}
                      disabled={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, discountPrice: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full p-2.5 border rounded-xl disabled:bg-slate-50 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Publishing Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 border rounded-xl bg-white"
                    >
                      <option value="published">Published (Visible in Catalog)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Access Window</label>
                    <input
                      type="text"
                      disabled
                      value="3 Calendar Months Access"
                      className="w-full p-2.5 border rounded-xl bg-slate-50 text-slate-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Course Modules & Headings */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#173563] uppercase tracking-wide flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4" /> 2. Course Modules &amp; Headings
                  </h4>
                  <button
                    type="button"
                    onClick={addModuleHeading}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                </div>

                <div className="space-y-2">
                  {moduleHeadings.map((heading, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-gray-400 font-semibold text-[11px] w-6 text-right">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={heading}
                        placeholder={`e.g. Module ${idx + 1}: Topic Title`}
                        onChange={(e) => updateModuleHeading(idx, e.target.value)}
                        className="flex-1 p-2 border rounded-lg text-xs"
                      />
                      {moduleHeadings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModuleHeading(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Dedicated Integrated Course Materials (PDFs) */}
              <div className="space-y-4 pt-4 border-t border-gray-200 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#173563] uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      3. Course Materials &amp; Documents (PDFs)
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Upload study sheets, lecture notes, and PDFs. These are automatically attached to this course and accessible only to approved students during their 3-month access.
                    </p>
                  </div>

                  {/* Upload button */}
                  <label className="inline-flex items-center gap-1.5 bg-[#173563] hover:bg-[#102747] text-white px-3 py-1.5 rounded-lg cursor-pointer font-semibold shadow-xs shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PDFs</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.zip"
                      onChange={handleFilesSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* List of Existing Saved PDFs (when editing) */}
                {editingCourse && existingMaterials.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-bold text-gray-700 uppercase">
                      Existing Uploaded Materials ({existingMaterials.length})
                    </p>
                    <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white overflow-hidden">
                      {existingMaterials.map((mat) => (
                        <div key={mat._id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-md bg-red-50 text-red-600 border border-red-200 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{mat.title}</p>
                              <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                <span>{mat.fileName}</span>
                                <span>•</span>
                                <span>{formatFileSize(mat.fileSize)}</span>
                                <span>•</span>
                                <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMaterialAction(mat, true)}
                              disabled={busyMaterialId === mat._id}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                              title="Preview PDF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMaterialAction(mat, false)}
                              disabled={busyMaterialId === mat._id}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingMaterialId(mat._id);
                                setReplacementFile(null);
                              }}
                              className="p-1.5 text-gray-500 hover:text-amber-600 rounded-md hover:bg-amber-50"
                              title="Replace PDF File"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingMaterial(mat._id, mat.title)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staged New PDFs to be saved */}
                {pendingNewPdfs.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-bold text-indigo-700 uppercase">
                      New PDFs Ready to Save ({pendingNewPdfs.length})
                    </p>
                    <div className="space-y-2">
                      {pendingNewPdfs.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-sm">
                                <FileText className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-semibold text-gray-900 truncate">
                                {item.file.name} ({formatFileSize(item.file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePendingPdf(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <input
                              type="text"
                              required
                              placeholder="Document Title *"
                              value={item.title}
                              onChange={(e) => updatePendingPdf(item.id, 'title', e.target.value)}
                              className="p-1.5 border rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Short Description (Optional)"
                              value={item.description}
                              onChange={(e) => updatePendingPdf(item.id, 'description', e.target.value)}
                              className="p-1.5 border rounded-lg text-xs"
                            />
                            <select
                              value={item.moduleTag}
                              onChange={(e) => updatePendingPdf(item.id, 'moduleTag', e.target.value)}
                              className="p-1.5 border rounded-lg text-xs bg-white"
                              title="Module this document belongs to"
                            >
                              <option value="">No module</option>
                              {moduleHeadings
                                .map((heading) => (heading || '').trim())
                                .filter(Boolean)
                                .map((heading) => (
                                  <option key={heading} value={heading}>{heading}</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingMaterials.length === 0 && pendingNewPdfs.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl space-y-1">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">No PDFs attached to this course yet</p>
                    <p className="text-[10px] text-gray-400">
                      Click the "Upload PDFs" button above to attach notes, reference sheets, or slides.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border rounded-xl text-gray-600 hover:bg-gray-50 text-center font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-[#173563] hover:bg-[#102747] text-white font-bold rounded-xl text-center shadow-xs flex items-center justify-center gap-2"
                >
                  {savingCourse ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Course &amp; Uploading PDFs...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingCourse ? 'Update Course & Materials' : 'Save Course & Upload Materials'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Replace PDF File */}
      {replacingMaterialId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                Replace Course PDF File
              </h3>
              <button
                type="button"
                onClick={() => setReplacingMaterialId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select a new PDF to replace the existing document. The document title and enrollment access permissions will be preserved.
            </p>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => setReplacementFile(e.target.files[0])}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplacingMaterialId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replacementFile}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isReplacing ? 'Uploading...' : 'Confirm Replace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagementPage;
