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
import CourseManagementPage from './pages/CourseManagementPage';
import CurriculumBuilderPage from './pages/CurriculumBuilderPage';
import QuizManagementPage from './pages/QuizManagementPage';
import AssignmentManagementPage from './pages/AssignmentManagementPage';
import UsersManagementPage from './pages/UsersManagementPage';
import SubmissionsGradingPage from './pages/SubmissionsGradingPage';
import EnquiriesPage from './pages/EnquiriesPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AuditLogsPage from './pages/AuditLogsPage';

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
            <Route path="courses" element={<CourseManagementPage />} />
            <Route path="curriculum" element={<CurriculumBuilderPage />} />
            <Route path="quizzes" element={<QuizManagementPage />} />
            <Route path="assignments" element={<AssignmentManagementPage />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="submissions" element={<SubmissionsGradingPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

export default App;
