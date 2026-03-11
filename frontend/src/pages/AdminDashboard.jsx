import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import DashboardCard from '../components/DashboardCard';
import Loading from '../components/Loading';
import { adminApi } from '../services/hospitoApi';

function formatDateTime(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [billForm, setBillForm] = useState({
    patientId: '',
    appointmentId: '',
    amount: '',
    currency: 'INR',
    description: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceCoverageAmount: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, doctorList, patientList, appointmentList, billList, labList, audits] = await Promise.all([
        adminApi.dashboard(),
        adminApi.doctors(),
        adminApi.patients(),
        adminApi.appointments(),
        adminApi.bills(),
        adminApi.labOrders(),
        adminApi.auditLogs(200),
      ]);

      setSummary(dashboard || null);
      setDoctors(Array.isArray(doctorList) ? doctorList : []);
      setPatients(Array.isArray(patientList) ? patientList : []);
      setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
      setBills(Array.isArray(billList) ? billList : []);
      setLabOrders(Array.isArray(labList) ? labList : []);
      setAuditLogs(Array.isArray(audits) ? audits : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingApprovals = useMemo(
    () => doctors.filter((doctor) => doctor.approvalStatus === 'PENDING').length,
    [doctors]
  );

  const updateApproval = async (doctorId, status) => {
    try {
      await adminApi.updateDoctorApproval(doctorId, status);
      setMessage(`Doctor marked as ${status}.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update doctor approval.');
    }
  };

  const createBill = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createBill({
        patientId: Number(billForm.patientId),
        appointmentId: billForm.appointmentId ? Number(billForm.appointmentId) : null,
        amount: Number(billForm.amount),
        currency: billForm.currency,
        description: billForm.description,
        insuranceProvider: billForm.insuranceProvider || null,
        insurancePolicyNumber: billForm.insurancePolicyNumber || null,
        insuranceCoverageAmount: billForm.insuranceCoverageAmount ? Number(billForm.insuranceCoverageAmount) : null,
      });
      setMessage('Bill created successfully.');
      setBillForm({
        patientId: '',
        appointmentId: '',
        amount: '',
        currency: 'INR',
        description: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceCoverageAmount: '',
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create bill.');
    }
  };

  return (
    <AppLayout>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Patients" value={summary?.totalPatients ?? 0} hint="Registered" trend="neutral" />
        <DashboardCard title="Total Doctors" value={summary?.totalDoctors ?? 0} hint="On platform" trend="neutral" />
        <DashboardCard title="Appointments" value={summary?.totalAppointments ?? 0} hint="All statuses" trend="up" />
        <DashboardCard title="Pending Approvals" value={pendingApprovals} hint="Requires review" trend={pendingApprovals ? 'down' : 'up'} />
      </section>

      {loading ? <div className="mt-4"><Loading label="Loading admin dashboard..." /></div> : null}
      {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}

      <section className="panel mt-6">
        <h2 className="panel-title">Doctor Approvals</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {doctors.map((doctor) => (
                <tr key={doctor.doctorId}>
                  <td className="px-4 py-3 font-medium">{doctor.fullName}</td>
                  <td className="px-4 py-3">{doctor.specialization}</td>
                  <td className="px-4 py-3">{doctor.approvalStatus}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-primary" onClick={() => updateApproval(doctor.doctorId, 'APPROVED')}>Approve</button>
                      <button className="btn-danger" onClick={() => updateApproval(doctor.doctorId, 'REJECTED')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <form className="panel" onSubmit={createBill}>
          <h2 className="panel-title">Create Billing Record</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Patient ID" value={billForm.patientId} onChange={(e) => setBillForm((p) => ({ ...p, patientId: e.target.value }))} required />
            <input className="input" placeholder="Appointment ID" value={billForm.appointmentId} onChange={(e) => setBillForm((p) => ({ ...p, appointmentId: e.target.value }))} />
            <input className="input" type="number" step="0.01" placeholder="Amount" value={billForm.amount} onChange={(e) => setBillForm((p) => ({ ...p, amount: e.target.value }))} required />
            <input className="input" placeholder="Currency" value={billForm.currency} onChange={(e) => setBillForm((p) => ({ ...p, currency: e.target.value }))} />
            <input className="input sm:col-span-2" placeholder="Description" value={billForm.description} onChange={(e) => setBillForm((p) => ({ ...p, description: e.target.value }))} />
            <input className="input" placeholder="Insurance Provider" value={billForm.insuranceProvider} onChange={(e) => setBillForm((p) => ({ ...p, insuranceProvider: e.target.value }))} />
            <input className="input" placeholder="Policy Number" value={billForm.insurancePolicyNumber} onChange={(e) => setBillForm((p) => ({ ...p, insurancePolicyNumber: e.target.value }))} />
            <input className="input" type="number" step="0.01" placeholder="Insurance Coverage" value={billForm.insuranceCoverageAmount} onChange={(e) => setBillForm((p) => ({ ...p, insuranceCoverageAmount: e.target.value }))} />
          </div>
          <button className="btn-primary mt-4" type="submit">Create Bill</button>
        </form>

        <article className="panel">
          <h2 className="panel-title">Lab Orders</h2>
          <ul className="mt-4 space-y-3">
            {labOrders.slice(0, 10).map((order) => (
              <li key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{order.testName}</p>
                <p className="text-sm text-slate-500">{order.status} • {order.patientName}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel mt-6">
        <h2 className="panel-title">Recent Audit Trail</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {auditLogs.slice(0, 25).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.actorEmail || log.actorRole || 'SYSTEM'}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.entityType} {log.entityId ? `#${log.entityId}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="panel">
          <h2 className="panel-title">Patients</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {patients.slice(0, 12).map((patient) => (
              <li key={patient.patientId}>{patient.fullName} ({patient.email})</li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h2 className="panel-title">Recent Appointments</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {appointments.slice(0, 12).map((appt) => (
              <li key={appt.id}>#{appt.id} {appt.patientName} with {appt.doctorName} - {appt.status}</li>
            ))}
          </ul>
        </article>
      </section>
    </AppLayout>
  );
}
