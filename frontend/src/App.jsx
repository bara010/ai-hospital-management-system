import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorListPage from './pages/DoctorListPage';
import AppointmentBookingPage from './pages/AppointmentBookingPage';
import ProfilePage from './pages/ProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';
import MedicationsPage from './pages/MedicationsPage';
import MessagesPage from './pages/MessagesPage';
import AIHealthAssistantPage from './pages/AIHealthAssistantPage';
import EmergencyPage from './pages/EmergencyPage';
import NotificationsPage from './pages/NotificationsPage';

const VideoConsultationPage = lazy(() => import('./pages/VideoConsultationPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/doctors" element={<DoctorListPage />} />

      <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/book/:doctorId" element={<AppointmentBookingPage />} />
        <Route path="/ai-health-assistant" element={<AIHealthAssistantPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR']} />}>
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']} />}>
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/video/:appointmentId"
          element={
            <Suspense fallback={<div style={{ padding: '1rem' }}>Loading video module...</div>}>
              <VideoConsultationPage />
            </Suspense>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
