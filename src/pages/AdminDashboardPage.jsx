import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  ArrowUpRight,
  UserCheck
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

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentStudents = data?.recentStudents || [];
  const topCourses = data?.topCourses || [];

  // Chart data from top courses
  const chartData = topCourses.map((c) => ({
    name: c.title.substring(0, 15) + '...',
    students: c.enrollmentCount || 0
  }));

  return (
    <div className="space-y-5 sm:space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Platform Analytics Overview</h1>
        <p className="text-xs text-gray-500 mt-1">Real-time database aggregated platform metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 truncate">{stats.pendingApprovals || 0}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 truncate">{stats.totalStudents || 0}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Published Courses</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 truncate">{stats.publishedCourses || 0}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Enrollments</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 truncate">{stats.totalEnrollments || 0}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Platform Revenue</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 truncate">₹{stats.grossRevenue || 0}</p>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>
      </div>

      {/* Chart & Top Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">Course Enrollment Distribution</h3>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Courses list */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">Best Performing Courses</h3>
          <div className="divide-y divide-gray-100">
            {topCourses.map((c) => (
              <div key={c._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">{c.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{c.enrollmentCount || 0} Students enrolled</p>
                </div>
                <span className="text-xs font-bold text-indigo-600">
                  {c.price > 0 ? `₹${c.price}` : 'Free'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registered Students */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-sm">Recent Student Registrations</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[560px] text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Registered Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentStudents.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

