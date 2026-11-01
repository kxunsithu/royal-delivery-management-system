import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import AppLayout from '@/layouts/AppLayout'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage'

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage'

// Parcels
import ParcelsPage from '@/pages/parcels/ParcelsPage'
import RegisterParcelPage from '@/pages/parcels/RegisterParcelPage'
import ParcelDetailPage from '@/pages/parcels/ParcelDetailPage'
import EditParcelPage from '@/pages/parcels/EditParcelPage'

// Deliveries
import DeliveriesPage from '@/pages/deliveries/DeliveriesPage'
import MyAssignmentsPage from '@/pages/deliveries/MyAssignmentsPage'


// Finance
import FinancePage from '@/pages/finance/FinancePage'
import PaymentsPage from '@/pages/finance/PaymentsPage'
import ExpensesPage from '@/pages/finance/ExpensesPage'
import HandoversPage from '@/pages/finance/HandoversPage'

// Users
import UsersPage from '@/pages/users/UsersPage'
import UserDetailPage from '@/pages/users/UserDetailPage'
import CreateUserPage from '@/pages/users/CreateUserPage'
import EditUserPage from '@/pages/users/EditUserPage'

// Settings
import SettingsPage from '@/pages/settings/SettingsPage'
// Profile
import ProfilePage from '@/pages/profile/ProfilePage'



function ProtectedRoute({ children, roles }: {
  children: React.ReactNode
  roles?: string[]
}) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded animate-spin" />
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected routes inside layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Parcels */}
        <Route
          path="parcels"
          element={
            <ProtectedRoute roles={['admin', 'manager', 'accountant']}>
              <ParcelsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="parcels/register"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <RegisterParcelPage />
            </ProtectedRoute>
          }
        />
        <Route path="parcels/:id" element={<ParcelDetailPage />} />
        <Route
          path="parcels/:id/edit"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <EditParcelPage />
            </ProtectedRoute>
          }
        />

        {/* Deliveries */}
        <Route
          path="deliveries"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DeliveriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="deliveries/my-assignments"
          element={
            <ProtectedRoute roles={['delivery_staff']}>
              <MyAssignmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Finance */}
        <Route
          path="finance"
          element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/payments"
          element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance/expenses"
          element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route path="finance/handovers" element={<HandoversPage />} />

        {/* Users */}
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/create"
          element={
            <ProtectedRoute roles={['admin']}>
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route
          path="users/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <EditUserPage />
            </ProtectedRoute>
          }
        />


        {/* Settings */}
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Profile (all authenticated users) */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
