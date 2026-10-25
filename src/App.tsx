import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { ToastProvider } from './components/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import HomePage from './pages/HomePage'
import GroupsPage from './features/groups/GroupsPage'
import GroupDetailsPage from './features/groups/GroupDetailsPage'
import EventsPage from './features/events/EventsPage'
import EventDetailsPage from './features/events/EventDetailsPage'
import EventSummaryPage from './features/events/EventSummaryPage'
import PaymentsPage from './features/payments/PaymentsPage'
import AdminPage from './features/admin/AdminPage'
import DesignPreview from './pages/DesignPreview'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/design" element={<DesignPreview />} />

            {/* Signed-in only, inside the top-bar frame */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="groups/:id" element={<GroupDetailsPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<EventDetailsPage />} />
                <Route path="events/:id/summary" element={<EventSummaryPage />} />
                <Route path="payments" element={<PaymentsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<AppLayout />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
