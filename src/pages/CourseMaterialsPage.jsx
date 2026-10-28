import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  ExternalLink, 
  BookOpen, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import { openMaterial } from '../utils/materialAccess';

const CourseMaterialsPage = () => {
  const { notify, confirm } = useFeedback();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [busyMaterialId, setBusyMaterialId] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadModule, setUploadModule] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch course list (admin directory includes drafts and unpublished courses)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const res = await api.get('/courses/admin/list?limit=100&status=all');
        const list = res.data.data || res.data.courses || [];
        if (res.data.success && list.length > 0) {
          setCourses(list);
          setSelectedCourseId(list[0]._id);
        }
      } catch (err) {
        console.error(err);
        notify({
          type: 'error',
          title: 'Courses Fetch Error',
          message: 'Could not load courses list'
        });
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch materials whenever selectedCourseId changes
  const fetchMaterials = async (courseId) => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await api.get(`/materials/course/${courseId}`);
      if (res.data.success) {
        setMaterials(res.data.data || res.data.materials || []);
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Error loading materials',
        message: err.response?.data?.message || 'Could not fetch course materials'
      });
    } finally {
      setLoading(false);
    }
  };

  // Module names come from the Admin curriculum builder for the same course.
  const fetchModules = async (courseId) => {
    try {
      const res = await api.get(`/curriculum/courses/${courseId}/curriculum`);
      setModules((res.data.modules || []).map((m) => m.title));
    } catch (err) {
      setModules([]);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchMaterials(selectedCourseId);
      fetchModules(selectedCourseId);
      setUploadModule('');
    }
  }, [selectedCourseId]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      notify({
        type: 'error',
        title: 'Missing File',
        message: 'Please choose a document or PDF file to upload.'
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      // Field names expected by POST /materials/upload
      formData.append('courseId', selectedCourseId);
      if (uploadModule) formData.append('moduleId', uploadModule);
      formData.append('isPublished', 'true');

      // No manual Content-Type: the browser must set multipart/form-data with
      // its generated boundary for multer to parse the upload.
      const res = await api.post('/materials/upload', formData);

      if (res.data.success) {
        notify({
          type: 'success',
          title: 'File Uploaded',
          message: 'The course material has been uploaded and is available to approved students.'
        });
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDescription('');
        setUploadModule('');
        setUploadFile(null);
        fetchMaterials(selectedCourseId);
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Failed to upload material'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mat) => {
    const ok = await confirm({
      title: 'Delete Material?',
      message: `Are you sure you want to permanently delete "${mat.title}"? Students will no longer be able to download this file.`
    });

    if (!ok) return;

    try {
      const res = await api.delete(`/materials/${mat._id}`);
      if (res.data.success) {
        notify({
          type: 'success',
          title: 'Material Deleted',
          message: 'The file has been deleted.'
        });
        fetchMaterials(selectedCourseId);
      }
    } catch (err) {
      console.error(err);
      notify({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Could not delete material'
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Protected downloads need the Admin bearer header, which a plain <a href>
  // cannot send — fetch through the API client and hand the file to the browser.
  const handleOpenMaterial = async (mat, inline) => {
    setBusyMaterialId(mat._id);
    try {
      await openMaterial(mat, { inline });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Document Unavailable',
        message: err.response?.data?.message || err.message || 'Could not open this document.'
      });
    } finally {
      setBusyMaterialId(null);
    }
  };

  const selectedCourse = courses.find(c => c._id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Course Materials &amp; PDFs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload and manage study notes, reference sheets, and PDF materials accessible only to approved students during their 3-month access.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedCourseId}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs"
        >
          <Upload className="w-4 h-4" />
          Upload New Material
        </button>
      </div>

      {/* Course Selection */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" /> Select Course:
        </label>
        {coursesLoading ? (
          <span className="text-xs text-slate-400">Loading courses...</span>
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full md:max-w-md text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            Uploaded Materials ({materials.length})
          </h2>
          <span className="text-xs text-slate-500">
            {selectedCourse ? selectedCourse.title : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-sm text-slate-500">Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">No materials uploaded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add supplementary PDFs, exercises, cheat-sheets, or course notes for approved students to view and download.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Upload First Material
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((mat) => (
              <div key={mat._id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{mat.title}</h3>
                    {mat.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mat.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 flex-wrap">
                      <span>File: {mat.fileName || 'document.pdf'}</span>
                      <span>•</span>
                      <span>Size: {formatFileSize(mat.fileSize)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(mat.createdAt).toLocaleDateString()}</span>
                      {mat.module && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">{mat.module}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenMaterial(mat, true)}
                    disabled={busyMaterialId === mat._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                    title="View Document"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleOpenMaterial(mat, false)}
                    disabled={busyMaterialId === mat._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-50"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(mat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload Course Material
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Files uploaded here are strictly restricted to students who have been approved by Admin and are within their active 3-month access window.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Module 1 - Docker Architecture Cheatsheet"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summary of key CLI flags and container life cycle diagrams"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module / Section Tag (Optional)
                </label>
                {modules.length > 0 ? (
                  <select
                    value={uploadModule}
                    onChange={(e) => setUploadModule(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">Not module specific</option>
                    {modules.map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g., Module 2: Kubernetes Fundamentals"
                    value={uploadModule}
                    onChange={(e) => setUploadModule(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Modules are managed in the Curriculum Builder for this course.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File (PDF, DOCX, ZIP up to 25MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.txt,.zip"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMaterialsPage;

