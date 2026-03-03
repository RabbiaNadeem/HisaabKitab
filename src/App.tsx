import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage from './pages/BudgetsPage'
import ReportsPage from './pages/ReportsPage'
import GoalsPage from './pages/GoalsPage'
import SettingsPage from './pages/SettingsPage'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-primary">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-lg font-medium">Loading…</span>
      </div>
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  if (loading) return <LoadingSpinner />
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/sign-in" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  if (loading) return <LoadingSpinner />
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/sign-in" element={<PublicRoute><SignInPage /></PublicRoute>} />
        <Route path="/sign-up" element={<PublicRoute><SignUpPage /></PublicRoute>} />

        {/* Private — wrapped in AppLayout via PrivateRoute */}
        <Route path="/"             element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
        <Route path="/budgets"      element={<PrivateRoute><BudgetsPage /></PrivateRoute>} />
        <Route path="/reports"      element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
        <Route path="/goals"        element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
        <Route path="/settings"     element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App