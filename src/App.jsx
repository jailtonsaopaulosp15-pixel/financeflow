import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { useAuth } from './hooks/useAuth'

// Components
import { Sidebar } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { FloatingActionButton } from './components/FloatingActionButton'
import { NotificationCenter } from './components/NotificationCenter'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages (lazy-loaded so each route is its own chunk, shrinking the initial bundle)
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const IncomesPage = lazy(() => import('./pages/IncomesPage').then(m => ({ default: m.IncomesPage })))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const ReportsPage = lazy(() => import('./pages/stubs').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AddTransactionPage = lazy(() => import('./pages/AddTransactionPage').then(m => ({ default: m.AddTransactionPage })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-nubank-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  const { theme } = useAppStore()

  const isAuthPage = ['/login', '/signup', '/recover-password'].includes(window.location.pathname)

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Sidebar for authenticated users */}
        {user && !isAuthPage && <Sidebar />}

        {/* Main Content */}
        <main className={`transition-all duration-300 ${user && !isAuthPage ? 'md:ml-64 pb-20 md:pb-0' : ''}`}>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/incomes"
              element={
                <ProtectedRoute>
                  <IncomesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-transaction"
              element={
                <ProtectedRoute>
                  <AddTransactionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>

        {/* Mobile-only bottom navigation and quick-add button */}
        {user && !isAuthPage && <BottomNav />}
        {user && !isAuthPage && <FloatingActionButton />}

        {/* Notification Center */}
        <NotificationCenter />
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
