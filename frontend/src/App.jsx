import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import ResidentDashboard from './pages/ResidentDashboard';
import RaiseComplaint from './pages/RaiseComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import StaffDashboard from './pages/StaffDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Emergency from './pages/Emergency';
import Settings from './pages/Settings';

// New feature pages - lazy loaded for performance
const Announcements    = React.lazy(() => import('./pages/Announcements'));
const Polls            = React.lazy(() => import('./pages/Polls'));
const VisitorPass      = React.lazy(() => import('./pages/VisitorPass'));
const AmenityBooking   = React.lazy(() => import('./pages/AmenityBooking'));
const Analytics        = React.lazy(() => import('./pages/Analytics'));
const MaintenanceFee   = React.lazy(() => import('./pages/MaintenanceFee'));
const ResidentDirectory = React.lazy(() => import('./pages/ResidentDirectory'));
const CommunityForum   = React.lazy(() => import('./pages/CommunityForum'));
const DomesticHelp     = React.lazy(() => import('./pages/DomesticHelp'));
const Classifieds      = React.lazy(() => import('./pages/Classifieds'));
const Messages         = React.lazy(() => import('./pages/Messages'));
const SocietyMap       = React.lazy(() => import('./pages/SocietyMap'));

// Suspense fallback spinner
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
    </div>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 mt-3">Loading Session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route Configuration Component
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

        {/* Dashboard Layout Wrap */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          
          {/* Default Index Route logic */}
          <Route index element={
            <Navigate 
              to={
                user?.role === 'resident' ? '/resident' :
                user?.role === 'staff' ? '/staff' :
                user?.role === 'manager' ? '/manager' :
                user?.role === 'admin' ? '/admin' : '/login'
              } 
              replace 
            />
          } />

          {/* ── Resident ─────────────────────────────────── */}
          <Route path="/resident" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/resident/raise" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <RaiseComplaint />
            </ProtectedRoute>
          } />
          <Route path="/resident/complaint/:id" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ComplaintDetail />
            </ProtectedRoute>
          } />

          {/* ── Staff ─────────────────────────────────────── */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          <Route path="/staff/schedule" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />

          {/* ── Manager ──────────────────────────────────── */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/staff" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/broadcast" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* ── Admin ────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── New Feature Pages (all roles) ─────────────── */}
          <Route path="/announcements"   element={<Announcements />} />
          <Route path="/polls"           element={<Polls />} />
          <Route path="/visitor-pass"    element={
            <ProtectedRoute allowedRoles={['resident']}>
              <VisitorPass />
            </ProtectedRoute>
          } />
          <Route path="/amenity-booking" element={<AmenityBooking />} />
          <Route path="/analytics"       element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/maintenance-fee" element={<MaintenanceFee />} />
          <Route path="/directory"       element={<ResidentDirectory />} />
          <Route path="/forum"           element={<CommunityForum />} />
          <Route path="/domestic-help"   element={<DomesticHelp />} />
          <Route path="/classifieds"     element={<Classifieds />} />
          
          {/* ── Global shared views ───────────────────────── */}
          <Route path="/messages"        element={<Messages />} />
          <Route path="/map"             element={<SocietyMap />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/settings"  element={<Settings />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
