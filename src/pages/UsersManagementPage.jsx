import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useFeedback } from '../components/Feedback';
import {
  Users,
  BookOpen,
  Eye,
  Award,
  Mail,
  Phone
} from 'lucide-react';
import {
  DataTable,
  SearchBar,
  FilterDropdown,
  Pagination,
  StatusBadge,
  Drawer,
  ActionMenu,
  SkeletonText,
  btn
} from '../components/ui';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { notify } = useFeedback();

  useEffect(() => {
    fetchUsers(1);
  }, [statusFilter]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 15);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
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
    fetchUsers(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // State updates are async — fetch with an explicit empty search term.
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append('page', 1);
    params.append('limit', 15);
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/admin/users?${params.toString()}`)
      .then((res) => {
        setUsers(res.data.users || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load students.');
      })
      .finally(() => setLoading(false));
  };

  const handleOpenDetails = async (studentId) => {
    setSelectedStudentId(studentId);
    setDetailsLoading(true);
    setStudentDetails(null);
    try {
      const res = await api.get(`/admin/users/${studentId}/details`);
      setStudentDetails(res.data);
    } catch (err) {
      console.error(err);
      notify(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedStudentId(null);
    setStudentDetails(null);
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (student) => {
        const initial = student.name ? student.name[0].toUpperCase() : 'S';
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            {student.avatar ? (
              <img src={student.avatar} alt={student.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-line" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center text-[11px] shrink-0">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-semibold text-ink block truncate text-[13px] leading-tight">{student.name}</span>
              {student.phone && (
                <span className="text-[11px] text-ink-faint block truncate">{student.phone}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'email',
      header: 'Email',
      className: 'max-w-[220px]',
      render: (student) => (
        <a href={`mailto:${student.email}`} className="text-ink-soft hover:text-brand hover:underline transition-colors truncate block">
          {student.email}
        </a>
      )
    },
    {
      key: 'createdAt',
      header: 'Registered',
      className: 'w-[140px]',
      render: (student) => (
        <span className="text-ink-soft whitespace-nowrap text-xs">
          {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </span>
      )
    },
    {
      key: 'enrolledCoursesCount',
      header: 'Courses',
      className: 'w-[100px]',
      render: (student) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <BookOpen className="w-3.5 h-3.5 text-ink-faint" />
          {student.enrolledCoursesCount || 0}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[110px]',
      render: (student) => <StatusBadge value={student.isActive !== false ? 'active' : 'inactive'} dot />
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[52px]',
      render: (student) => (
        <ActionMenu
          items={[{ label: 'View details', icon: Eye, onClick: () => handleOpenDetails(student._id) }]}
          label="Student actions"
        />
      )
    }
  ];

  const rangeLabel = pagination.total
    ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} students`
    : '';

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-ink tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Student Directory
          </h1>
          <p className="text-xs text-ink-soft mt-1">Manage student profiles, enrollment details, and learning access.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-soft shadow-card">
          <span className="font-bold text-navy">{pagination.total}</span> registered
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={error}
        onRetry={() => fetchUsers(pagination.page)}
        minWidthClass="min-w-[820px]"
        empty={{
          title: 'No students found',
          message: searchQuery || statusFilter
            ? 'Try clearing your search or status filter to see registered students.'
            : 'No student accounts are currently registered on the platform.'
        }}
        toolbar={
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5 w-full">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or email…" className="w-full max-w-xs" />
            <button type="submit" className={btn('secondary', 'sm')}>Find</button>
            {searchQuery ? (
              <button type="button" onClick={handleClearSearch} className={btn('ghost', 'sm')}>Clear</button>
            ) : null}
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              label="Account status"
              className="w-36 ml-auto"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </form>
        }
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            onPageChange={fetchUsers}
            rangeLabel={rangeLabel}
          />
        }
      />

      {/* Student details drawer */}
      <Drawer
        open={Boolean(selectedStudentId)}
        onClose={handleCloseDetails}
        title={studentDetails?.student?.name || 'Student Details'}
        description={studentDetails?.student?.email}
        widthClass="w-full max-w-lg"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={handleCloseDetails} className={btn('secondary')}>Close</button>
          </div>
        }
      >
        {detailsLoading ? (
          <SkeletonText lines={6} />
        ) : !studentDetails ? (
          <p className="text-xs text-danger py-6 text-center">Failed to load student details.</p>
        ) : (
          <div className="space-y-5">
            {/* Profile summary */}
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-canvas border border-line p-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Registered On</span>
                <span className="font-semibold text-ink">{new Date(studentDetails.student.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Account Status</span>
                <StatusBadge value={studentDetails.student.isActive !== false ? 'active' : 'inactive'} dot />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Phone</span>
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-ink-faint" />
                  {studentDetails.student.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-faint block">Email</span>
                <a href={`mailto:${studentDetails.student.email}`} className="font-semibold text-brand hover:underline flex items-center gap-1.5 min-w-0">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{studentDetails.student.email}</span>
                </a>
              </div>
            </div>

            {/* Enrollments */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] uppercase font-bold tracking-wider text-ink-faint">
                Course Enrollments ({studentDetails.enrollments?.length || 0})
              </h4>
              {studentDetails.enrollments?.length === 0 ? (
                <p className="text-xs text-ink-faint italic">This student has not enrolled in any courses yet.</p>
              ) : (
                <div className="space-y-2">
                  {studentDetails.enrollments.map((enr) => (
                    <div key={enr._id} className="bg-surface rounded-md border border-line p-3 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink line-clamp-1">{enr.course?.title || 'Course'}</span>
                        <StatusBadge value={enr.status === 'pending_approval' ? 'pending' : enr.status} />
                      </div>
                      <div className="flex items-center justify-between text-ink-soft text-[11px]">
                        <span>Progress: <strong className="text-ink">{enr.progress || 0}%</strong></span>
                        {enr.accessExpiryDate && <span>Expires: {new Date(enr.accessExpiryDate).toLocaleDateString('en-IN')}</span>}
                      </div>
                      <div className="w-full bg-canvas h-1.5 rounded-full overflow-hidden border border-line-soft">
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

            {/* Certificates */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] uppercase font-bold tracking-wider text-ink-faint">
                Certificates Earned ({studentDetails.certificates?.length || 0})
              </h4>
              {studentDetails.certificates?.length === 0 ? (
                <p className="text-xs text-ink-faint italic">No certificates issued for this student yet.</p>
              ) : (
                <div className="space-y-2">
                  {studentDetails.certificates.map((cert) => (
                    <div key={cert._id} className="flex items-center justify-between p-3 rounded-md border border-accent/50 bg-[#fffbef] text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Award className="w-4 h-4 text-[#b8860b] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-ink block truncate">{cert.courseId?.title || 'Certificate'}</span>
                          <span className="text-[10px] text-ink-soft">Serial: {cert.certificateNumber}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-ink-soft shrink-0">
                        {new Date(cert.issueDate || cert.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UsersManagementPage;
