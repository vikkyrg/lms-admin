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
  FolderTree,
  BookOpen
} from 'lucide-react';
import { ConfirmDialog, useFeedback } from '../components/Feedback';
import { DataTable, btn } from '../components/ui';
import { courseTypeLabel, formatCoursePrice, isFreeCourse, resolveThumbnailUrl, PLACEHOLDER_THUMB } from '../utils/courseAccess';
import { openMaterial } from '../utils/materialAccess';
import { Image as ImageIcon } from 'lucide-react';
import CourseReviewsSection from '../components/CourseReviewsSection';

const emptyCourseForm = () => ({
  title: '',
  shortDescription: '',
  description: '',
  thumbnail: '',
  category: '',
  level: 'Beginner',
  language: 'English',
  duration: '10 Hours',
  videoDuration: 10,
  curriculumTitle: '',
  learningOutcomes: '',
  price: 0,
  discountPrice: 0,
  isFree: true,
  status: 'published',
  freePreviewCount: 2
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
    const parsedDuration = course.videoDuration || parseFloat(course.duration) || 10;
    setFormData({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      category: course.category?._id || course.category || '',
      level: course.level || 'Beginner',
      language: course.language || 'English',
      duration: course.duration || `${parsedDuration} Hours`,
      videoDuration: parsedDuration,
      curriculumTitle: course.curriculumTitle || '',
      learningOutcomes: (course.learningOutcomes || []).join('\n'),
      price: course.price || 0,
      discountPrice: course.discountPrice || 0,
      isFree: course.isFree !== undefined ? course.isFree : true,
      status: course.status || 'published',
      freePreviewCount: course.freePreviewCount !== undefined ? Number(course.freePreviewCount) : 2
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
      ? 'bg-success-soft text-[#15803d] border border-success/20'
      : status === 'archived'
        ? 'bg-canvas text-ink-soft border border-line'
        : 'bg-warning-soft text-[#92400e] border border-warning/20';

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
          <h1 className="text-lg font-bold text-ink tracking-tight">Courses Management</h1>
          <p className="text-xs text-ink-soft mt-1">
            Create courses with minimal required fields, attach PDF notes directly, and manage enrollments.
          </p>
        </div>
        <button onClick={handleOpenAdd} className={btn('primary', 'md', 'w-full sm:w-auto justify-center')}>
          <Plus className="h-4 w-4" /> Add New Course
        </button>
      </div>

      {/* Courses Table */}
      <DataTable
        loading={loading}
        rows={courses}
        minWidthClass="min-w-[900px]"
        empty={{
          icon: BookOpen,
          title: 'No courses yet',
          message: 'Create your first course to publish it in the student catalog.',
          action: (
            <button onClick={handleOpenAdd} className={btn('primary')}>
              <Plus className="h-4 w-4" /> Add New Course
            </button>
          )
        }}
        columns={[
          {
            key: 'title',
            header: 'Course Title',
            render: (c) => (
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={resolveThumbnailUrl(c.thumbnail)}
                  alt=""
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_THUMB; }}
                  className="w-10 h-10 rounded-lg object-cover bg-canvas border border-line shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-ink line-clamp-1">{c.title}</p>
                  <p className="text-[11px] text-ink-faint">{c.level}</p>
                </div>
              </div>
            )
          },
          {
            key: 'category',
            header: 'Category',
            render: (c) => <span className="font-medium text-ink-soft whitespace-nowrap">{c.category?.name || 'Uncategorised'}</span>
          },
          {
            key: 'price',
            header: 'Price / Type',
            render: (c) => (
              <div>
                <span className={`font-semibold ${isFreeCourse(c) ? 'text-success' : 'text-ink'}`}>
                  {formatCoursePrice(c)}
                </span>
                <span className="block text-[10px] uppercase tracking-wide text-ink-faint font-semibold">
                  {courseTypeLabel(c)}
                </span>
              </div>
            )
          },
          {
            key: 'curriculum',
            header: 'Curriculum',
            render: (c) => (
              <div>
                <span className="font-semibold text-ink">{c.moduleCount || 0}</span>
                <span className="text-ink-soft"> modules</span>
                <span className="block text-[10px] text-ink-faint">{c.lessonCount || 0} lessons</span>
              </div>
            )
          },
          {
            key: 'students',
            header: 'Students',
            render: (c) => <span className="font-semibold text-ink">{c.enrollmentCount || 0}</span>
          },
          {
            key: 'access',
            header: 'Access Duration',
            render: () => <span className="font-medium text-ink-soft whitespace-nowrap">3 Calendar Months</span>
          },
          {
            key: 'status',
            header: 'Status',
            render: (c) => (
              <button
                type="button"
                onClick={() => handleTogglePublish(c)}
                title="Publish or unpublish this course"
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition hover:opacity-80 ${statusTone(c.status)}`}
              >
                {c.status}
              </button>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (c) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 rounded-md text-ink-faint hover:text-brand hover:bg-brand-soft transition cursor-pointer"
                  title="Edit Course & PDFs"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCourseToDelete(c._id)}
                  className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                  title="Delete Course"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Main Course Modal (Add New Course & Edit Course with Integrated PDF Section) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-surface rounded-t-xl sm:rounded-lg max-w-3xl w-full p-5 sm:p-6 space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto shadow-overlay border border-line admin-modal-in">
            {/* Modal Title */}
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {editingCourse ? 'Edit Course & Learning Materials' : 'Create New Course with PDF Materials'}
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Configure course details, add module headings, and upload study PDFs in one unified form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-ink-faint hover:text-ink-soft p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* SECTION 1: Basic Course Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wide flex items-center gap-1.5">
                  1. Course Information
                </h4>

                <div>
                  <label className="admin-label">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Production DevOps &amp; Kubernetes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="admin-label">Short Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief 1-2 sentence overview shown in cards"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="admin-input"
                  />
                </div>

                {/* Course Thumbnail Image Upload Component */}
                <div className="bg-canvas p-4 rounded-lg border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-ink text-xs">
                      Course Thumbnail Image
                    </label>
                    <span className="text-[10px] text-ink-soft">
                      JPG, PNG, WebP (Max 5MB) • Stored in MongoDB
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Thumbnail Preview Box */}
                    <div className="relative w-36 h-24 rounded-lg overflow-hidden bg-canvas border-2 border-dashed border-line flex items-center justify-center shrink-0">
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
                        <div className="text-center p-2 text-ink-faint">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                          <span className="text-[10px] block">No thumbnail</span>
                        </div>
                      )}
                    </div>

                    {/* Controls: Browse Files & Remove */}
                    <div className="space-y-2 flex-1 w-full text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy hover:bg-navy-deep text-white rounded-md cursor-pointer text-xs font-semibold shadow-sm transition">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-danger-soft hover:bg-[#fee2e2] text-danger border border-danger/20 rounded-md text-xs font-semibold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Image</span>
                          </button>
                        )}
                      </div>

                      {thumbnailFile && (
                        <p className="text-[11px] text-success font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Selected: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)} KB)
                        </p>
                      )}

                      {!thumbnailFile && thumbnailPreview && (
                        <p className="text-[10px] text-ink-soft">
                          Active thumbnail stored in MongoDB. Click "Change Thumbnail" to replace with a new image.
                        </p>
                      )}

                      {!thumbnailPreview && (
                        <p className="text-[10px] text-ink-faint">
                          Select an image from your computer to store directly in MongoDB. If left blank, the branded placeholder will be shown.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Full Curriculum Description</label>
                  <textarea
                    rows={3}
                    placeholder="Detailed explanation of the course syllabus and topics covered..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-ink">
                      Learning Objectives (What You Will Learn)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = formData.learningOutcomes ? formData.learningOutcomes.split('\n') : [];
                        lines.push('');
                        setFormData({ ...formData, learningOutcomes: lines.join('\n') });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:text-brand bg-brand-soft hover:bg-line-soft px-2.5 py-1 rounded-md transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Objective
                    </button>
                  </div>

                  {/* Individual objective items editor */}
                  <div className="space-y-2 mb-2">
                    {(formData.learningOutcomes ? formData.learningOutcomes.split('\n') : []).map((outcome, oIdx, arr) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-success-soft text-[#15803d] border border-success/20 text-xs font-bold flex items-center justify-center">
                          {oIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={outcome}
                          placeholder={`Learning outcome #${oIdx + 1} (e.g. Understand core DevOps concepts)`}
                          onChange={(e) => {
                            const newArr = [...arr];
                            newArr[oIdx] = e.target.value;
                            setFormData({ ...formData, learningOutcomes: newArr.join('\n') });
                          }}
                          className="admin-input flex-1 h-9"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newArr = arr.filter((_, i) => i !== oIdx);
                            setFormData({ ...formData, learningOutcomes: newArr.join('\n') });
                          }}
                          className="shrink-0 p-1.5 text-ink-faint hover:text-danger hover:bg-danger-soft rounded-md transition"
                          title="Remove objective"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-ink-faint mt-1">
                    Saved dynamically on the course record and rendered in the "What You Will Learn" section of the Course Detail page.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="admin-input cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Language</label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">
                      Course Video Duration *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      placeholder="Enter total course duration"
                      value={formData.videoDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          videoDuration: val === '' ? '' : Number(val),
                          duration: val ? `${val} Hours` : ''
                        });
                      }}
                      className="admin-input"
                    />
                    <p className="text-[10px] text-ink-soft mt-1">
                      Unit: Hours. This duration is displayed dynamically on the student completion certificate.
                    </p>
                  </div>

                  <div>
                    <label className="admin-label">Difficulty Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="admin-input cursor-pointer"
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
                    <label className="admin-label">Course Type</label>
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
                      className="admin-input cursor-pointer"
                    >
                      <option value="true">Free Course</option>
                      <option value="false">Paid Course</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value) || 0);
                        // A ₹0 course is a free course: keep type and price in step
                        setFormData({ ...formData, price, isFree: price === 0 });
                      }}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Discount Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.discountPrice}
                      disabled={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, discountPrice: Math.max(0, Number(e.target.value) || 0) })}
                      className="admin-input disabled:bg-canvas disabled:text-ink-faint"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Publishing Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="admin-input cursor-pointer"
                    >
                      <option value="published">Published (Visible in Catalog)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Free Preview Lessons</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.freePreviewCount !== undefined ? formData.freePreviewCount : 2}
                      onChange={(e) => setFormData({ ...formData, freePreviewCount: Math.max(0, Number(e.target.value) || 0) })}
                      className="admin-input"
                                            aria-label="Free preview lessons"
                    />
                    <p className="text-[10px] text-ink-soft mt-1">
                      First {formData.freePreviewCount || 2} lessons are unlocked for free preview without login/purchase. Remaining require purchase.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Access Window</label>
                  <input
                    type="text"
                    disabled
                    value="3 Calendar Months Access"
                    className="admin-input bg-canvas text-ink-soft font-medium"
                  />
                </div>
              </div>

              {/* SECTION 2: Course Modules & Headings */}
              <div className="space-y-3 pt-3 border-t border-line-soft">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wide flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4" /> 2. Course Modules &amp; Headings
                  </h4>
                  <button
                    type="button"
                    onClick={addModuleHeading}
                    className="text-xs font-semibold text-brand hover:text-navy flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                </div>

                <div className="space-y-2">
                  {moduleHeadings.map((heading, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-ink-faint font-semibold text-[11px] w-6 text-right">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={heading}
                        placeholder={`e.g. Module ${idx + 1}: Topic Title`}
                        onChange={(e) => updateModuleHeading(idx, e.target.value)}
                        className="admin-input flex-1 h-9 text-xs"
                      />
                      {moduleHeadings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeModuleHeading(idx)}
                          className="p-1.5 text-ink-faint hover:text-danger transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Dedicated Integrated Course Materials (PDFs) */}
              <div className="space-y-4 pt-4 border-t border-line bg-canvas p-4 rounded-lg border border-line">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-navy uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-brand" />
                      3. Course Materials &amp; Documents (PDFs)
                    </h4>
                    <p className="text-[11px] text-ink-soft">
                      Upload study sheets, lecture notes, and PDFs. These are automatically attached to this course and accessible only to approved students during their 3-month access.
                    </p>
                  </div>

                  {/* Upload button */}
                  <label className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-deep text-white px-3 py-1.5 rounded-md cursor-pointer font-semibold shadow-sm shrink-0 transition">
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
                    <p className="text-[11px] font-bold text-ink-soft uppercase">
                      Existing Uploaded Materials ({existingMaterials.length})
                    </p>
                    <div className="divide-y divide-line border border-line rounded-lg bg-surface overflow-hidden">
                      {existingMaterials.map((mat) => (
                        <div key={mat._id} className="p-3 flex items-center justify-between gap-3 hover:bg-canvas/60 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-md bg-danger-soft text-danger border border-danger/20 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink truncate">{mat.title}</p>
                              <div className="text-[10px] text-ink-faint flex items-center gap-2">
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
                              className="p-1.5 text-ink-faint hover:text-brand rounded-md hover:bg-brand-soft disabled:opacity-50 transition"
                              title="Preview PDF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMaterialAction(mat, false)}
                              disabled={busyMaterialId === mat._id}
                              className="p-1.5 text-ink-faint hover:text-brand rounded-md hover:bg-brand-soft disabled:opacity-50 transition"
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
                              className="p-1.5 text-ink-faint hover:text-warning rounded-md hover:bg-warning-soft transition"
                              title="Replace PDF File"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingMaterial(mat._id, mat.title)}
                              className="p-1.5 text-ink-faint hover:text-danger rounded-md hover:bg-danger-soft transition"
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
                    <p className="text-[11px] font-bold text-navy uppercase">
                      New PDFs Ready to Save ({pendingNewPdfs.length})
                    </p>
                    <div className="space-y-2">
                      {pendingNewPdfs.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-surface border border-brand/20 rounded-lg space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1 bg-brand-soft text-brand rounded-sm">
                                <FileText className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-semibold text-ink truncate">
                                {item.file.name} ({formatFileSize(item.file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePendingPdf(item.id)}
                              className="text-ink-faint hover:text-danger p-1 transition"
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
                              className="admin-input h-8 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Short Description (Optional)"
                              value={item.description}
                              onChange={(e) => updatePendingPdf(item.id, 'description', e.target.value)}
                              className="admin-input h-8 text-xs"
                            />
                            <select
                              value={item.moduleTag}
                              onChange={(e) => updatePendingPdf(item.id, 'moduleTag', e.target.value)}
                              className="admin-input h-8 text-xs cursor-pointer"
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
                  <div className="text-center py-6 border-2 border-dashed border-line rounded-lg space-y-1">
                    <FileText className="w-8 h-8 text-ink-faint mx-auto" />
                    <p className="text-xs text-ink-soft font-medium">No PDFs attached to this course yet</p>
                    <p className="text-[10px] text-ink-faint">
                      Click the "Upload PDFs" button above to attach notes, reference sheets, or slides.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 4: Course Reviews & Testimonials */}
              {editingCourse ? (
                <CourseReviewsSection
                  courseId={editingCourse._id}
                  courseTitle={editingCourse.title}
                  notify={notify}
                  courses={courses}
                />
              ) : (
                <div className="p-4 bg-canvas border border-line rounded-lg text-center space-y-1">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wide">
                    4. Course Reviews &amp; Testimonials
                  </h4>
                  <p className="text-xs text-ink-soft">
                    Save this new course first to begin attaching student video stories and written testimonials directly to it.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2 border border-line rounded-md bg-surface text-xs font-semibold text-ink hover:bg-canvas text-center transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="w-full sm:w-auto px-5 py-2 sm:py-2 bg-navy hover:bg-navy-deep text-white font-semibold rounded-md text-xs text-center shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 bg-navy-deep/50 admin-overlay-in flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-md w-full p-5 space-y-4 shadow-overlay border border-line admin-modal-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-warning" />
                Replace Course PDF File
              </h3>
              <button
                type="button"
                onClick={() => setReplacingMaterialId(null)}
                className="text-ink-faint hover:text-ink-soft transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-soft">
              Select a new PDF to replace the existing document. The document title and enrollment access permissions will be preserved.
            </p>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => setReplacementFile(e.target.files[0])}
                className="w-full text-xs text-ink-soft file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-deep cursor-pointer"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReplacingMaterialId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-canvas rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replacementFile}
                  className="px-4 py-2 bg-warning hover:bg-[#b45309] text-white text-xs font-semibold rounded-md shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition"
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
