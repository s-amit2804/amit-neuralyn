import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MoodProvider } from './context/MoodContext';
import React, { useState } from 'react';

import { getDefaultRouteForUser } from './utils/navigation';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/dashboard/UserDashboard';
import ChatPage from './pages/dashboard/ChatPage';
import MentorSessionPage from './pages/dashboard/MentorSessionPage';
import HistoryPage from './pages/dashboard/HistoryPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import PeerMentorDashboard from './pages/mentor/PeerMentorDashboard';
import ProfessionalMentorDashboard from './pages/mentor/ProfessionalMentorDashboard';
import NgoDashboard from './pages/ngo/NgoDashboard';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import MentorLayout from './layouts/MentorLayout';
import NgoLayout from './layouts/NgoLayout';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDefaultRouteForUser(user)} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['user']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<UserDashboard />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="mentor" element={<MentorSessionPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Peer mentor dashboard */}
      <Route path="/mentor/peer" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorLayout type="peer" />
        </ProtectedRoute>
      }>
        <Route index element={<PeerMentorDashboard />} />
        <Route path="sessions" element={<PeerMentorDashboard />} />
      </Route>

      {/* Professional mentor dashboard */}
      <Route path="/mentor/professional" element={
        <ProtectedRoute allowedRoles={['mentor']}>
          <MentorLayout type="professional" />
        </ProtectedRoute>
      }>
        <Route index element={<ProfessionalMentorDashboard />} />
        <Route path="sessions" element={<ProfessionalMentorDashboard />} />
      </Route>

      {/* NGO dashboard */}
      <Route path="/ngo" element={
        <ProtectedRoute allowedRoles={['ngo', 'admin']}>
          <NgoLayout />
        </ProtectedRoute>
      }>
        <Route index element={<NgoDashboard />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
        <AuthProvider>
          <MoodProvider>
            <AppRoutes />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'rgba(30, 30, 30, 0.95)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  fontSize: '13px',
                },
              }}
            />
          </MoodProvider>
        </AuthProvider>
    </Router>
  );
}
