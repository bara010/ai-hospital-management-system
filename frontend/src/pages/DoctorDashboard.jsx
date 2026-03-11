import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppLayout from '../components/AppLayout';
import AppointmentTable from '../components/AppointmentTable';
import DashboardCard from '../components/DashboardCard';
import Loading from '../components/Loading';
import { doctorApi, messageApi } from '../services/hospitoApi';

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageContacts, setMessageContacts] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, contacts] = await Promise.all([
        doctorApi.appointments(),
        messageApi.contacts().catch(() => []),
      ]);
      setAppointments(Array.isArray(list) ? list : []);
      setMessageContacts(Array.isArray(contacts) ? contacts : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load doctor dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todayAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointments.filter((item) => new Date(item.startTime).toDateString() === today).length;
  }, [appointments]);

  const totalPatients = useMemo(() => {
    const ids = new Set(appointments.map((item) => item.patientId));
    return ids.size;
  }, [appointments]);

  const pendingRequests = useMemo(
    () => appointments.filter((item) => item.status === 'PENDING').length,
    [appointments]
  );

  const weeklyAppointmentsData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        key: dayKey(d),
        label: d.toLocaleDateString([], { weekday: 'short' }),
        appointments: 0,
      });
    }

    appointments.forEach((item) => {
      const key = dayKey(new Date(item.startTime));
      const bucket = days.find((d) => d.key === key);
      if (bucket) bucket.appointments += 1;
    });

    return days;
  }, [appointments]);

  const patientStatsData = useMemo(() => {
    const byStatus = {
      PENDING: 0,
      APPROVED: 0,
      COMPLETED: 0,
      REJECTED: 0,
      CANCELLED: 0,
    };

    appointments.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(byStatus, item.status)) {
        byStatus[item.status] += 1;
      }
    });

    return [
      { name: 'Pending', value: byStatus.PENDING },
      { name: 'Approved', value: byStatus.APPROVED },
      { name: 'Completed', value: byStatus.COMPLETED },
      { name: 'Rejected', value: byStatus.REJECTED },
      { name: 'Cancelled', value: byStatus.CANCELLED },
    ].filter((item) => item.value > 0);
  }, [appointments]);

  const updateStatus = async (appointmentId, status) => {
    try {
      await doctorApi.updateAppointmentStatus(appointmentId, {
        status,
        cancellationReason: status === 'REJECTED' ? 'Doctor unavailable for selected slot' : null,
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update appointment status.');
    }
  };

  return (
    <AppLayout>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Today's Appointments" value={todayAppointments} hint="Current day" trend="up" />
        <DashboardCard title="Total Patients" value={totalPatients} hint="Unique patients" trend="neutral" />
        <DashboardCard title="Pending Requests" value={pendingRequests} hint="Needs approval" trend={pendingRequests ? 'down' : 'up'} />
        <DashboardCard title="Messages" value={messageContacts.length} hint="Active chats" trend="neutral" />
      </section>

      {loading ? <div className="mt-4"><Loading label="Loading analytics..." /></div> : null}
      {error ? <p className="error-text mt-4">{error}</p> : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="panel">
          <h2 className="panel-title">Weekly Appointments</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAppointmentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <h2 className="panel-title">Patient Statistics</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientStatsData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {patientStatsData.map((entry, index) => {
                    const colors = ['#2563EB', '#22C55E', '#0EA5E9', '#F97316', '#EF4444'];
                    return <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="panel-title">Appointment Queue</h2>
          <div className="row-actions">
            <Link className="btn-secondary" to="/messages">Open Messages</Link>
            <Link className="btn-secondary" to="/profile">Profile</Link>
          </div>
        </div>

        <AppointmentTable
          appointments={appointments}
          actions={(item) => (
            <div className="row-actions">
              {item.status === 'PENDING' ? (
                <>
                  <button className="btn-primary" onClick={() => updateStatus(item.id, 'APPROVED')}>Approve</button>
                  <button className="btn-danger" onClick={() => updateStatus(item.id, 'REJECTED')}>Reject</button>
                </>
              ) : null}
              {item.status === 'APPROVED' ? (
                <>
                  <button className="btn-secondary" onClick={() => updateStatus(item.id, 'COMPLETED')}>Complete</button>
                  <Link className="btn-secondary" to={`/video/${item.id}`}>Start Call</Link>
                </>
              ) : null}
            </div>
          )}
        />
      </section>
    </AppLayout>
  );
}


