import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "@/App.css";
import Layout from "@/components/layout/Layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import Home from "@/pages/Home";
import HighSchool from "@/pages/HighSchool";
import University from "@/pages/University";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Testimonials from "@/pages/Testimonials";
import TutorApply from "@/pages/TutorApply";
import { Privacy, Refund, Terms } from "@/pages/Legal";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import Onboarding from "@/pages/Onboarding";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import TutorDashboard from "@/pages/TutorDashboard";

function Loader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1D4ED8] border-t-transparent" />
    </div>
  );
}

function Protected({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role === "admin" && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  if (role === "student" && !["student_highschool", "student_university"].includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "pending") return <Navigate to="/onboarding" replace />;
    // tutor - send to home
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const location = useLocation();
  // Emergent Auth returns with #session_id=... — handle before normal routes render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/high-school" element={<HighSchool />} />
        <Route path="/university" element={<University />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/tutor-apply" element={<TutorApply />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
        <Route path="/dashboard" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="/tutor" element={<Protected role="tutor"><TutorDashboard /></Protected>} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
