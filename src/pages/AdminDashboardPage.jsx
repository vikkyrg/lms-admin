import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAdminNotifications } from '../context/AdminNotificationsContext';
import {
  Users,
  BookOpen,
  IndianRupee,
  CheckCircle,
  UserCheck,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  MetricCard,
  SectionCard,
  StatusBadge,
  Skeleton,
  SkeletonTable,
  SkeletonCards,
  EmptyState
} from '../components/ui';

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { counts } = useAdminNotifications();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/stats');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const recentStudents = data?.recentStudents || [];
  const recentPayments = data?.recentPayments || [];
  const topCourses = data?.topCourses || [];

  const chartData = topCourses.map((c) => ({
    name: c.title.length > 16 ? `${c.title.substring(0, 16)}…` : c.title,
    students: c.enrollmentCount || 0
  }));

  if (loading) {
    return (
      <div className="space-y-5 max-w-[1400px] mx-auto">
        <div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-3.5 w-80" />
        </div>
        <SkeletonCards count={6} className="grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-lg border border-line bg-surface p-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-4 h-56 w-full" />
          </div>
          <div className="rounded-lg border border-line bg-surface p-4">
            <Skeleton className="h-4 w-40" />
            <SkeletonTable rows={5} cols={2} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <SectionCard className="max-w-xl mx-auto mt-10">
        <EmptyState
          title="Could not load dashboard"
          message={error}
          action={
            <button onClick={fetchStats} className="rounded-md border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-canvas transition">
              Try again
            </button>
          }
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Page intro */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-ink tracking-tight">Platform Overview</h1>
          <p className="text-xs text-ink-soft mt-0.5">Live metrics aggregated from the production database</p>
        </div>
        {stats.completionRate != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas border border-line px-3 py-1 text-xs text-ink-soft">
            Course completion rate
            <span className="font-bold text-navy">{stats.completionRate}%</span>
          </span>
        ) : null}
      </div>

      {/* Metrics — every value comes from /admin/stats or the notifications API */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard label="Total Students" value={stats.totalStudents ?? 0} icon={Users} tone="brand" />
        <MetricCard label="Pending Approvals" value={stats.pendingApprovals ?? 0} icon={UserCheck} tone="warning" />
        <MetricCard label="Active Enrollments" value={stats.approvedEnrollments ?? 0} icon={CheckCircle} tone="success" sub={`${stats.totalEnrollments ?? 0} total`} />
        <MetricCard label="Total Courses" value={stats.totalCourses ?? 0} icon={BookOpen} tone="navy" sub={`${stats.publishedCourses ?? 0} published`} />
        <MetricCard label="Gross Revenue" value={formatMoney(stats.grossRevenue)} icon={IndianRupee} tone="success" />
        <MetricCard label="Unread Enquiries" value={counts.enquiries ?? 0} icon={MessageSquare} tone="brand" />
      </div>

      {/* Chart + Best performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Course Enrollment Distribution" description="Top published courses by enrolled students" className="lg:col-span-2 min-w-0">
          <div className="px-4 pb-4 pt-2 h-64 w-full">
            {chartData.length === 0 ? (
              <EmptyState title="No published courses yet" message="Enrollment data appears here once courses are published." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f7f9fc' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="students" fill="#2f6fed" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Best Performing Courses"
          actions={<Link to="/courses" className="text-xs font-semibold text-brand hover:underline">View all</Link>}
        >
          {topCourses.length === 0 ? (
            <EmptyState title="No published courses" message="Publish a course to see performance here." className="py-8" />
          ) : (
            <div className="divide-y divide-line-soft px-4">
              {topCourses.map((c) => (
                <div key={c._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-semibold text-ink truncate">{c.title}</h4>
                    <p className="text-[11px] text-ink-soft mt-0.5">{c.enrollmentCount || 0} enrolled</p>
                  </div>
                  <span className="text-xs font-bold text-navy shrink-0">{c.price > 0 ? formatMoney(c.price) : 'Free'}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent activity tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard
          title="Recent Student Registrations"
          actions={<Link to="/users" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">Directory <ArrowRight className="h-3 w-3" /></Link>}
        >
          {recentStudents.length === 0 ? (
            <EmptyState title="No registrations yet" className="py-8" />
          ) : (
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Student</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Email</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Registered</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {recentStudents.map((s) => (
                    <tr key={s._id} className="hover:bg-canvas/60 transition-colors">
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink">{s.name}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-soft">{s.email}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-soft whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge value={s.isActive === false ? 'inactive' : 'active'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Payment Activity"
          actions={<Link to="/payments" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">All payments <ArrowRight className="h-3 w-3" /></Link>}
        >
          {recentPayments.length === 0 ? (
            <EmptyState title="No completed payments yet" className="py-8" />
          ) : (
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70">
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Student</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Course</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Amount</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Date</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {recentPayments.map((p) => (
                    <tr key={p._id} className="hover:bg-canvas/60 transition-colors">
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink truncate max-w-[160px]">{p.student?.name || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-soft truncate max-w-[180px]">{p.course?.title || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] font-semibold text-ink whitespace-nowrap tabular-nums">{formatMoney(p.amount)}</td>
                      <td className="px-4 py-2.5 text-[13px] text-ink-soft whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-2.5"><StatusBadge value={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Pending approvals shortcut */}
      {stats.pendingApprovals > 0 ? (
        <Link
          to="/enrollments"
          className="flex items-center justify-between gap-3 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 hover:bg-[#fdf1dc] transition group"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <UserCheck className="h-4 w-4 text-warning shrink-0" />
            <span className="text-[13px] font-semibold text-[#92400e] truncate">
              {stats.pendingApprovals} enrollment{stats.pendingApprovals === 1 ? '' : 's'} waiting for approval
            </span>
          </span>
          <span className="text-xs font-bold text-[#92400e] shrink-0 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            Review now <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
