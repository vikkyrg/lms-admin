import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FolderGit2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Layers,
  Check,
  Upload,
  Calendar,
  Sparkles,
  Video as VideoIcon,
  Globe,
  Clock,
  Award
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const CATEGORY_OPTIONS = [
  'DevOps',
  'Cloud Computing',
  'Kubernetes',
  'CI/CD',
  'Infrastructure Automation',
  'Monitoring',
  'Security',
  'Full Stack',
  'Other'
];

const emptyProjectForm = () => ({
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: 'DevOps',
  image: '',
  imageAlt: '',
  technologies: ['Git', 'Linux'],
  learningOutcomes: ['Understand production deployment pipelines'],
  objectives: ['Master operational problem-solving'],
  prerequisites: '',
  difficulty: 'Intermediate',
  estimatedDuration: '2-3 weeks',
  githubUrl: '',
  liveDemoUrl: '',
  videoUrl: '',
  isFeatured: false,
  status: 'published',
  displayOrder: 0
});

const ProjectsManagementPage = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    categoriesCount: 0,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('order-asc');

  // Modal and Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalItem, setViewModalItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyProjectForm());
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Dynamic Array Field Inputs
  const [techInput, setTechInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');

  const { notify } = useFeedback();

  useEffect(() => {
    fetchProjects();
  }, [categoryFilter, statusFilter, sortOption]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());
      if (sortOption) params.append('sort', sortOption);

      const res = await api.get(`/projects/admin/all?${params.toString()}`);
      setProjects(res.data.projects || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      notify({ type: 'error', message: 'Failed to load projects' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyProjectForm());
    setImageFile(null);
    setImagePreview('');
    setTechInput('');
    setOutcomeInput('');
    setObjectiveInput('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      shortDescription: item.shortDescription || '',
      description: item.description || '',
      category: item.category || 'DevOps',
      image: item.image || '',
      imageAlt: item.imageAlt || '',
      technologies: Array.isArray(item.technologies) ? [...item.technologies] : [],
      learningOutcomes: Array.isArray(item.learningOutcomes) ? [...item.learningOutcomes] : [],
      objectives: Array.isArray(item.objectives) ? [...item.objectives] : [],
      prerequisites: item.prerequisites || '',
      difficulty: item.difficulty || 'Intermediate',
      estimatedDuration: item.estimatedDuration || '2-3 weeks',
      githubUrl: item.githubUrl || '',
      liveDemoUrl: item.liveDemoUrl || '',
      videoUrl: item.videoUrl || '',
      isFeatured: !!item.isFeatured,
      status: item.status || 'published',
      displayOrder: item.displayOrder ?? 0
    });
    setImageFile(null);
    setImagePreview(item.image || '');
    setTechInput('');
    setOutcomeInput('');
    setObjectiveInput('');
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

  // Technologies management
  const addTechnology = () => {
    const trimmed = techInput.trim();
    if (!trimmed) return;
    if (formData.technologies.includes(trimmed)) {
      notify({ type: 'info', message: 'Technology already added' });
      return;
    }
    setFormData({
      ...formData,
      technologies: [...formData.technologies, trimmed]
    });
    setTechInput('');
  };

  const removeTechnology = (index) => {
    const updated = formData.technologies.filter((_, i) => i !== index);
    setFormData({ ...formData, technologies: updated });
  };

  // Learning Outcomes management
  const addOutcome = () => {
    const trimmed = outcomeInput.trim();
    if (!trimmed) return;
    setFormData({
      ...formData,
      learningOutcomes: [...formData.learningOutcomes, trimmed]
    });
    setOutcomeInput('');
  };

  const removeOutcome = (index) => {
    const updated = formData.learningOutcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, learningOutcomes: updated });
  };

  // Objectives management
  const addObjective = () => {
    const trimmed = objectiveInput.trim();
    if (!trimmed) return;
    setFormData({
      ...formData,
      objectives: [...formData.objectives, trimmed]
    });
    setObjectiveInput('');
  };

  const removeObjective = (index) => {
    const updated = formData.objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, objectives: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.shortDescription.trim() || !formData.description.trim()) {
      notify({ type: 'error', message: 'Please provide Title, Short Description, and Detailed Description' });
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('title', formData.title.trim());
      if (formData.slug.trim()) data.append('slug', formData.slug.trim());
      data.append('shortDescription', formData.shortDescription.trim());
      data.append('description', formData.description.trim());
      data.append('category', formData.category.trim());
      data.append('imageAlt', formData.imageAlt.trim());
      data.append('technologies', JSON.stringify(formData.technologies));
      data.append('learningOutcomes', JSON.stringify(formData.learningOutcomes));
      data.append('objectives', JSON.stringify(formData.objectives));
      data.append('prerequisites', formData.prerequisites.trim());
      data.append('difficulty', formData.difficulty);
      data.append('estimatedDuration', formData.estimatedDuration.trim());
      data.append('githubUrl', formData.githubUrl.trim());
      data.append('liveDemoUrl', formData.liveDemoUrl.trim());
      data.append('videoUrl', formData.videoUrl.trim());
      data.append('isFeatured', formData.isFeatured);
      data.append('status', formData.status);
      data.append('displayOrder', formData.displayOrder);

      if (imageFile) {
        data.append('imageFile', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingItem) {
        await api.put(`/projects/${editingItem._id}`, data);
        notify({ type: 'success', message: 'Project updated successfully' });
      } else {
        await api.post('/projects', data);
        notify({ type: 'success', message: 'Project created successfully' });
      }

      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Save project error:', err);
      notify({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save project'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/projects/${item._id}/status`, { status: newStatus });
      notify({
        type: 'success',
        message: `Project ${newStatus === 'published' ? 'published' : 'unpublished'}`
      });
      fetchProjects();
    } catch (err) {
      console.error('Toggle status error:', err);
      notify({ type: 'error', message: 'Failed to update project status' });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/projects/${itemToDelete._id}`);
      notify({ type: 'success', message: 'Project deleted successfully' });
      setItemToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error('Delete project error:', err);
      notify({ type: 'error', message: 'Failed to delete project' });
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
            <FolderGit2 className="w-6 h-6 text-indigo-600" />
            Project Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage student projects, technologies, learning outcomes, and project showcases.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Dashboard Statistics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Total Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.total}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              In Database
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Published Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.published}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live on Site
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Draft Projects
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.draft}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Unpublished
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Project Categories
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.categoriesCount}</span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Categories
            </span>
          </div>
        </div>
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
            placeholder="Search projects by title, tech, or description..."
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
              {CATEGORY_OPTIONS.map((cat) => (
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="order-asc">Display Order (Low to High)</option>
              <option value="order-desc">Display Order (High to Low)</option>
              <option value="title-asc">Title (A - Z)</option>
              <option value="newest">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 pl-6">Project Image & Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Technologies</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Order</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm">Loading projects...</p>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 space-y-3">
                    <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="font-bold text-gray-700">No Projects Found</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      {search || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'Click "Add Project" above to create your first portfolio project.'}
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    {/* Project Image & Title */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.imageAlt || item.title}
                            className="w-14 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                            <FolderGit2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                          <span className="text-[11px] text-gray-400 block truncate font-mono">
                            /{item.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                        {item.category}
                      </span>
                    </td>

                    {/* Technologies */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.technologies && item.technologies.length > 0 ? (
                          item.technologies.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">None</span>
                        )}
                        {item.technologies && item.technologies.length > 3 && (
                          <span className="text-[10px] font-semibold text-gray-400">
                            +{item.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'published' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <span>{item.status === 'published' ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Order */}
                    <td className="p-4 text-center font-mono text-xs text-gray-500">
                      #{item.displayOrder ?? 0}
                    </td>

                    {/* Last Updated */}
                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewModalItem(item)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Project"
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

      {/* View Project Modal */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  {viewModalItem.category}
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl">
                  {viewModalItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewModalItem.image && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={viewModalItem.image}
                  alt={viewModalItem.imageAlt || viewModalItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Short Description
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {viewModalItem.shortDescription}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Detailed Description
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {viewModalItem.description}
              </p>
            </div>

            {/* Tech tags */}
            {viewModalItem.technologies?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Technologies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewModalItem.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md text-xs font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Outcomes */}
            {viewModalItem.learningOutcomes?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Learning Outcomes
                </h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  {viewModalItem.learningOutcomes.map((out, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                {editingItem ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              {/* Project Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Automated CI/CD Application Delivery"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Custom Slug (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. automated-cicd-delivery (auto-generated if empty)"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Category, Difficulty & Estimated Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Project Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    placeholder="e.g. 2-3 weeks"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Short Description (For Cards) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={400}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Summary displayed on portfolio cards (max 400 characters)..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Description (For Project Details Page) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Full technical overview of architecture, pipeline setup, and challenges solved..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Technologies Used */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Technologies Used
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechnology();
                      }
                    }}
                    placeholder="e.g. Docker, Jenkins, Kubernetes, Terraform"
                    className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTechnology}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Add Tech
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-6">
                  {formData.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTechnology(idx)}
                        className="hover:text-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Learning Outcomes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Learning Outcomes
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOutcome();
                      }
                    }}
                    placeholder="e.g. Understand automated deployment pipelines"
                    className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addOutcome}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Add Outcome
                  </button>
                </div>
                <div className="space-y-1.5">
                  {formData.learningOutcomes.map((out, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{out}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOutcome(idx)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload & Alt Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Project Image Thumbnail
                  </label>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-indigo-400 shrink-0">
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
                      <div className="w-20 h-14 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    placeholder="e.g. CI/CD Architecture Flow Diagram"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Links: Github, Live Demo, Video */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    GitHub URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.liveDemoUrl}
                    onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
                    placeholder="https://demo..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Status, Display Order, and Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="published">Published (Visible on site)</option>
                    <option value="draft">Draft (Hidden from public)</option>
                  </select>
                </div>

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
                </div>

                <div className="flex items-center sm:pt-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Featured Project</span>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Project' : 'Create Project'}
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
            <h3 className="font-extrabold text-gray-900 text-base">Delete Project</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete &quot;{itemToDelete.title}&quot;? This action cannot be undone.
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

export default ProjectsManagementPage;
