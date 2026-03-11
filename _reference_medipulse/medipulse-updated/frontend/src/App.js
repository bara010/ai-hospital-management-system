import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

// Core pages
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import MoodCheck from './pages/MoodCheck';
import VitalsTracker from './pages/VitalsTracker';
import Settings from './pages/Settings';

// Doctor / Admin pages
import Analytics from './pages/Analytics';
import DischargeSummary from './pages/DischargeSummary';
import BedOccupancy from './pages/BedOccupancy';
import PharmacyInventory from './pages/PharmacyInventory';
import BillingInvoice from './pages/BillingInvoice';
import AuditLog from './pages/AuditLog';
import DoctorPatients from './pages/DoctorPatients';
import NearbyHospitals from './pages/NearbyHospitals';
import MedicationAdherence from './pages/MedicationAdherence';

// New features
import OnlineDoctor from './pages/OnlineDoctor';
import NotificationsPage from './pages/NotificationsPage';
import Departments from './pages/Departments';
import AdminSetup from './pages/AdminSetup';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f0f4f8', fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ fontSize:'36px', marginBottom:'12px' }}>✚</div>
      <div style={{ fontSize:'16px', color:'#94a3b8', fontWeight:'500' }}>Loading MediPulse…</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                   element={<Dashboard />} />
            <Route path="appointments"     element={<Appointments />} />
            <Route path="mood"             element={<MoodCheck />} />
            <Route path="vitals"           element={<VitalsTracker />} />
            <Route path="settings"         element={<Settings />} />
            <Route path="online-doctor"    element={<OnlineDoctor />} />
            <Route path="notifications"    element={<NotificationsPage />} />
            <Route path="departments"      element={<Departments />} />
            {/* Doctor */}
            <Route path="analytics"        element={<Analytics />} />
            <Route path="my-patients"      element={<DoctorPatients />} />
            <Route path="discharge"        element={<DischargeSummary />} />
            <Route path="adherence"        element={<MedicationAdherence />} />
            {/* Admin */}
            <Route path="beds"             element={<BedOccupancy />} />
            <Route path="pharmacy"         element={<PharmacyInventory />} />
            <Route path="billing"          element={<BillingInvoice />} />
            <Route path="audit"            element={<AuditLog />} />
            <Route path="admin-setup"      element={<AdminSetup />} />
            {/* Shared */}
            <Route path="nearby-hospitals" element={<NearbyHospitals />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
