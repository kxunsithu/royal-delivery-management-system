import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';

// pages
import Dashboard from './pages/Dashboard';
import Parcels from './pages/Parcels';
import ParcelCreate from './pages/ParcelCreate';
import ParcelDetail from './pages/ParcelDetail';
import ParcelEdit from './pages/ParcelEdit';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Deliveries from './pages/Deliveries';
import MyAssignments from './pages/MyAssignments';
import DeliveryDetail from './pages/DeliveryDetail';
import DeliveryAttempt from './pages/DeliveryAttempt';
import AssignStaff from './pages/AssignStaff';
import DailySummary from './pages/DailySummary';
import DailySummaryDetail from './pages/DailySummaryDetail';
import MonthlySummaryDetail from './pages/MonthlySummaryDetail';
import Users from './pages/Users';
import UserCreate from './pages/UserCreate';
import UserDetail from './pages/UserDetail';
import Profile from './pages/Profile';
import More from './pages/More';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-app">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-app">Loading...</div>;
  }
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/parcels" element={<Parcels />} />
        <Route path="/parcels/create" element={<ParcelCreate />} />
        <Route path="/parcels/:id" element={<ParcelDetail />} />
        <Route path="/parcels/:id/edit" element={<ParcelEdit />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:phone" element={<CustomerDetail />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/my-assignments" element={<MyAssignments />} />
        <Route path="/deliveries/:id" element={<DeliveryDetail />} />
        <Route path="/deliveries/:id/attempt" element={<DeliveryAttempt />} />
        <Route path="/assign-staff" element={<AssignStaff />} />
        <Route path="/records" element={<DailySummary />} />
        <Route path="/daily-summary" element={<DailySummary />} />
        <Route path="/daily-summary/:date" element={<DailySummaryDetail />} />
        <Route path="/records/:date" element={<DailySummaryDetail />} />
        <Route path="/monthly-summary/:month" element={<MonthlySummaryDetail />} />
        <Route path="/records/month/:month" element={<MonthlySummaryDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/create" element={<UserCreate />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/more" element={<More />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}