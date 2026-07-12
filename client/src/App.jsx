import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Allocations from './pages/Allocations';
import Transfers from './pages/Transfers';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role?.name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Sidebar />
      {children}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/allocations" 
            element={
              <ProtectedRoute>
                <Allocations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transfers" 
            element={
              <ProtectedRoute>
                <Transfers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/maintenance" 
            element={
              <ProtectedRoute>
                <Maintenance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audits" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']}>
                <Audits />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']}>
                <Reports />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
