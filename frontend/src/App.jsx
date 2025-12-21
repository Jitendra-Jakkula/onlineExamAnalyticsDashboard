import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HomeRedirect from "./pages/HomeRedirect";
import AdminExams from "./pages/admin/AdminExams";
import AdminExamDetail from "./pages/admin/AdminExamDetail";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import StudentExams from "./pages/student/StudentExams";
import TakeExam from "./pages/student/TakeExam";
import StudentAnalytics from "./pages/student/StudentAnalytics";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowRoles={["admin"]}>
              <AdminExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams/:examId"
          element={
            <ProtectedRoute allowRoles={["admin"]}>
              <AdminExamDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowRoles={["admin"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowRoles={["student"]}>
              <StudentExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams/:examId/take"
          element={
            <ProtectedRoute allowRoles={["student"]}>
              <TakeExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/analytics"
          element={
            <ProtectedRoute allowRoles={["student"]}>
              <StudentAnalytics />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

