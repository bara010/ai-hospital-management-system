import { useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../services/hospitoApi';
import { capitalizeWordsInput } from '../utils/text';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await aiApi.symptomCheck(symptoms.trim());
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to analyze symptoms.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel-title">AI Symptom Checker</h2>
      <p className="mt-1 text-sm text-slate-500">
        Describe your symptoms and get likely category plus doctor recommendations.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea
          className="input min-h-28"
          placeholder="Example: I have headache and fever since yesterday"
          value={symptoms}
          onChange={(e) => setSymptoms(capitalizeWordsInput(e.target.value))}
        />
        <button className="btn-primary" type="submit" disabled={loading || !symptoms.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Symptoms'}
        </button>
      </form>

      {error ? <p className="error-text mt-3">{error}</p> : null}

      {result ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm text-slate-500">Recommended Specialist</p>
            <p className="text-lg font-semibold text-slate-900">{result.recommendedSpecialization}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Possible Conditions</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(result.possibleConditions || []).map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-slate-500">Advice</p>
            <p className="text-sm text-slate-700">{result.advice}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Recommended Doctors</p>
            <div className="mt-2 grid gap-2">
              {(result.recommendedDoctors || []).map((doctor) => (
                <div key={doctor.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
                  <div>
                    <p className="font-medium text-slate-900">{doctor.doctorName}</p>
                    <p className="text-sm text-slate-500">{doctor.specialization}</p>
                  </div>
                  <Link className="btn-primary" to={`/book/${doctor.id}`}>
                    Book
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
