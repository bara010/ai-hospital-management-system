import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import AppointmentTable from '../components/AppointmentTable';
import Loading from '../components/Loading';
import RatingStars from '../components/RatingStars';
import { useAuth } from '../hooks/useAuth';
import { adminApi, doctorApi, patientApi } from '../services/hospitoApi';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const role = user?.role;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingDrafts, setRatingDrafts] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (role === 'PATIENT') {
        setAppointments(await patientApi.appointments());
      } else if (role === 'DOCTOR') {
        setAppointments(await doctorApi.appointments());
      } else if (role === 'ADMIN') {
        setAppointments(await adminApi.appointments());
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  const cancelAppointment = async (id) => {
    try {
      await patientApi.cancelAppointment(id, 'Cancelled by patient');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to cancel appointment.');
    }
  };

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

  const submitRating = async (appointmentId) => {
    const draft = ratingDrafts[appointmentId] || { rating: 5, review: '' };
    try {
      await patientApi.submitRating({
        appointmentId,
        rating: draft.rating,
        review: draft.review,
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit rating.');
    }
  };

  return (
    <AppLayout>
      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="panel-title">Appointments</h2>
          {role === 'PATIENT' ? <Link className="btn-primary" to="/doctors">Book New</Link> : null}
        </div>

        {loading ? <Loading label="Loading appointments..." /> : null}
        {error ? <p className="error-text mt-3">{error}</p> : null}

        {!loading ? (
          <AppointmentTable
            appointments={appointments}
            actions={(item) => {
              if (role === 'PATIENT') {
                return (
                  <div className="row-actions">
                    {(item.status === 'PENDING' || item.status === 'APPROVED') ? (
                      <button className="btn-danger" onClick={() => cancelAppointment(item.id)}>Cancel</button>
                    ) : null}
                    {item.status === 'APPROVED' ? <Link className="btn-secondary" to={`/video/${item.id}`}>Join Call</Link> : null}
                    {item.status === 'COMPLETED' ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <RatingStars
                          value={ratingDrafts[item.id]?.rating || 5}
                          onChange={(value) =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [item.id]: { ...(prev[item.id] || {}), rating: value },
                            }))
                          }
                          size="sm"
                        />
                        <input
                          className="input max-w-44"
                          placeholder="Review"
                          value={ratingDrafts[item.id]?.review || ''}
                          onChange={(e) =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [item.id]: { ...(prev[item.id] || {}), review: e.target.value },
                            }))
                          }
                        />
                        <button className="btn-primary" onClick={() => submitRating(item.id)}>Rate</button>
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (role === 'DOCTOR') {
                return (
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
                );
              }

              return '-';
            }}
          />
        ) : null}
      </section>
    </AppLayout>
  );
}
