import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Loading from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { doctorApi, patientApi } from '../services/hospitoApi';
import { capitalizeWordsInput } from '../utils/text';

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(baseDate, days) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default function MedicationsPage() {
  const { user } = useAuth();
  const role = user?.role;

  const [items, setItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date();
  const [draft, setDraft] = useState({
    patientId: '',
    appointmentId: '',
    medication: '',
    dosage: '',
    instructions: '',
    frequencyPerDay: 2,
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(addDays(today, 6)),
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (role === 'PATIENT') {
        setItems(await patientApi.medications());
        setAppointments([]);
      } else if (role === 'DOCTOR') {
        const [medications, doctorAppointments] = await Promise.all([
          doctorApi.medications(),
          doctorApi.appointments(),
        ]);
        setItems(Array.isArray(medications) ? medications : []);
        setAppointments(Array.isArray(doctorAppointments) ? doctorAppointments : []);
      } else {
        setItems([]);
        setAppointments([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load medications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const patientOptions = useMemo(() => {
    const map = new Map();
    appointments.forEach((item) => {
      if (!item?.patientId) return;
      if (!map.has(item.patientId)) {
        map.set(item.patientId, {
          patientId: item.patientId,
          patientName: item.patientName || `Patient ${item.patientId}`,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [appointments]);

  const appointmentsByPatient = useMemo(() => {
    const map = new Map();
    appointments.forEach((item) => {
      if (!item?.patientId || !item?.id) return;
      if (!map.has(item.patientId)) {
        map.set(item.patientId, []);
      }
      map.get(item.patientId).push(item);
    });

    map.forEach((list) => {
      list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    });

    return map;
  }, [appointments]);

  const selectedPatientAppointments = draft.patientId
    ? appointmentsByPatient.get(Number(draft.patientId)) || []
    : [];

  const onChangeDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onPatientChange = (value) => {
    const patientId = value;
    const options = appointmentsByPatient.get(Number(patientId)) || [];
    const defaultAppointmentId = options.length > 0 ? String(options[0].id) : '';
    setDraft((prev) => ({
      ...prev,
      patientId,
      appointmentId: defaultAppointmentId,
    }));
  };

  const prescribe = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!draft.patientId) {
      setError('Select a patient to prescribe medication.');
      return;
    }

    try {
      await doctorApi.createMedicationPlan({
        patientId: Number(draft.patientId),
        appointmentId: draft.appointmentId ? Number(draft.appointmentId) : null,
        medication: draft.medication.trim(),
        dosage: draft.dosage.trim(),
        instructions: draft.instructions.trim() || null,
        frequencyPerDay: Number(draft.frequencyPerDay),
        startDate: draft.startDate,
        endDate: draft.endDate,
      });
      setSuccess('Medication plan prescribed successfully.');
      setDraft((prev) => ({
        ...prev,
        medication: '',
        dosage: '',
        instructions: '',
      }));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to prescribe medication.');
    }
  };

  const toggle = async (item) => {
    try {
      if (role === 'PATIENT') {
        await patientApi.takeMedicationDose(item.id);
      } else if (role === 'DOCTOR') {
        await doctorApi.updateMedicationPlanStatus(item.id, !item.active);
      }
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update medication.');
    }
  };

  return (
    <AppLayout>
      <section className="panel">
        <h2 className="panel-title">Medications</h2>
        {loading ? <div className="mt-3"><Loading label="Loading medications..." /></div> : null}
        {error ? <p className="error-text mt-3">{error}</p> : null}
        {success ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        {role === 'DOCTOR' ? (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Prescribe Medication</h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a patient from your appointments and create a plan with schedule details.
            </p>

            {patientOptions.length === 0 ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                No patients found in appointments yet. Once you have appointments, you can prescribe medications here.
              </p>
            ) : (
              <form onSubmit={prescribe} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-600">
                  Patient
                  <select
                    className="input mt-1"
                    value={draft.patientId}
                    onChange={(e) => onPatientChange(e.target.value)}
                    required
                  >
                    <option value="">Select patient</option>
                    {patientOptions.map((option) => (
                      <option key={option.patientId} value={option.patientId}>
                        {option.patientName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Appointment
                  <select
                    className="input mt-1"
                    value={draft.appointmentId}
                    onChange={(e) => onChangeDraft('appointmentId', e.target.value)}
                  >
                    <option value="">Not linked</option>
                    {selectedPatientAppointments.map((appt) => (
                      <option key={appt.id} value={appt.id}>
                        #{appt.id} - {new Date(appt.startTime).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Medicine Name
                  <input
                    className="input mt-1"
                    value={draft.medication}
                    onChange={(e) => onChangeDraft('medication', capitalizeWordsInput(e.target.value))}
                    placeholder="Example: Amoxicillin 500mg"
                    required
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Dosage
                  <input
                    className="input mt-1"
                    value={draft.dosage}
                    onChange={(e) => onChangeDraft('dosage', capitalizeWordsInput(e.target.value))}
                    placeholder="Example: 1 tablet after food"
                    required
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Frequency (per day)
                  <input
                    className="input mt-1"
                    type="number"
                    min={1}
                    max={12}
                    value={draft.frequencyPerDay}
                    onChange={(e) => onChangeDraft('frequencyPerDay', e.target.value)}
                    required
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  Start Date
                  <input
                    className="input mt-1"
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => onChangeDraft('startDate', e.target.value)}
                    required
                  />
                </label>

                <label className="text-xs font-medium text-slate-600">
                  End Date
                  <input
                    className="input mt-1"
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => onChangeDraft('endDate', e.target.value)}
                    required
                  />
                </label>

                <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                  Instructions
                  <textarea
                    className="input mt-1 min-h-24"
                    value={draft.instructions}
                    onChange={(e) => onChangeDraft('instructions', capitalizeWordsInput(e.target.value))}
                    placeholder="Example: Take after breakfast and dinner for 7 days."
                  />
                </label>

                <div className="sm:col-span-2">
                  <button className="btn-primary" type="submit">
                    Prescribe Medication
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{item.medication}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {item.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-slate-500">{item.dosage}</p>
              <p className="mt-1 text-sm text-slate-500">Adherence: {item.adherencePercent}%</p>
              <p className="mt-1 text-xs text-slate-500">
                Schedule: {formatDate(item.startDate)} to {formatDate(item.endDate)} ({item.frequencyPerDay}x/day)
              </p>
              {role === 'DOCTOR' ? (
                <p className="mt-1 text-xs text-slate-500">Patient: {item.patientName}</p>
              ) : null}
              <button className="btn-secondary mt-3" onClick={() => toggle(item)} disabled={role === 'PATIENT' && !item.active}>
                {role === 'PATIENT' ? 'Mark Dose Taken' : item.active ? 'Deactivate' : 'Activate'}
              </button>
            </article>
          ))}
        </div>

        {!loading && items.length === 0 ? <p className="mt-3 text-sm text-slate-500">No medication plans found.</p> : null}
      </section>
    </AppLayout>
  );
}
