import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  FileCheck,
  CreditCard,
  MessageSquare,
  LogOut,
  Shield,
  Menu,
  X,
  GraduationCap,
  UserCheck,
  FileText,
  HelpCircle,
  ClipboardList,
  MessageSquareQuote,
  Video,
  FolderGit2
} from 'lucide-react';
import { FeedbackProvider } from '../components/Feedback';

const AdminLayout = () => {
  const { user, logout, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent background scroll while the drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Approvals & Access', icon: UserCheck, path: '/enrollments' },
    { label: 'Projects', icon: FolderGit2, path: '/projects' },
    { label: 'Courses', icon: BookOpen, path: '/courses' },
    { label: 'Curriculum Builder', icon: FolderTree, path: '/curriculum' },
    { label: 'Quizzes', icon: HelpCircle, path: '/quizzes' },
    { label: 'Assignments & Projects', icon: ClipboardList, path: '/assignments' },
    { label: 'User Directory', icon: Users, path: '/users' },
    { label: 'Payments & Refunds', icon: CreditCard, path: '/payments' },
    { label: 'Audit Logs', icon: Shield, path: '/audit-logs' },
    { label: 'Testimonials', icon: MessageSquareQuote, path: '/testimonials' },
    { label: 'Video Testimonials', icon: Video, path: '/video-testimonials' },
    { label: 'FAQ Management', icon: HelpCircle, path: '/faqs' },
    { label: 'Student Enquiries', icon: MessageSquare, path: '/enquiries' },
    { label: 'Submissions & Grading', icon: FileCheck, path: '/submissions' }
  ];

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <span className="font-bold text-white text-base tracking-tight block truncate">AutoOps School</span>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase">{user.role} workspace</p>
          </div>
        </div>
        {/* Close button (mobile drawer only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 -mr-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-sm shrink-0">
            {user.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 rounded-xl transition"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <FeedbackProvider>
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:w-64 lg:flex bg-slate-900 text-slate-300 flex-col justify-between border-r border-slate-800 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 lg:hidden transition-transform duration-250 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">
              Platform Management &amp; Operations
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">API Connected</span>
              <span className="sm:hidden">Online</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
    </FeedbackProvider>
  );
};

export default AdminLayout;
