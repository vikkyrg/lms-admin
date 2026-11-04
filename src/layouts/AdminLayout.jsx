import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  UserCheck,
  HelpCircle,
  MessageSquareQuote,
  Video,
  FolderGit2,
  Bell,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Star
} from 'lucide-react';
import { FeedbackProvider } from '../components/Feedback';
import { AdminNotificationsProvider, useAdminNotifications } from '../context/AdminNotificationsContext';
import logoImg from '../assets/logo.png';

// Compact, WhatsApp-style unread counter. Renders nothing when count is 0 and
// caps the label at "99+". Uses a fixed pill so it never shifts sidebar text.
const NotificationBadge = ({ count, pulse, className = '' }) => {
  if (!count || count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      className={`notif-badge-pop inline-flex min-w-[1.35rem] shrink-0 items-center justify-center rounded-full bg-[#25D366] px-1.5 py-0.5 text-[11px] font-bold leading-none text-white ring-1 ring-black/5 ${
        pulse ? 'notif-badge-pulse' : ''
      } ${className}`}
      key={label}
      aria-label={`${count} new notifications`}
    >
      {label}
    </span>
  );
};

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Approvals & Access', icon: UserCheck, path: '/enrollments', badgeKey: 'enrollments' },
  { label: 'Projects', icon: FolderGit2, path: '/projects' },
  { label: 'Courses', icon: BookOpen, path: '/courses' },
  { label: 'Curriculum Builder', icon: FolderTree, path: '/curriculum' },
  { label: 'Course Reviews', icon: Star, path: '/course-reviews', badgeKey: 'reviews' },
  { label: 'Student Directory', icon: Users, path: '/users' },
  { label: 'Payments & Refunds', icon: CreditCard, path: '/payments' },
  { label: 'Testimonials', icon: MessageSquareQuote, path: '/testimonials' },
  { label: 'Video Testimonials', icon: Video, path: '/video-testimonials' },
  { label: 'FAQ Management', icon: HelpCircle, path: '/faqs' },
  { label: 'Student Enquiries', icon: MessageSquare, path: '/enquiries', badgeKey: 'enquiries' }
];

// Secondary routes not shown in the sidebar still need a sensible title.
const EXTRA_TITLES = {
  '/materials': 'Course Materials',
  '/course-reviews': 'Course Reviews',
  '/audit-logs': 'Audit Logs'
};

const titleForPath = (pathname) => {
  const item = NAV_ITEMS.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
  if (item) return item.label;
  const extra = Object.entries(EXTRA_TITLES).find(([p]) => pathname.startsWith(p));
  return extra ? extra[1] : 'Admin';
};

const useOutsideClick = (onClose) => {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return ref;
};

// Renders the nav links. Kept as a child component so it can read the
// notification context (which is provided above the layout content).
const SidebarNav = ({ collapsed }) => {
  const { counts, bumped } = useAdminNotifications();
  return (
    <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `group relative flex items-center gap-2.5 py-2 text-[13px] transition rounded-md ${
              collapsed ? 'justify-center px-0' : 'px-3'
            } ${
              isActive
                ? 'bg-brand-soft text-navy font-semibold'
                : 'text-ink-soft font-medium hover:text-ink hover:bg-canvas'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Accent indicator for the active item */}
              {isActive && !collapsed ? (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-brand" />
              ) : null}
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-brand' : 'text-ink-faint group-hover:text-ink-soft'}`} />
              {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
              {item.badgeKey && (
                collapsed ? (
                  <NotificationBadge
                    count={counts[item.badgeKey]}
                    pulse={bumped[item.badgeKey]}
                    className="absolute -top-0.5 right-1 scale-90"
                  />
                ) : (
                  <NotificationBadge count={counts[item.badgeKey]} pulse={bumped[item.badgeKey]} className="ml-auto" />
                )
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

const AdminLayoutInner = () => {
  const { user, logout, loading } = useAdminAuth();
  const { counts, online } = useAdminNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin_sidebar_collapsed') === '1');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useOutsideClick(() => setNotifOpen(false));
  const profileRef = useOutsideClick(() => setProfileOpen(false));

  const totalUnread = (counts.enrollments || 0) + (counts.enquiries || 0);
  const page = titleForPath(location.pathname);

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

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('admin_sidebar_collapsed', c ? '0' : '1');
      return !c;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin h-8 w-8 border-[3px] border-brand border-t-transparent rounded-full" />
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

  const sidebarBody = (isDrawer) => (
    <>
      {/* Brand */}
      <div className={`h-14 flex items-center border-b border-line gap-2.5 shrink-0 ${isDrawer || !collapsed ? 'px-4' : 'justify-center px-2'}`}>
        <div className="bg-white border border-line px-1.5 py-1 rounded-md shrink-0 flex items-center justify-center">
          <img src={logoImg} alt="AutoOps School" className="h-7 w-auto object-contain" />
        </div>
        {(isDrawer || !collapsed) && (
          <div className="min-w-0 overflow-hidden">
            <span className="block text-[13px] font-bold text-navy tracking-tight truncate leading-tight">AutoOps School</span>
            <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wider truncate">Admin Workspace</p>
          </div>
        )}
        {isDrawer ? (
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        ) : null}
      </div>

      {/* Navigation */}
      <SidebarNav collapsed={!isDrawer && collapsed} />

      {/* Footer: profile + logout */}
      <div className={`border-t border-line shrink-0 ${!isDrawer && collapsed ? 'px-2 py-3' : 'px-3 py-3'} space-y-2`}>
        {!isDrawer && collapsed ? (
          <div className="flex justify-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white text-xs font-bold" title={user.email}>
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-white text-xs font-bold">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-ink-faint truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 rounded-md border border-line text-xs font-semibold text-ink-soft hover:text-danger hover:border-danger/30 hover:bg-danger-soft transition ${
            !isDrawer && collapsed ? 'justify-center px-0 py-2 w-full' : 'px-2.5 py-2 w-full'
          }`}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isDrawer && collapsed ? null : <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-canvas text-ink font-sans">
      {/* Desktop sidebar — white surface, collapsible */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-surface border-r border-line transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {sidebarBody(false)}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-navy-deep/50 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface flex flex-col lg:hidden border-r border-line transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarBody(true)}
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-surface border-b border-line flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1.5 rounded-md text-ink-soft hover:text-ink hover:bg-canvas transition shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:inline-flex p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition shrink-0"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            {/* Breadcrumb + page title */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-[13px]">
              <span className="hidden sm:inline text-ink-faint font-medium">Admin</span>
              <span className="hidden sm:inline text-ink-faint">/</span>
              <span className="font-semibold text-ink truncate">{page}</span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* API connection status (driven by real polling result) */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                online ? 'bg-success-soft text-[#15803d] ring-[#16a34a]/20' : 'bg-danger-soft text-[#b91c1c] ring-[#dc2626]/20'
              }`}
              title={online ? 'Backend reachable (last poll succeeded)' : 'Backend unreachable'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-danger'}`} />
              {online ? 'API Connected' : 'API Offline'}
            </span>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-canvas transition"
              >
                <Bell className="h-4 w-4" />
                <NotificationBadge count={totalUnread} className="absolute -top-0.5 -right-0.5 scale-[0.72] ring-2 ring-surface" />
              </button>
              {notifOpen ? (
                <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-line bg-surface py-1 shadow-pop z-40">
                  <p className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Unread activity</p>
                  <Link
                    to="/enrollments"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 text-[13px] text-ink hover:bg-canvas transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-ink-soft" />
                      Enrollment approvals
                    </span>
                    <NotificationBadge count={counts.enrollments} />
                    {!counts.enrollments ? <span className="text-xs text-ink-faint -ml-1">0</span> : null}
                  </Link>
                  <Link
                    to="/enquiries"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-between gap-2 px-3.5 py-2 text-[13px] text-ink hover:bg-canvas transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="h-4 w-4 text-ink-soft" />
                      Student enquiries
                    </span>
                    <NotificationBadge count={counts.enquiries} />
                    {!counts.enquiries ? <span className="text-xs text-ink-faint -ml-1">0</span> : null}
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Profile menu */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 hover:bg-canvas transition"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white text-[11px] font-bold">
                  {user.name ? user.name[0].toUpperCase() : 'A'}
                </span>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-ink-faint" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-line bg-surface py-1 shadow-pop z-40">
                  <div className="px-3.5 py-2.5 border-b border-line-soft">
                    <p className="text-[13px] font-semibold text-ink truncate">{user.name}</p>
                    <p className="text-xs text-ink-faint truncate">{user.email}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand bg-brand-soft rounded-full px-2 py-0.5 w-fit">
                      {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-danger hover:bg-danger-soft transition"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => (
  <FeedbackProvider>
    <AdminNotificationsProvider>
      <AdminLayoutInner />
    </AdminNotificationsProvider>
  </FeedbackProvider>
);

export default AdminLayout;
