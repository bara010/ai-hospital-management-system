import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AppointmentTable from '../components/AppointmentTable';
import DashboardCard from '../components/DashboardCard';
import Loading from '../components/Loading';
import { messageApi, patientApi, profileApi, publicApi } from '../services/hospitoApi';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [messageContacts, setMessageContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [myAppointments, availableDoctors, myProfile, contacts] = await Promise.all([
        patientApi.appointments(),
        publicApi.doctors(''),
        profileApi.me(),
        messageApi.contacts().catch(() => []),
      ]);

      setAppointments(Array.isArray(myAppointments) ? myAppointments : []);
      setDoctors(Array.isArray(availableDoctors) ? availableDoctors : []);
      setProfile(myProfile || null);
      setMessageContacts(Array.isArray(contacts) ? contacts : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load patient dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upcomingCount = useMemo(
    () => appointments.filter((a) => ['PENDING', 'APPROVED'].includes(a.status)).length,
    [appointments]
  );

  return (
    <AppLayout>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Upcoming Appointments" value={upcomingCount} hint="Scheduled and pending" trend="up" />
        <DashboardCard title="Available Doctors" value={doctors.length} hint="Approved specialists" trend="neutral" />
        <DashboardCard title="Messages" value={messageContacts.length} hint="Doctor conversations" trend="neutral" />
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Medical Summary</p>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p><span className="font-semibold text-slate-900">Blood:</span> {profile?.bloodGroup || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Problems:</span> {profile?.allergies || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Height:</span> {profile?.heightCm ? `${profile.heightCm} cm` : 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Weight:</span> {profile?.weightKg ? `${profile.weightKg} kg` : 'Not set'}</p>
          </div>
        </article>
      </section>

      {loading ? <div className="mt-4"><Loading label="Loading dashboard..." /></div> : null}
      {error ? <p className="error-text mt-4">{error}</p> : null}

      <section className="panel mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="panel-title">Upcoming Appointments</h2>
          <div className="row-actions">
            <Link className="btn-primary" to="/doctors">Book Appointment</Link>
            <Link className="btn-secondary" to="/emergency">Emergency</Link>
          </div>
        </div>

        <AppointmentTable
          appointments={appointments}
          actions={(item) => (
            <div className="row-actions">
              {item.status === 'APPROVED' ? <Link className="btn-secondary" to={`/video/${item.id}`}>Join Call</Link> : null}
              {(item.status === 'PENDING' || item.status === 'APPROVED') ? (
                <button
                  className="btn-danger"
                  onClick={async () => {
                    await patientApi.cancelAppointment(item.id, 'Cancelled by patient');
                    await load();
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          )}
        />
      </section>
    </AppLayout>
  );
}
