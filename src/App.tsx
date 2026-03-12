import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { RoutesPage } from './pages/RoutesPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AboutPage } from './pages/AboutPage'
import { AdminStopsPage } from './pages/AdminStopsPage'
import { AdminRoutesPage } from './pages/AdminRoutesPage'
import { FieldMapperPage } from './pages/FieldMapperPage'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="h-dvh flex flex-col">
          <div className="flex-1 min-h-0 pb-14">
            <Routes>
              <Route path="/" element={<MapPage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/routes/:routeKey" element={<RouteDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/admin/stops" element={<AdminStopsPage />} />
              <Route path="/admin/routes" element={<AdminRoutesPage />} />
              <Route path="/admin/field-mapper" element={<FieldMapperPage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
