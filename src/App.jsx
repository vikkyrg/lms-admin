import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';

// Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EnrollmentsManagementPage from './pages/EnrollmentsManagementPage';
import CourseMaterialsPage from './pages/CourseMaterialsPage';
import ProjectsManagementPage from './pages/ProjectsManagementPage';
import CourseManagementPage from './pages/CourseManagementPage';
import CurriculumBuilderPage from './pages/CurriculumBuilderPage';
import UsersManagementPage from './pages/UsersManagementPage';
import EnquiriesPage from './pages/EnquiriesPage';
import TestimonialsManagementPage from './pages/TestimonialsManagementPage';
import VideoTestimonialsManagementPage from './pages/VideoTestimonialsManagementPage';
import FaqManagementPage from './pages/FaqManagementPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import RoadmapManagementPage from './pages/RoadmapManagementPage';

function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Protected administrator workspace */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="enrollments" element={<EnrollmentsManagementPage />} />
            <Route path="materials" element={<CourseMaterialsPage />} />
            <Route path="projects" element={<ProjectsManagementPage />} />
            <Route path="courses" element={<CourseManagementPage />} />
            <Route path="curriculum" element={<CurriculumBuilderPage />} />
            <Route path="roadmap" element={<Navigate to="/projects" replace />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="testimonials" element={<TestimonialsManagementPage />} />
            <Route path="video-testimonials" element={<VideoTestimonialsManagementPage />} />
            <Route path="faqs" element={<FaqManagementPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;
