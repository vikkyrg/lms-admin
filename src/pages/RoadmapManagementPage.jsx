import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import TechIcon from '../components/TechIcon';
import {
  Compass,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Eye,
  ChevronUp,
  ChevronDown,
  Layers,
  Cloud,
  Workflow,
  Award,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
  Sliders,
  Check,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const RoadmapManagementPage = () => {
  const { notify } = useFeedback();

  const [activeTab, setActiveTab] = useState('stages'); // 'overview' | 'stages' | 'cloud' | 'workflow' | 'projects'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roadmap, setRoadmap] = useState(null);

  // Edit Stage Modal / Form
  const [stageModal, setStageModal] = useState({ open: false, index: -1, data: null });
  // Edit Workflow Step Modal
  const [stepModal, setStepModal] = useState({ open: false, index: -1, data: null });
  // Edit Project Modal
  const [projectModal, setProjectModal] = useState({ open: false, index: -1, data: null });

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roadmap/devops-roadmap');
      if (res.data?.roadmap) {
        setRoadmap(res.data.roadmap);
      }
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to load roadmap data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!roadmap) return;
    try {
      setSaving(true);
      const res = await api.put('/roadmap/devops-roadmap', roadmap);
      if (res.data?.roadmap) {
        setRoadmap(res.data.roadmap);
      }
      notify('DevOps learning roadmap successfully saved to database!', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save roadmap changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset the entire roadmap to standard default curriculum? Any custom edits will be replaced.')) {
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/roadmap/reset', { slug: 'devops-roadmap' });
      if (res.data?.roadmap) {
        setRoadmap(res.data.roadmap);
      }
      notify('Roadmap reset to default curriculum successfully', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to reset roadmap', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper stage reordering
  const moveStage = (index, dir) => {
    const list = [...(roadmap.stages || [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    // update order
    list.forEach((s, idx) => { s.order = idx + 1; });
    setRoadmap({ ...roadmap, stages: list });
  };

  const deleteStage = (index) => {
    if (!window.confirm('Delete this learning stage?')) return;
    const list = roadmap.stages.filter((_, idx) => idx !== index);
    list.forEach((s, idx) => { s.order = idx + 1; });
    setRoadmap({ ...roadmap, stages: list });
  };

  const saveStageModal = () => {
    const { index, data } = stageModal;
    const list = [...(roadmap.stages || [])];
    if (index >= 0) {
      list[index] = data;
    } else {
      data.order = list.length + 1;
      list.push(data);
    }
    setRoadmap({ ...roadmap, stages: list });
    setStageModal({ open: false, index: -1, data: null });
  };

  // Workflow steps helpers
  const saveStepModal = () => {
    const { index, data } = stepModal;
    const list = [...(roadmap.workflowSteps || [])];
    if (index >= 0) {
      list[index] = data;
    } else {
      data.order = list.length + 1;
      data.stepNumber = list.length + 1;
      list.push(data);
    }
    setRoadmap({ ...roadmap, workflowSteps: list });
    setStepModal({ open: false, index: -1, data: null });
  };

  const deleteWorkflowStep = (index) => {
    if (!window.confirm('Delete this workflow step?')) return;
    const list = roadmap.workflowSteps.filter((_, idx) => idx !== index);
    list.forEach((s, idx) => {
      s.order = idx + 1;
      s.stepNumber = idx + 1;
    });
    setRoadmap({ ...roadmap, workflowSteps: list });
  };

  // Project helpers
  const saveProjectModal = () => {
    const { index, data } = projectModal;
    const list = [...(roadmap.projects || [])];
    if (index >= 0) {
      list[index] = data;
    } else {
      data.order = list.length + 1;
      list.push(data);
    }
    setRoadmap({ ...roadmap, projects: list });
    setProjectModal({ open: false, index: -1, data: null });
  };

  const moveProject = (index, dir) => {
    const list = [...(roadmap.projects || [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    list.forEach((p, idx) => { p.order = idx + 1; });
    setRoadmap({ ...roadmap, projects: list });
  };

  const deleteProject = (index) => {
    if (!window.confirm('Delete this project card?')) return;
    const list = roadmap.projects.filter((_, idx) => idx !== index);
    list.forEach((p, idx) => { p.order = idx + 1; });
    setRoadmap({ ...roadmap, projects: list });
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="animate-spin h-8 w-8 border-3 border-brand border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-ink-soft font-semibold">Loading DevOps Roadmap configuration...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-red-600 font-bold">Failed to load roadmap data from server.</p>
        <button
          type="button"
          onClick={fetchRoadmap}
          className="px-4 py-2 bg-navy text-white rounded-md text-xs font-bold hover:bg-navy-deep transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-lg border border-line shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-widest">
            <Compass className="w-4 h-4" /> Curriculum Management
          </div>
          <h1 className="text-2xl font-bold text-ink mt-1">
            DevOps Learning Roadmap Manager
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Configure learning stages, separate AWS & Azure cloud paths, CI/CD pipeline workflow, and hands-on projects.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="http://localhost:5173/roadmap"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-md border border-line bg-canvas text-ink hover:bg-line-soft text-xs font-bold transition flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Page</span>
            <ExternalLink className="w-3 h-3 text-ink-faint" />
          </a>

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="px-3.5 py-2 rounded-md border border-line bg-canvas hover:bg-danger-soft hover:text-danger text-ink-soft text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reset to default canonical curriculum"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 rounded-md bg-navy hover:bg-navy-deep text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'stages', label: '8 Learning Stages', icon: Layers, count: roadmap.stages?.length },
          { id: 'cloud', label: 'Cloud Paths (AWS & Azure)', icon: Cloud },
          { id: 'workflow', label: 'CI/CD Workflow Diagram', icon: Workflow, count: roadmap.workflowSteps?.length },
          { id: 'projects', label: '5 DevOps Projects', icon: Award, count: roadmap.projects?.length },
          { id: 'overview', label: 'Hero & CTA Settings', icon: Sliders }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-navy text-white shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-line-soft'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-navy-deep text-white' : 'bg-line-soft text-ink'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: 8 LEARNING STAGES */}
      {activeTab === 'stages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">
              Curriculum Stages ({roadmap.stages?.length || 0})
            </h2>
            <button
              type="button"
              onClick={() =>
                setStageModal({
                  open: true,
                  index: -1,
                  data: {
                    stageNumber: `Stage 0${(roadmap.stages?.length || 0) + 1}`,
                    title: 'New Learning Stage',
                    shortDescription: 'Comprehensive learning module description.',
                    tools: ['Linux', 'Git'],
                    topics: ['Core Architecture', 'Hands-on Lab'],
                    order: (roadmap.stages?.length || 0) + 1,
                    isEnabled: true
                  }
                })
              }
              className="px-3.5 py-2 rounded-md bg-navy hover:bg-navy-deep text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stage
            </button>
          </div>

          <div className="grid gap-4">
            {(roadmap.stages || []).map((stage, idx) => (
              <div
                key={stage.stageNumber || idx}
                className="bg-surface rounded-lg border border-line p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-navy-deep text-accent text-[10px] font-bold uppercase tracking-wider">
                      {stage.stageNumber}
                    </span>
                    <h3 className="text-base font-bold text-ink truncate">
                      {stage.title}
                    </h3>
                    {!stage.isEnabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-line-soft text-ink-soft">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft line-clamp-1">
                    {stage.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(stage.tools || []).map((t, tIdx) => (
                      <TechIcon key={tIdx} name={t} size={13} showLabel={true} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => moveStage(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg border border-line text-ink-soft hover:bg-canvas disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(idx, 1)}
                    disabled={idx === roadmap.stages.length - 1}
                    className="p-1.5 rounded-lg border border-line text-ink-soft hover:bg-canvas disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageModal({ open: true, index: idx, data: { ...stage } })}
                    className="px-3 py-1.5 rounded-lg bg-line-soft hover:bg-line-soft text-ink text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStage(idx)}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger-soft transition cursor-pointer"
                    title="Delete stage"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CLOUD PATHS (AWS & AZURE) */}
      {activeTab === 'cloud' && roadmap.cloudPaths && (
        <div className="space-y-6">
          <div className="bg-warning-soft border border-warning/20 rounded-lg p-4 text-xs text-[#7a4d06] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-warning" /> Dedicated Cloud Learning Paths
            </p>
            <p>
              AWS and Azure are presented as separate, distinct tracks in Stage 07. Edit both tracks below to keep their tools and topics accurate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AWS Form */}
            <div className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-line-soft pb-3">
                <TechIcon name="AWS" size={24} />
                <h3 className="font-bold text-ink text-base">AWS Cloud Learning Path</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Path Title
                </label>
                <input
                  type="text"
                  value={roadmap.cloudPaths.aws.title}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        aws: { ...roadmap.cloudPaths.aws, title: e.target.value }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={roadmap.cloudPaths.aws.description}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        aws: { ...roadmap.cloudPaths.aws, description: e.target.value }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Syllabus Topics (One per line)
                </label>
                <textarea
                  rows={7}
                  value={(roadmap.cloudPaths.aws.topics || []).join('\n')}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        aws: {
                          ...roadmap.cloudPaths.aws,
                          topics: e.target.value.split('\n').filter(Boolean)
                        }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs font-mono border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
            </div>

            {/* Azure Form */}
            <div className="bg-surface rounded-lg border border-line p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-line-soft pb-3">
                <TechIcon name="Azure" size={24} />
                <h3 className="font-bold text-ink text-base">Azure Cloud Learning Path</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Path Title
                </label>
                <input
                  type="text"
                  value={roadmap.cloudPaths.azure.title}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        azure: { ...roadmap.cloudPaths.azure, title: e.target.value }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={roadmap.cloudPaths.azure.description}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        azure: { ...roadmap.cloudPaths.azure, description: e.target.value }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                  Syllabus Topics (One per line)
                </label>
                <textarea
                  rows={7}
                  value={(roadmap.cloudPaths.azure.topics || []).join('\n')}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      cloudPaths: {
                        ...roadmap.cloudPaths,
                        azure: {
                          ...roadmap.cloudPaths.azure,
                          topics: e.target.value.split('\n').filter(Boolean)
                        }
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs font-mono border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: WORKFLOW STEPS */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">
                End-to-End DevOps Workflow Nodes ({roadmap.workflowSteps?.length || 0})
              </h2>
              <p className="text-xs text-ink-soft">
                These steps power the interactive CI/CD pipeline diagram on the public roadmap.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setStepModal({
                  open: true,
                  index: -1,
                  data: {
                    stepNumber: (roadmap.workflowSteps?.length || 0) + 1,
                    title: 'New Pipeline Step',
                    subtitle: 'Operational Role',
                    category: 'Continuous Integration',
                    description: 'Automated step description explaining role in pipeline.',
                    tools: ['Jenkins', 'Docker'],
                    order: (roadmap.workflowSteps?.length || 0) + 1
                  }
                })
              }
              className="px-3.5 py-2 rounded-md bg-navy hover:bg-navy-deep text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          </div>

          <div className="grid gap-3">
            {(roadmap.workflowSteps || []).map((step, idx) => (
              <div
                key={step.stepNumber || idx}
                className="bg-surface rounded-lg border border-line p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-navy-deep text-accent font-bold text-xs flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-ink truncate">
                      {step.title} <span className="text-xs font-normal text-ink-faint">({step.category})</span>
                    </h3>
                    <p className="text-xs text-ink-soft line-clamp-1">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-1">
                    {(step.tools || []).map((t, tIdx) => (
                      <TechIcon key={tIdx} name={t} size={12} showLabel={false} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStepModal({ open: true, index: idx, data: { ...step } })}
                    className="p-1.5 text-ink-soft hover:bg-line-soft rounded-lg cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWorkflowStep(idx)}
                    className="p-1.5 text-danger hover:bg-danger-soft rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 5 DEVOPS PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">
              Hands-On DevOps Projects ({roadmap.projects?.length || 0})
            </h2>
            <button
              type="button"
              onClick={() =>
                setProjectModal({
                  open: true,
                  index: -1,
                  data: {
                    projectNumber: `Project 0${(roadmap.projects?.length || 0) + 1}`,
                    title: 'New Hands-On Project',
                    description: 'Build and deploy enterprise workloads with automation.',
                    technologies: ['Docker', 'Terraform', 'Kubernetes'],
                    difficulty: 'Intermediate',
                    learningOutcomes: ['Configured production infrastructure', 'Automated CI/CD deployments'],
                    order: (roadmap.projects?.length || 0) + 1,
                    isEnabled: true
                  }
                })
              }
              className="px-3.5 py-2 rounded-md bg-navy hover:bg-navy-deep text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(roadmap.projects || []).map((project, idx) => (
              <div
                key={project.projectNumber || idx}
                className="bg-surface rounded-lg border border-line p-5 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-navy-deep text-accent">
                      {project.projectNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-line-soft text-ink">
                      {project.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-ink-soft line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(project.technologies || []).map((t, tIdx) => (
                      <TechIcon key={tIdx} name={t} size={12} showLabel={true} />
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-line-soft flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveProject(idx, -1)}
                      className="p-1 rounded text-ink-soft hover:text-ink disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (roadmap.projects?.length || 0) - 1}
                      onClick={() => moveProject(idx, 1)}
                      className="p-1 rounded text-ink-soft hover:text-ink disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectModal({ open: true, index: idx, data: { ...project } })}
                      className="px-3 py-1.5 rounded-lg bg-line-soft hover:bg-line-soft text-ink text-xs font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(idx)}
                      className="p-1.5 text-danger hover:bg-danger-soft rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OVERVIEW & CTA SETTINGS */}
      {activeTab === 'overview' && (
        <div className="bg-surface rounded-lg border border-line p-6 space-y-6 shadow-sm max-w-3xl">
          <h2 className="text-base font-bold text-ink border-b border-line-soft pb-3">
            Header, Hero & Global CTA Settings
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-ink uppercase tracking-wider mb-1">
                Eyebrow Subtitle
              </label>
              <input
                type="text"
                value={roadmap.eyebrow}
                onChange={(e) => setRoadmap({ ...roadmap, eyebrow: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>

            <div>
              <label className="block font-bold text-ink uppercase tracking-wider mb-1">
                Hero Heading
              </label>
              <input
                type="text"
                value={roadmap.heading}
                onChange={(e) => setRoadmap({ ...roadmap, heading: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>

            <div>
              <label className="block font-bold text-ink uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={roadmap.description}
                onChange={(e) => setRoadmap({ ...roadmap, description: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-ink uppercase tracking-wider mb-1">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  value={roadmap.primaryCta?.text}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      primaryCta: { ...roadmap.primaryCta, text: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>

              <div>
                <label className="block font-bold text-ink uppercase tracking-wider mb-1">
                  Primary CTA Link
                </label>
                <input
                  type="text"
                  value={roadmap.primaryCta?.link}
                  onChange={(e) =>
                    setRoadmap({
                      ...roadmap,
                      primaryCta: { ...roadmap.primaryCta, link: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 border border-line rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line-soft">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roadmap.isEnabled}
                  onChange={(e) => setRoadmap({ ...roadmap, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-brand"
                />
                <span className="font-bold text-ink text-sm">
                  Enable Public DevOps Roadmap Section
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STAGE MODAL */}
      {stageModal.open && stageModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/50 backdrop-blur-xs">
          <div className="bg-surface rounded-lg border border-line shadow-overlay max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {stageModal.index >= 0 ? 'Edit Learning Stage' : 'Add New Stage'}
              </h3>
              <button
                type="button"
                onClick={() => setStageModal({ open: false, index: -1, data: null })}
                className="p-1.5 text-ink-faint hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1">Stage Number</label>
                  <input
                    type="text"
                    value={stageModal.data.stageNumber}
                    onChange={(e) =>
                      setStageModal({
                        ...stageModal,
                        data: { ...stageModal.data, stageNumber: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-ink mb-1">Stage Title</label>
                  <input
                    type="text"
                    value={stageModal.data.title}
                    onChange={(e) =>
                      setStageModal({
                        ...stageModal,
                        data: { ...stageModal.data, title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={stageModal.data.shortDescription}
                  onChange={(e) =>
                    setStageModal({
                      ...stageModal,
                      data: { ...stageModal.data, shortDescription: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Tools & Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={(stageModal.data.tools || []).join(', ')}
                  onChange={(e) =>
                    setStageModal({
                      ...stageModal,
                      data: {
                        ...stageModal.data,
                        tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Docker, Kubernetes, Helm"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Learning Objectives (One per line)
                </label>
                <textarea
                  rows={4}
                  value={(stageModal.data.learningObjectives || []).join('\n')}
                  onChange={(e) =>
                    setStageModal({
                      ...stageModal,
                      data: {
                        ...stageModal.data,
                        learningObjectives: e.target.value.split('\n').filter(Boolean)
                      }
                    })
                  }
                  placeholder="Master Linux shell scripting&#10;Configure multi-tier network topologies"
                  className="w-full px-3 py-2 font-mono border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Curriculum Topics (One per line)
                </label>
                <textarea
                  rows={6}
                  value={(stageModal.data.topics || []).join('\n')}
                  onChange={(e) =>
                    setStageModal({
                      ...stageModal,
                      data: {
                        ...stageModal.data,
                        topics: e.target.value.split('\n').filter(Boolean)
                      }
                    })
                  }
                  className="w-full px-3 py-2 font-mono border rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStageModal({ open: false, index: -1, data: null })}
                className="px-4 py-2 rounded-lg text-ink-soft text-xs font-bold hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStageModal}
                className="px-4 py-2 rounded-md bg-navy text-white text-xs font-bold hover:bg-navy-deep"
              >
                Apply Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP MODAL */}
      {stepModal.open && stepModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/50 backdrop-blur-xs">
          <div className="bg-surface rounded-lg border border-line shadow-overlay max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {stepModal.index >= 0 ? 'Edit Workflow Step' : 'Add Workflow Step'}
              </h3>
              <button
                type="button"
                onClick={() => setStepModal({ open: false, index: -1, data: null })}
                className="p-1.5 text-ink-faint hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink mb-1">Step Title</label>
                <input
                  type="text"
                  value={stepModal.data.title}
                  onChange={(e) =>
                    setStepModal({ ...stepModal, data: { ...stepModal.data, title: e.target.value } })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Category / Phase</label>
                <input
                  type="text"
                  value={stepModal.data.category}
                  onChange={(e) =>
                    setStepModal({ ...stepModal, data: { ...stepModal.data, category: e.target.value } })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Continuous Integration"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Description</label>
                <textarea
                  rows={3}
                  value={stepModal.data.description}
                  onChange={(e) =>
                    setStepModal({ ...stepModal, data: { ...stepModal.data, description: e.target.value } })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Tools (Comma-separated)
                </label>
                <input
                  type="text"
                  value={(stepModal.data.tools || []).join(', ')}
                  onChange={(e) =>
                    setStepModal({
                      ...stepModal,
                      data: {
                        ...stepModal.data,
                        tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStepModal({ open: false, index: -1, data: null })}
                className="px-4 py-2 rounded-lg text-ink-soft text-xs font-bold hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveStepModal}
                className="px-4 py-2 rounded-md bg-navy text-white text-xs font-bold hover:bg-navy-deep"
              >
                Apply Step
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT MODAL */}
      {projectModal.open && projectModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/50 backdrop-blur-xs">
          <div className="bg-surface rounded-lg border border-line shadow-overlay max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {projectModal.index >= 0 ? 'Edit Project Card' : 'Add Project Card'}
              </h3>
              <button
                type="button"
                onClick={() => setProjectModal({ open: false, index: -1, data: null })}
                className="p-1.5 text-ink-faint hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1">Project Number</label>
                  <input
                    type="text"
                    value={projectModal.data.projectNumber}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        data: { ...projectModal.data, projectNumber: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink mb-1">Difficulty</label>
                  <select
                    value={projectModal.data.difficulty}
                    onChange={(e) =>
                      setProjectModal({
                        ...projectModal,
                        data: { ...projectModal.data, difficulty: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectModal.data.title}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      data: { ...projectModal.data, title: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projectModal.data.description}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      data: { ...projectModal.data, description: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={(projectModal.data.technologies || []).join(', ')}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      data: {
                        ...projectModal.data,
                        technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      }
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">
                  Learning Outcomes (One per line)
                </label>
                <textarea
                  rows={4}
                  value={(projectModal.data.learningOutcomes || []).join('\n')}
                  onChange={(e) =>
                    setProjectModal({
                      ...projectModal,
                      data: {
                        ...projectModal.data,
                        learningOutcomes: e.target.value.split('\n').filter(Boolean)
                      }
                    })
                  }
                  className="w-full px-3 py-2 font-mono border rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectModal({ open: false, index: -1, data: null })}
                className="px-4 py-2 rounded-lg text-ink-soft text-xs font-bold hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProjectModal}
                className="px-4 py-2 rounded-md bg-navy text-white text-xs font-bold hover:bg-navy-deep"
              >
                Apply Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoadmapManagementPage;

