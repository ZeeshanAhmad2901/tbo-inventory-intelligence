import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const MatchingPage = lazy(() => import('./pages/MatchingPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const OffersPage = lazy(() => import('./pages/OffersPage'))

function PageLoading() {
  return (
    <div className="placeholder-page" role="status" aria-live="polite">
      <p>Loading workspace...</p>
    </div>
  )
}

function SectionPlaceholder() {
  const location = useLocation()
  const section = location.pathname.split('/')[1] ?? 'overview'
  const title = section.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

  return (
    <div className="placeholder-page">
      <div className="eyebrow">WORKSPACE</div>
      <h1>{title}</h1>
      <p>This workspace is being prepared. Its workflows will be connected as the application develops.</p>
      <span className="demo-label"><span /> FOUNDATION IN PROGRESS</span>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoading />}>
              <OverviewPage />
            </Suspense>
          }
        />
        <Route
          path="suppliers"
          element={
            <Suspense fallback={<PageLoading />}>
              <SuppliersPage />
            </Suspense>
          }
        />
        <Route
          path="inventory"
          element={
            <Suspense fallback={<PageLoading />}>
              <InventoryPage />
            </Suspense>
          }
        />
        <Route
          path="matching"
          element={
            <Suspense fallback={<PageLoading />}>
              <MatchingPage />
            </Suspense>
          }
        />
        <Route
          path="review"
          element={
            <Suspense fallback={<PageLoading />}>
              <ReviewPage />
            </Suspense>
          }
        />
        <Route
          path="offers"
          element={
            <Suspense fallback={<PageLoading />}>
              <OffersPage />
            </Suspense>
          }
        />
        <Route path="analytics" element={<SectionPlaceholder />} />
        <Route path="settings" element={<SectionPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
