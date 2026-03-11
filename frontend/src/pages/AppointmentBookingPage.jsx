import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AppointmentSlots from '../components/AppointmentSlots';
import { patientApi, publicApi } from '../services/hospitoApi';

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalDateTimeString(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  const hh = String(parsed.getHours()).padStart(2, '0');
  const mm = String(parsed.getMinutes()).padStart(2, '0');
  const ss = String(parsed.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

export default function AppointmentBookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(todayIsoDate());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadDoctor = async () => {
      try {
        const doctors = await publicApi.doctors('');
        if (!mounted) return;
        const found = Array.isArray(doctors) ? doctors.find((d) => String(d.id) === String(doctorId)) : null;
        setDoctor(found || null);
      } catch {
        if (mounted) setDoctor(null);
      }
    };

    loadDoctor();

    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const loadSlots = async (selectedDate) => {
    setLoadingSlots(true);
    setError('');
    setSelectedSlot(null);
    try {
      const data = await publicApi.availableSlots(doctorId, selectedDate);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load available slots.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!date) return;
    loadSlots(date);
  }, [date, doctorId]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return 'No slot selected';
    const parsed = new Date(selectedSlot.startTime);
    if (Number.isNaN(parsed.getTime())) return selectedSlot.startTime;
    return parsed.toLocaleString();
  }, [selectedSlot]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available slot.');
      return;
    }

    setError('');
    setSuccess('');
    setBooking(true);

    try {
      await patientApi.bookAppointment({
        doctorId: Number(doctorId),
        startTime: toLocalDateTimeString(selectedSlot.startTime),
        endTime: toLocalDateTimeString(selectedSlot.endTime),
        reason,
      });
      setSuccess('Appointment request sent successfully.');
      setTimeout(() => navigate('/patient/dashboard?section=appointments'), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="panel space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 1</p>
            <h2 className="panel-title">Select Date</h2>
            <input
              type="date"
              className="input mt-2 max-w-xs"
              value={date}
              min={todayIsoDate()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 2</p>
            <h2 className="panel-title">Select Available Time Slot</h2>
            <p className="mt-1 text-sm text-slate-500">30-minute slots generated from doctor schedule.</p>
            <div className="mt-3">
              <AppointmentSlots
                slots={slots}
                selectedSlotStart={selectedSlot?.startTime || null}
                onSelect={setSelectedSlot}
                loading={loadingSlots}
              />
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step 3</p>
              <h2 className="panel-title">Confirm Booking</h2>
              <p className="mt-1 text-sm text-slate-500">Selected: {selectedSlotLabel}</p>
            </div>

            <div>
              <label className="label">Reason (optional)</label>
              <textarea className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
            {success ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{success}</p> : null}

            <button className="btn-primary" type="submit" disabled={booking || !selectedSlot}>
              {booking ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>

        <aside className="panel">
          <h2 className="panel-title">Doctor</h2>
          {doctor ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Name:</span> {doctor.doctorName}</p>
              <p><span className="font-semibold text-slate-800">Specialization:</span> {doctor.specialization}</p>
              <p><span className="font-semibold text-slate-800">Availability:</span> {doctor.availability || 'As per schedule'}</p>
              <p><span className="font-semibold text-slate-800">Rating:</span> {doctor.rating || 0} ({doctor.ratingCount || 0} reviews)</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Doctor details unavailable.</p>
          )}
        </aside>
      </section>
    </AppLayout>
  );
}
