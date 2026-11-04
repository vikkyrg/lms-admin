import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import {
  ArrowLeft,
  Users,
  BookOpen,
  CreditCard,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Edit2,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import {
  StatusBadge,
  Modal,
  FormField,
  SkeletonText,
  btn
} from '../components/ui';

const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { notify } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Edit / Manage Access state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/users/${studentId}/details`);
      setData(res.data);
      if (res.data?.student) {
        setEditForm({
          name: res.data.student.name || '',
          phone: res.data.student.phone || '',
          isActive: res.data.student.isActive !== false
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await api.put(`/admin/users/${studentId}`, editForm);
      notify('Student profile updated successfully', 'success');
      setData((prev) => ({
        ...prev,
        student: {
          ...prev.student,
          ...res.data.student
        }
      }));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.message || 'Failed to update student profile', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-canvas"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-48 bg-line rounded animate-pulse" />
        </div>
        <div className="bg-surface rounded-xl border border-line p-6 shadow-card space-y-4">
          <SkeletonText lines={8} />
        </div>
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>
        <div className="bg-surface rounded-xl border border-line p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-danger mx-auto" />
          <h2 className="text-base font-bold text-ink">Student Profile Not Found</h2>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">{error || 'Could not locate student details.'}</p>
          <button
            type="button"
            onClick={fetchStudentDetails}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const { student, enrollments = [], certificates = [], payments = [], submissions = [] } = data;
  const initial = student.name ? student.name[0].toUpperCase() : 'S';

  // Derived metrics
  const totalCourses = enrollments.length;
  const activeEnrollments = enrollments.filter((e) => e.status === 'approved');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');
  const overallProgress =
    totalCourses > 0
      ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalCourses)
      : 0;

  // Payments calculations
  const totalFees = enrollments.reduce((acc, curr) => {
    const coursePrice = curr.coursePrice || curr.course?.discountPrice || curr.course?.price || 0;
    return acc + (curr.course?.isFree ? 0 : coursePrice);
  }, 0);

  const totalPaid = payments
    .filter((p) => p.status === 'completed' || p.status === 'verified')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const outstandingBalance = Math.max(0, totalFees - totalPaid);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users, count: null },
    { id: 'courses', label: 'Enrolled Courses', icon: BookOpen, count: enrollments.length },
    { id: 'progress', label: 'Learning Progress', icon: Layers, count: null },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
    { id: 'projects', label: 'Projects & Tasks', icon: FileCheck, count: submissions.length },
    { id: 'certificates', label: 'Certificates', icon: Award, count: certificates.length }
  ];

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      {/* Top Breadcrumb navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/users" className="text-ink-soft hover:text-brand font-medium flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Student Management</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-faint" />
          <span className="font-semibold text-ink truncate max-w-xs">{student.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:bg-canvas transition shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-ink-faint" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Student Profile Header Card */}
      <div className="bg-surface rounded-xl border border-line shadow-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-soft text-brand font-black text-xl flex items-center justify-center shrink-0 border border-brand/20">
                {initial}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black text-navy tracking-tight truncate">
                  {student.name}
                </h1>
                <StatusBadge value={student.isActive !== false ? 'active' : 'inactive'} dot />
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                  <a href={`mailto:${student.email}`} className="hover:text-brand hover:underline truncate">
                    {student.email}
                  </a>
                </span>
                {student.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                    <span>{student.phone}</span>
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5 text-ink-faint">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Joined {new Date(student.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </span>
              </div>
              <p className="text-[11px] text-ink-faint font-mono">
                Student ID: <span className="font-semibold text-ink-soft">{student._id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
            <div className="bg-canvas border border-line rounded-lg px-3.5 py-2 text-center min-w-[90px] flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-ink-faint block">Courses</span>
              <span className="text-base font-bold text-navy">{totalCourses}</span>
            </div>
            <div className="bg-canvas border border-line rounded-lg px-3.5 py-2 text-center min-w-[90px] flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-ink-faint block">Certificates</span>
              <span className="text-base font-bold text-[#b8860b]">{certificates.length}</span>
            </div>
            <div className="bg-canvas border border-line rounded-lg px-3.5 py-2 text-center min-w-[90px] flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-ink-faint block">Avg Progress</span>
              <span className="text-base font-bold text-brand">{overallProgress}%</span>
            </div>
          </div>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-line mt-6 pt-3 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-navy text-white shadow-xs'
                    : 'text-ink-soft hover:text-ink hover:bg-canvas'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-ink-faint'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-canvas border border-line text-ink-soft'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main 2-column info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft block">Enrolled</span>
                <p className="mt-1 text-2xl font-bold text-navy">{totalCourses}</p>
                <span className="text-[11px] text-ink-faint mt-0.5 block">{activeEnrollments.length} Active access</span>
              </div>
              <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft block">Completed</span>
                <p className="mt-1 text-2xl font-bold text-success">{completedEnrollments.length}</p>
                <span className="text-[11px] text-ink-faint mt-0.5 block">{certificates.length} Issued</span>
              </div>
              <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft block">Avg Progress</span>
                <p className="mt-1 text-2xl font-bold text-brand">{overallProgress}%</p>
                <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden mt-2 border border-line-soft">
                  <div className="bg-brand h-full rounded-full" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
              <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft block">Paid Fees</span>
                <p className="mt-1 text-2xl font-bold text-navy">₹{totalPaid.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-ink-faint mt-0.5 block">
                  {outstandingBalance > 0 ? `₹${outstandingBalance.toLocaleString('en-IN')} pending` : 'All cleared'}
                </span>
              </div>
            </div>

            {/* Enrolled Courses Highlights */}
            <div className="bg-surface rounded-xl border border-line p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand" />
                  Recent Enrolled Courses
                </h3>
                {enrollments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('courses')}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    View all ({enrollments.length})
                  </button>
                )}
              </div>

              {enrollments.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-line rounded-lg">
                  <p className="text-xs text-ink-soft">No courses enrolled yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 3).map((enr) => (
                    <div key={enr._id} className="p-3.5 rounded-lg border border-line bg-canvas/40 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-navy block truncate">
                          {enr.course?.title || 'Course'}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-ink-soft mt-1">
                          <span>Enrolled: {new Date(enr.createdAt).toLocaleDateString('en-IN')}</span>
                          <span>•</span>
                          <span>Progress: <strong className="text-ink">{enr.progress || 0}%</strong></span>
                        </div>
                      </div>
                      <StatusBadge value={enr.status === 'pending_approval' ? 'pending' : enr.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-5">
            {/* Account Details Box */}
            <div className="bg-surface rounded-xl border border-line p-5 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand" />
                Account & Security
              </h3>

              <div className="divide-y divide-line text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-ink-soft">Account Status</span>
                  <StatusBadge value={student.isActive !== false ? 'active' : 'inactive'} dot />
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-ink-soft">User Role</span>
                  <span className="font-semibold text-navy uppercase text-[11px] bg-canvas px-2 py-0.5 rounded border border-line">
                    {student.role}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-ink-soft">Email Verified</span>
                  <span className="font-semibold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-ink-soft">Registered On</span>
                  <span className="font-semibold text-ink">
                    {new Date(student.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-ink-soft">Last Updated</span>
                  <span className="font-semibold text-ink">
                    {new Date(student.updatedAt || student.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-line bg-canvas text-xs font-semibold text-ink hover:bg-surface transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-ink-faint" />
                  <span>Manage Student Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENROLLED COURSES */}
      {activeTab === 'courses' && (
        <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">Course Enrollments</h3>
              <p className="text-xs text-ink-soft mt-0.5">All programs this student has enrolled in or requested access to.</p>
            </div>
            <span className="text-xs font-semibold text-ink-soft bg-canvas px-2.5 py-1 rounded-full border border-line">
              Total {enrollments.length}
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">No course enrollments found</p>
              <p className="text-xs text-ink-soft mt-1">This student has not yet enrolled in any courses.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {enrollments.map((enr) => (
                <div key={enr._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-canvas/40 transition">
                  <div className="space-y-1.5 min-w-0 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-navy">{enr.course?.title || 'Course'}</h4>
                      <StatusBadge value={enr.status === 'pending_approval' ? 'pending' : enr.status} />
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-soft text-brand">
                        {enr.course?.isFree ? 'Free Program' : `₹${(enr.coursePrice || enr.course?.discountPrice || enr.course?.price || 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <p className="text-xs text-ink-soft line-clamp-2">
                      {enr.course?.shortDescription || 'Hands-on IT technical education curriculum.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint pt-1">
                      <span>Enrolled: {new Date(enr.createdAt).toLocaleDateString('en-IN')}</span>
                      {enr.accessExpiryDate && (
                        <span>Expires: {new Date(enr.accessExpiryDate).toLocaleDateString('en-IN')}</span>
                      )}
                      <span>Payment: <strong>{enr.paymentStatus || 'free'}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    <div className="w-full sm:w-44 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-soft">Completion</span>
                        <span className="font-bold text-brand">{enr.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-canvas h-2 rounded-full overflow-hidden border border-line-soft">
                        <div
                          className="bg-brand h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, enr.progress || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LEARNING PROGRESS */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-line shadow-card p-5">
            <h3 className="text-sm font-bold text-navy">Curriculum Completion Details</h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Live breakdown of completed lessons, modules, and completion percentages.
            </p>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-surface rounded-xl border border-line p-8 text-center text-xs text-ink-soft">
              No learning records available for this student.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {enrollments.map((enr) => (
                <div key={enr._id} className="bg-surface rounded-xl border border-line shadow-card p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-navy truncate">{enr.course?.title}</h4>
                      <span className="text-xs text-ink-soft">
                        Status: <strong className="capitalize">{enr.status}</strong>
                      </span>
                    </div>
                    <span className="text-base font-black text-brand">{enr.progress || 0}% Completed</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-canvas border border-line rounded-lg p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-ink-faint block">Total Modules</span>
                      <span className="text-lg font-bold text-navy">{enr.totalModulesCount || enr.course?.modules?.length || 0}</span>
                    </div>
                    <div className="bg-canvas border border-line rounded-lg p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-ink-faint block">Total Lessons</span>
                      <span className="text-lg font-bold text-navy">{enr.totalLessonsCount || 0}</span>
                    </div>
                    <div className="bg-canvas border border-line rounded-lg p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-ink-faint block">Completed</span>
                      <span className="text-lg font-bold text-success">{enr.completedLessonsCount || (enr.completedLessons || []).length}</span>
                    </div>
                    <div className="bg-canvas border border-line rounded-lg p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-ink-faint block">Pending</span>
                      <span className="text-lg font-bold text-ink-soft">{enr.pendingLessonsCount || 0}</span>
                    </div>
                  </div>

                  <div className="w-full bg-canvas h-2.5 rounded-full overflow-hidden border border-line-soft">
                    <div
                      className="bg-brand h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, enr.progress || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Payment & Transaction History</h3>
              <p className="text-xs text-ink-soft mt-0.5">Verified fees, transactions, and outstanding balance.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-ink-soft">
                Total Paid: <strong className="text-navy">₹{totalPaid.toLocaleString('en-IN')}</strong>
              </span>
              <span>•</span>
              <span className="text-ink-soft">
                Outstanding: <strong className={outstandingBalance > 0 ? 'text-danger' : 'text-success'}>₹{outstandingBalance.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CreditCard className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">No payment records found</p>
              <p className="text-xs text-ink-soft mt-1">Free courses and offline records do not display transactions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead className="bg-canvas border-b border-line text-ink-soft uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Order / Txn ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-canvas/50">
                      <td className="px-4 py-3 font-semibold text-navy">{p.course?.title || 'Program Fee'}</td>
                      <td className="px-4 py-3 font-bold text-ink">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-ink-soft">{p.orderId || p.paymentId || '—'}</td>
                      <td className="px-4 py-3 text-ink-soft">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROJECTS & SUBMISSIONS */}
      {activeTab === 'projects' && (
        <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">Project & Assignment Submissions</h3>
              <p className="text-xs text-ink-soft mt-0.5">Submissions, evaluated marks, and mentor grading status.</p>
            </div>
            <span className="text-xs font-semibold text-ink-soft bg-canvas px-2.5 py-1 rounded-full border border-line">
              Total {submissions.length}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileCheck className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">No project submissions yet</p>
              <p className="text-xs text-ink-soft mt-1">This student has not yet submitted any lab projects or assignments.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {submissions.map((sub) => (
                <div key={sub._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-canvas/40">
                  <div className="space-y-1 min-w-0">
                    <span className="font-semibold text-xs sm:text-sm text-navy block truncate">
                      {sub.assignmentId?.title || 'Assignment Task'}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-soft">
                      <span>Course: <strong>{sub.courseId?.title || '—'}</strong></span>
                      <span>•</span>
                      <span>Submitted: {new Date(sub.createdAt).toLocaleDateString('en-IN')}</span>
                      <span>•</span>
                      <span>Type: <strong className="uppercase">{sub.submissionType || 'text'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {sub.marksObtained !== undefined && sub.marksObtained !== null ? (
                      <span className="text-xs font-bold text-navy px-2.5 py-1 rounded bg-canvas border border-line">
                        {sub.marksObtained} / {sub.assignmentId?.totalMarks || 100} Marks
                      </span>
                    ) : null}
                    <StatusBadge value={sub.status || 'submitted'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy">Issued Certificates</h3>
              <p className="text-xs text-ink-soft mt-0.5">Verifiable course completion certificates earned by the student.</p>
            </div>
            <span className="text-xs font-semibold text-ink-soft bg-canvas px-2.5 py-1 rounded-full border border-line">
              Total {certificates.length}
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Award className="w-8 h-8 text-ink-faint mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink">No certificates earned yet</p>
              <p className="text-xs text-ink-soft mt-1">Certificates are generated once a course is 100% completed.</p>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert._id} className="p-4 rounded-xl border border-[#DCEBFF] bg-[#F8FAFD] space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#BFDBFE] text-brand flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-navy truncate">
                          {cert.courseId?.title || 'Course Certificate'}
                        </h4>
                        <span className="text-[11px] text-ink-soft font-mono">
                          ID: {cert.certificateNumber}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-[#DEF7EC] px-2 py-0.5 rounded-full shrink-0">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-soft border-t border-line/60 pt-2.5">
                    <span>Issued: {new Date(cert.issueDate || cert.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <a
                      href={`/verify-certificate/${cert.certificateNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <span>Public Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Student / Manage Access Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Manage Student Account"
        description="Update student contact information and platform access status."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className={btn('secondary')}
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-student-form"
              className={btn('primary')}
              disabled={editSubmitting}
            >
              {editSubmitting ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="edit-student-form" onSubmit={handleUpdateStudent} className="space-y-4">
          <FormField label="Full Name" required>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              className="admin-input"
              required
            />
          </FormField>

          <FormField label="Email Address">
            <input
              type="email"
              value={student.email}
              disabled
              className="admin-input bg-canvas text-ink-soft cursor-not-allowed"
            />
            <span className="text-[11px] text-ink-faint mt-1 block">
              Email addresses cannot be modified as they are tied to login credentials.
            </span>
          </FormField>

          <FormField label="Phone Number">
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="admin-input"
            />
          </FormField>

          <FormField label="Account Access Status">
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={editForm.isActive === true}
                  onChange={() => setEditForm((prev) => ({ ...prev, isActive: true }))}
                  className="text-brand focus:ring-brand"
                />
                <span className="text-xs font-semibold text-ink">Active (Student can log in and learn)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="isActive"
                  checked={editForm.isActive === false}
                  onChange={() => setEditForm((prev) => ({ ...prev, isActive: false }))}
                  className="text-brand focus:ring-brand"
                />
                <span className="text-xs font-semibold text-danger">Inactive (Account temporarily suspended)</span>
              </label>
            </div>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDetailsPage;

