import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import {
  Users,
  BookOpen,
  Eye,
  Mail,
  Phone,
  UserCheck,
  UserX,
  GraduationCap,
  Filter,
  X,
  Search,
  Calendar,
  Layers,
  ChevronDown,
  Edit2,
  ShieldAlert
} from 'lucide-react';
import {
  DataTable,
  SearchBar,
  FilterDropdown,
  Pagination,
  StatusBadge,
  ActionMenu,
  Modal,
  FormField,
  btn
} from '../components/ui';

const UsersManagementPage = () => {
  const navigate = useNavigate();
  const { notify } = useFeedback();

  // Data state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    enrolledStudents: 0,
    inactiveStudents: 0
  });
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Quick edit / access modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Load courses list once for the dropdown filter
  useEffect(() => {
    api.get('/courses')
      .then((res) => {
        setAllCourses(res.data?.courses || res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load courses for filter', err);
      });
  }, []);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [statusFilter, courseFilter, sortOption, startDate, endDate, limit, appliedSearch]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (statusFilter) params.append('status', statusFilter);
      if (courseFilter) params.append('courseId', courseFilter);
      if (sortOption) params.append('sort', sortOption);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (appliedSearch.trim()) params.append('search', appliedSearch.trim());

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setStatusFilter('');
    setCourseFilter('');
    setSortOption('newest');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    appliedSearch || statusFilter || courseFilter || startDate || endDate || sortOption !== 'newest'
  );

  // Quick edit student handler
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      phone: student.phone || '',
      isActive: student.isActive !== false
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditSubmitting(true);
    try {
      const res = await api.put(`/admin/users/${editingStudent._id}`, editForm);
      notify('Student updated successfully', 'success');
      setUsers((prev) =>
        prev.map((u) => (u._id === editingStudent._id ? { ...u, ...res.data.student } : u))
      );
      setEditingStudent(null);
      // Refresh stats if status toggled
      fetchUsers(pagination.page);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.message || 'Failed to update student', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      className: 'min-w-[200px]',
      render: (student) => {
        const initial = student.name ? student.name[0].toUpperCase() : 'S';
        return (
          <div className="flex items-center gap-3 min-w-0">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-line"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center text-xs shrink-0 border border-brand/20">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/users/${student._id}`)}
                className="font-bold text-navy hover:text-brand transition-colors text-[13px] leading-tight block truncate text-left cursor-pointer"
              >
                {student.name}
              </button>
              <span className="text-[10px] text-ink-faint font-mono block truncate">
                ID: {student._id.slice(-6)}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'contact',
      header: 'Contact Information',
      className: 'min-w-[210px]',
      render: (student) => (
        <div className="space-y-0.5 text-xs">
          <a
            href={`mailto:${student.email}`}
            className="text-ink-soft hover:text-brand hover:underline transition-colors truncate block font-medium"
          >
            {student.email}
          </a>
          <span className="text-[11px] text-ink-faint block truncate">
            {student.phone || 'No phone provided'}
          </span>
        </div>
      )
    },
    {
      key: 'enrolledCourses',
      header: 'Enrolled Courses',
      className: 'min-w-[150px]',
      render: (student) => {
        const count = student.enrolledCoursesCount || 0;
        const courses = student.enrolledCourses || [];
        return (
          <div className="group relative inline-block">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-canvas border border-line text-xs font-semibold text-ink">
              <BookOpen className="w-3.5 h-3.5 text-brand" />
              <span>{count} {count === 1 ? 'Course' : 'Courses'}</span>
            </span>

            {/* Course names popup tooltip on hover */}
            {courses.length > 0 && (
              <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-20 w-56 rounded-lg bg-navy p-2 text-[11px] text-white shadow-xl">
                <p className="font-bold border-b border-white/20 pb-1 mb-1">Enrolled Courses:</p>
                <ul className="space-y-1">
                  {courses.map((c, i) => (
                    <li key={i} className="truncate text-slate-200">
                      • {c.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Registration Date',
      className: 'w-[130px]',
      render: (student) => (
        <span className="text-ink-soft whitespace-nowrap text-xs">
          {student.createdAt
            ? new Date(student.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '—'}
        </span>
      )
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      className: 'w-[130px]',
      render: (student) => {
        const status = student.paymentStatus || 'none';
        if (status === 'paid') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DEF7EC] text-[#03543F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#31C48D]" />
              Paid
            </span>
          );
        }
        if (status === 'pending') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF08A]/40 text-[#854D0E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" />
              Pending
            </span>
          );
        }
        if (status === 'free') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-canvas text-ink-soft border border-line">
              Free Access
            </span>
          );
        }
        return (
          <span className="text-[11px] text-ink-faint">No Records</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Account Status',
      className: 'w-[110px]',
      render: (student) => (
        <StatusBadge value={student.isActive !== false ? 'active' : 'inactive'} dot />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[64px] text-right',
      render: (student) => (
        <ActionMenu
          items={[
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => navigate(`/users/${student._id}`)
            },
            {
              label: 'Edit Student',
              icon: Edit2,
              onClick: () => handleOpenEdit(student)
            },
            {
              label: student.isActive !== false ? 'Deactivate Access' : 'Activate Access',
              icon: student.isActive !== false ? UserX : UserCheck,
              tone: student.isActive !== false ? 'danger' : 'default',
              onClick: () => {
                setEditingStudent(student);
                setEditForm({
                  name: student.name,
                  phone: student.phone || '',
                  isActive: student.isActive === false
                });
                setIsEditModalOpen(true);
              }
            }
          ]}
          label="Student actions"
        />
      )
    }
  ];

  const rangeLabel = pagination.total
    ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
        pagination.page * pagination.limit,
        pagination.total
      )} of ${pagination.total} students`
    : '';

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-8">
      {/* 1. Header with title and description */}
      <div>
        <h1 className="text-xl font-bold text-navy tracking-tight flex items-center gap-2.5">
          <Users className="w-5 h-5 text-brand" />
          <span>Student Management</span>
        </h1>
        <p className="text-xs text-ink-soft mt-1">
          Manage student profiles, course enrollments, learning progress and account access.
        </p>
      </div>

      {/* 2. Four Compact Summary Cards (Live Database Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Total Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-navy">{stats.totalStudents || 0}</p>
          <span className="text-[11px] text-ink-faint mt-0.5 block">Registered platform accounts</span>
        </div>

        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Active Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-success-soft text-success flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-success">{stats.activeStudents || 0}</p>
          <span className="text-[11px] text-ink-faint mt-0.5 block">Accounts in good standing</span>
        </div>

        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Enrolled Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1F70F7] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-brand">{stats.enrolledStudents || 0}</p>
          <span className="text-[11px] text-ink-faint mt-0.5 block">In enrolled courses</span>
        </div>

        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Inactive Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-danger-soft text-danger flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-danger">{stats.inactiveStudents || 0}</p>
          <span className="text-[11px] text-ink-faint mt-0.5 block">Suspended or inactive</span>
        </div>
      </div>

      {/* 3 & 4. Comprehensive Search and Filters Toolbar */}
      <div className="bg-surface rounded-xl border border-line shadow-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, or phone number…"
              className="admin-input pl-9 pr-8 w-full text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setAppliedSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button type="submit" className={btn('primary', 'sm')}>
              Search
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className={btn('ghost', 'sm')}>
                Clear Filters
              </button>
            )}
          </div>
        </form>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 border-t border-line/60">
          {/* Status filter */}
          <FilterDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            label="Account Status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active Students' },
              { value: 'inactive', label: 'Inactive Students' }
            ]}
          />

          {/* Enrolled Course filter */}
          <div className="relative">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="admin-input appearance-none pr-8 cursor-pointer text-xs"
              aria-label="Filter by course"
            >
              <option value="">All Courses</option>
              {allCourses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-faint" />
          </div>

          {/* Sort option */}
          <FilterDropdown
            value={sortOption}
            onChange={setSortOption}
            label="Sort By"
            options={[
              { value: 'newest', label: 'Registration: Newest' },
              { value: 'oldest', label: 'Registration: Oldest' },
              { value: 'name_asc', label: 'Name: A to Z' },
              { value: 'name_desc', label: 'Name: Z to A' }
            ]}
          />

          {/* Date from */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-input text-xs"
              title="Registered from"
            />
          </div>

          {/* Date to */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="admin-input text-xs"
              title="Registered to"
            />
          </div>
        </div>
      </div>

      {/* 5. Natural Scrolling Data Table */}
      <div className="relative">
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          error={error}
          onRetry={() => fetchUsers(pagination.page)}
          minWidthClass="min-w-[900px]"
          empty={{
            title: 'No student accounts found',
            message: hasActiveFilters
              ? 'Try modifying or clearing your search filters to find registered students.'
              : 'There are currently no students registered on the platform.'
          }}
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-line">
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-soft">{rangeLabel}</span>
                <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="admin-input py-0.5 px-2 text-xs w-16"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.pages}
                onPageChange={fetchUsers}
                className="border-t-0 p-0"
              />
            </div>
          }
        />
      </div>

      {/* Quick Edit Student Modal */}
      <Modal
        open={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Account"
        description={editingStudent?.email}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className={btn('secondary')}
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="quick-edit-student-form"
              className={btn('primary')}
              disabled={editSubmitting}
            >
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="quick-edit-student-form" onSubmit={handleSaveEdit} className="space-y-4">
          <FormField label="Full Name" required>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              className="admin-input"
              required
            />
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

          <FormField label="Account Status">
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modalIsActive"
                  checked={editForm.isActive === true}
                  onChange={() => setEditForm((prev) => ({ ...prev, isActive: true }))}
                  className="text-brand focus:ring-brand"
                />
                <span className="text-xs font-semibold text-ink">Active (Access Allowed)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modalIsActive"
                  checked={editForm.isActive === false}
                  onChange={() => setEditForm((prev) => ({ ...prev, isActive: false }))}
                  className="text-brand focus:ring-brand"
                />
                <span className="text-xs font-semibold text-danger">Inactive (Access Suspended)</span>
              </label>
            </div>
          </FormField>
        </form>
      </Modal>
    </div>
  );
};

export default UsersManagementPage;
