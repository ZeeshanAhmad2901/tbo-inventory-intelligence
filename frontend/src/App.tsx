import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/ResetPasswordPage'

const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const MatchingPage = lazy(() => import('./pages/MatchingPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const OffersPage = lazy(() => import('./pages/OffersPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function PageLoading() {
  return (
    <div className="placeholder-page" role="status" aria-live="polite">
      <p>Loading workspace...</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Suspense fallback={<PageLoading />}><OverviewPage /></Suspense>} />
          <Route path="suppliers" element={<Suspense fallback={<PageLoading />}><SuppliersPage /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<PageLoading />}><InventoryPage /></Suspense>} />
          <Route path="matching" element={<Suspense fallback={<PageLoading />}><MatchingPage /></Suspense>} />
          <Route path="review" element={<Suspense fallback={<PageLoading />}><ReviewPage /></Suspense>} />
          <Route path="offers" element={<Suspense fallback={<PageLoading />}><OffersPage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoading />}><AnalyticsPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
