import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Edit, ChevronUp, ChevronDown, X, Download, Upload, Video } from 'lucide-react';
import { ConfirmDialog, useFeedback } from '../components/Feedback';

const emptyLesson = {
  title: '',
  videoUrl: '',
  video: null,
  duration: 10,
  description: '',
  isPreview: false,
  resourcesText: '[]'
};

const CurriculumBuilderPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  // Inline module edit
  const [editingModule, setEditingModule] = useState(null); // { _id, title, description }

  // Lesson modal (create + edit)
  const [lessonModal, setLessonModal] = useState({ open: false, moduleId: '', editId: '' });
  const [lessonData, setLessonData] = useState(emptyLesson);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const mediaOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
  const apiOrigin = mediaOrigin ? `${mediaOrigin}/api/v1` : '/api/v1';

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { notify } = useFeedback();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCurriculum(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses?limit=100');
      setCourses(res.data.courses || []);
      if (res.data.courses?.length > 0) {
        setSelectedCourseId(res.data.courses[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurriculum = async (courseId) => {
    setLoading(true);
    try {
      const res = await api.get(`/curriculum/courses/${courseId}/curriculum`);
      setModules(res.data.modules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Module actions ----------
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      await api.post('/curriculum/modules', {
        title: moduleTitle,
        description: moduleDescription,
        courseId: selectedCourseId,
        order: modules.length + 1
      });
      setModuleTitle('');
      setModuleDescription('');
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  const startEditModule = (m) => {
    setEditingModule({ _id: m._id, title: m.title, description: m.description || '' });
  };

  const saveEditModule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/curriculum/modules/${editingModule._id}`, {
        title: editingModule.title,
        description: editingModule.description
      });
      setEditingModule(null);
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  const reorderModule = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= modules.length) return;
    const arr = [...modules];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    try {
      await api.put(`/curriculum/modules/${arr[index]._id}`, { order: index + 1 });
      await api.put(`/curriculum/modules/${arr[target]._id}`, { order: target + 1 });
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteModule = (id) => setPendingDelete({ type: 'module', id });

  // ---------- Lesson actions ----------
  const openAddLesson = (moduleId) => {
    setLessonData(emptyLesson);
    setLessonModal({ open: true, moduleId, editId: '' });
  };

  const openEditLesson = (moduleId, lesson) => {
    setLessonData({
      title: lesson.title,
      videoUrl: lesson.videoUrl || '',
      video: lesson.video || null,
      duration: lesson.duration || 0,
      description: lesson.description || '',
      isPreview: !!lesson.isPreview,
      resourcesText: JSON.stringify(lesson.resources || [], null, 2)
    });
    setLessonModal({ open: true, moduleId, editId: lesson._id });
  };

  const closeLessonModal = () => {
    setLessonModal({ open: false, moduleId: '', editId: '' });
    setLessonData(emptyLesson);
    setVideoFile(null);
    setVideoUploadProgress(0);
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    let resources = [];
    try {
      resources = lessonData.resourcesText.trim() ? JSON.parse(lessonData.resourcesText) : [];
      if (!Array.isArray(resources)) throw new Error('Resources must be a JSON array');
    } catch (parseErr) {
      notify('Invalid resources JSON. Use an array like [{"title":"Notes","fileUrl":"https://...","fileType":"pdf"}]');
      return;
    }

    const payload = {
      title: lessonData.title,
      description: lessonData.description,
      videoUrl: lessonData.videoUrl,
      duration: Number(lessonData.duration) || 0,
      isPreview: lessonData.isPreview,
      resources
    };

    try {
      if (lessonModal.editId) {
        const response = await api.put(`/curriculum/lessons/${lessonModal.editId}`, payload);
        if (videoFile) {
          await uploadLessonVideo(response.data.lesson._id, lessonModal.moduleId, videoFile);
        }
      } else {
        const module = modules.find((m) => m._id === lessonModal.moduleId);
        const response = await api.post('/curriculum/lessons', {
          ...payload,
          courseId: selectedCourseId,
          moduleId: lessonModal.moduleId,
          order: (module?.lessons?.length || 0) + 1
        });
        if (videoFile) {
          await uploadLessonVideo(response.data.lesson._id, lessonModal.moduleId, videoFile);
        }
      }
      closeLessonModal();
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  const uploadLessonVideo = async (lessonId, moduleId, file) => {
    if (file.size > 500 * 1024 * 1024) {
      throw new Error('Video exceeds the 500 MB size limit');
    }
    const formData = new FormData();
    formData.append('video', file);
    await api.post(`/curriculum/courses/${selectedCourseId}/modules/${moduleId}/lessons/${lessonId}/video`, formData, {
      onUploadProgress: (event) => {
        if (event.total) setVideoUploadProgress(Math.round((event.loaded * 100) / event.total));
      }
    });
    notify('Video uploaded successfully', 'success');
  };

  const videoPreviewUrl = lessonData.video?.fileId
    ? `${apiOrigin}/curriculum/courses/${selectedCourseId}/lessons/${lessonModal.editId}/video?token=${encodeURIComponent(localStorage.getItem('admin_token') || '')}`
    : lessonData.videoUrl;

  const removeLessonVideo = async () => {
    if (!lessonModal.editId || !lessonData.videoUrl) return;
    try {
      await api.delete(`/curriculum/courses/${selectedCourseId}/modules/${lessonModal.moduleId}/lessons/${lessonModal.editId}/video`);
      setLessonData((current) => ({ ...current, videoUrl: '', video: null }));
      notify('Video removed successfully', 'success');
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || 'Could not remove video');
    }
  };

  const reorderLesson = async (moduleId, index, dir) => {
    const target = index + dir;
    const module = modules.find((m) => m._id === moduleId);
    const lessons = [...(module?.lessons || [])];
    if (target < 0 || target >= lessons.length) return;
    [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
    try {
      await api.put(`/curriculum/lessons/${lessons[index]._id}`, { order: index + 1 });
      await api.put(`/curriculum/lessons/${lessons[target]._id}`, { order: target + 1 });
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteLesson = (id) => setPendingDelete({ type: 'lesson', id });

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/curriculum/${pendingDelete.type === 'module' ? 'modules' : 'lessons'}/${pendingDelete.id}`);
      setPendingDelete(null);
      fetchCurriculum(selectedCourseId);
    } catch (err) {
      notify(err.response?.data?.message || err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'module' ? 'Delete module?' : 'Delete lesson?'}
        description={pendingDelete?.type === 'module' ? 'This will also remove all lessons in the module.' : 'This lesson will be permanently removed.'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Curriculum Builder</h1>
        <p className="text-xs text-gray-500 mt-1">Add, edit, reorder and delete modules, video lessons, topics and downloadable resources.</p>
      </div>

      {/* Select Course */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs font-bold text-gray-700 shrink-0">Select Target Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:flex-1 sm:max-w-md bg-gray-50 border border-gray-300 text-xs rounded-xl p-2 font-semibold text-gray-800"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Add Module Form */}
      <form onSubmit={handleAddModule} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="New Module Title (e.g. Module 3: Continuous Integration)"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Module
          </button>
        </div>
        <textarea
          rows={2}
          placeholder="Module description (optional) — shown under the module heading on the course page"
          value={moduleDescription}
          onChange={(e) => setModuleDescription(e.target.value)}
          className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </form>

      {/* Modules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading curriculum...</div>
        ) : modules.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border text-center text-gray-500 text-xs">
            No modules added to this course yet. Use the field above to add the first module.
          </div>
        ) : (
          modules.map((m, mIdx) => (
            <div key={m._id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4 shadow-xs">
              {/* Module header: view or inline edit */}
              {editingModule?._id === m._id ? (
                <form onSubmit={saveEditModule} className="space-y-3 border-b pb-3">
                  <input
                    type="text"
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs font-semibold"
                  />
                  <textarea
                    rows={2}
                    value={editingModule.description}
                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                    placeholder="Module description"
                    className="w-full p-2 border rounded-xl text-xs"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg">Save</button>
                    <button type="button" onClick={() => setEditingModule(null)} className="text-xs border px-3 py-1.5 rounded-lg text-gray-600">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b pb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-gray-900">{m.title}</h3>
                    {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openAddLesson(m._id)}
                      className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Lesson
                    </button>
                    <button onClick={() => startEditModule(m)} title="Edit module" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorderModule(mIdx, -1)} disabled={mIdx === 0} title="Move up" className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorderModule(mIdx, 1)} disabled={mIdx === modules.length - 1} title="Move down" className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg disabled:opacity-30">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteModule(m._id)} title="Delete module" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lessons within module */}
              <div className="space-y-2">
                {(m.lessons || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No lessons in this module.</p>
                ) : (
                  m.lessons.map((lesson, lIdx) => (
                    <div key={lesson._id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-800">{lesson.title}</span>
                        {lesson.isPreview && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Preview Free</span>
                        )}
                        {lesson.resources?.length > 0 && (
                          <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1">
                            <Download className="h-3 w-3" /> {lesson.resources.length}
                          </span>
                        )}
                        {lesson.videoUrl && (
                          <p className="text-[10px] text-emerald-600 truncate mt-0.5">Video: {lesson.video?.originalName || 'Uploaded video'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-gray-400 mr-1">{lesson.duration}m</span>
                        <button onClick={() => reorderLesson(m._id, lIdx, -1)} disabled={lIdx === 0} title="Move up" className="p-1 text-gray-400 hover:text-gray-800 rounded disabled:opacity-30">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => reorderLesson(m._id, lIdx, 1)} disabled={lIdx === m.lessons.length - 1} title="Move down" className="p-1 text-gray-400 hover:text-gray-800 rounded disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => openEditLesson(m._id, lesson)} title="Edit lesson" className="p-1 text-gray-400 hover:text-indigo-600 rounded">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson._id)} title="Delete lesson" className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Modal (create / edit) */}
      {lessonModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900">{lessonModal.editId ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <button onClick={closeLessonModal} className="p-1 text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmitLesson} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  placeholder="1. Introduction to Route Controllers"
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Topic Video</label>
                <div className="rounded-xl border border-dashed border-slate-300 p-3 space-y-2">
                  {lessonData.videoUrl ? (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-700">
                      <Video className="h-4 w-4" /> Existing video attached
                      <button type="button" onClick={removeLessonVideo} className="ml-auto text-red-600 font-semibold">Remove</button>
                    </div>
                  ) : <p className="text-[11px] text-slate-500">No video uploaded for this lesson.</p>}
                  {videoPreviewUrl && (
                    <video
                      key={videoPreviewUrl}
                      controls
                      preload="metadata"
                      className="w-full max-h-44 rounded-lg bg-black"
                      src={videoPreviewUrl}
                    />
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#173563] px-3 py-2 text-white font-semibold">
                    <Upload className="h-4 w-4" /> {lessonData.videoUrl ? 'Replace video' : 'Upload video'}
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                  </label>
                  {videoFile && <p className="text-[11px] text-slate-600">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>}
                  {videoUploadProgress > 0 && videoUploadProgress < 100 && <p className="text-[11px] text-[#3F6FA8]">Uploading: {videoUploadProgress}%</p>}
                  <p className="text-[10px] text-gray-400">MP4 or WebM, maximum 500 MB. The video is saved to this topic only.</p>
                </div>
                <input
                  type="text"
                  value={lessonData.videoUrl}
                  onChange={(e) => setLessonData({ ...lessonData, videoUrl: e.target.value })}
                  placeholder="Optional external video URL"
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={lessonData.duration}
                    onChange={(e) => setLessonData({ ...lessonData, duration: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Allow Public Preview?</label>
                  <select
                    value={lessonData.isPreview ? 'true' : 'false'}
                    onChange={(e) => setLessonData({ ...lessonData, isPreview: e.target.value === 'true' })}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="false">No (Enrolled Only)</option>
                    <option value="true">Yes (Public Preview)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lesson Description &amp; Notes</label>
                <textarea
                  rows={3}
                  value={lessonData.description}
                  onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Downloadable Resources (JSON array)</label>
                <textarea
                  rows={3}
                  value={lessonData.resourcesText}
                  onChange={(e) => setLessonData({ ...lessonData, resourcesText: e.target.value })}
                  placeholder='[{"title":"Lab Sheet","fileUrl":"https://.../lab.pdf","fileType":"pdf"}]'
                  className="w-full p-2 border rounded-xl font-mono text-[11px]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Each item: title, fileUrl, fileType. Leave [] for none.</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={closeLessonModal}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                  {lessonModal.editId ? 'Update Lesson' : 'Save Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumBuilderPage;
