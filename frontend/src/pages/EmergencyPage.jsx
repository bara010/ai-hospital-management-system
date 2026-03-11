import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Loading from '../components/Loading';
import { patientApi } from '../services/hospitoApi';

export default function EmergencyPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        setSummary(await patientApi.emergencySummary());
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load emergency summary.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <AppLayout>
      <section className="panel border-red-200 bg-red-50/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Emergency Mode</p>
            <h1 className="mt-1 text-2xl font-semibold text-red-700">Critical Patient Summary</h1>
          </div>
          <a href="tel:108" className="btn-danger">Call Emergency 108</a>
        </div>
      </section>

      {loading ? <div className="mt-4"><Loading label="Loading emergency data..." /></div> : null}
      {error ? <p className="error-text mt-4">{error}</p> : null}

      {summary ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="panel">
            <h2 className="panel-title">Medical Summary</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Patient:</span> {summary.patientName}</p>
              <p><span className="font-semibold text-slate-900">Blood Group:</span> {summary.bloodGroup || 'Not provided'}</p>
              <p><span className="font-semibold text-slate-900">Medical Problems:</span> {summary.medicalProblems || 'Not provided'}</p>
              <p><span className="font-semibold text-slate-900">Height:</span> {summary.heightCm ? `${summary.heightCm} cm` : 'Not provided'}</p>
              <p><span className="font-semibold text-slate-900">Weight:</span> {summary.weightKg ? `${summary.weightKg} kg` : 'Not provided'}</p>
            </div>
          </article>

          <article className="panel">
            <h2 className="panel-title">Emergency Contact</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Name:</span> {summary.emergencyContactName || 'Not provided'}</p>
              <p><span className="font-semibold text-slate-900">Phone:</span> {summary.emergencyContactPhone || 'Not provided'}</p>
              {summary.emergencyContactPhone ? (
                <a href={`tel:${summary.emergencyContactPhone}`} className="btn-primary mt-2">Call Contact</a>
              ) : null}
            </div>

            <h3 className="mt-6 text-sm font-semibold text-slate-900">Recent Diagnoses</h3>
            {(summary.recentDiagnoses || []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No recent diagnosis history.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {summary.recentDiagnoses.map((diagnosis) => (
                  <li key={diagnosis}>{diagnosis}</li>
                ))}
              </ul>
            )}
          </article>
        </section>
      ) : null}
    </AppLayout>
  );
}
