import { useState } from 'react';
import { aiApi } from '../services/hospitoApi';
import { capitalizeWordsInput } from '../utils/text';

function sectionTitle(text) {
  return <p className="text-sm font-semibold text-slate-800">{text}</p>;
}

export default function MedicineInfoLookup() {
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await aiApi.medicineInfo(name.trim());
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to fetch medicine details.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderList = (items, emptyText) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    return (
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <section className="panel">
      <h2 className="panel-title">Medicine AI Lookup</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter any medicine name to view usage, dosage guidance, warnings, and side effects.
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          placeholder="Example: Paracetamol"
          value={name}
          onChange={(e) => setName(capitalizeWordsInput(e.target.value))}
        />
        <button className="btn-primary" type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Checking...' : 'Get Details'}
        </button>
      </form>

      {error ? <p className="error-text mt-3">{error}</p> : null}

      {result ? (
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-sm text-slate-500">Medicine</p>
            <p className="text-lg font-semibold text-slate-900">{capitalizeWordsInput(result.genericName || result.query || name)}</p>
            <p className="text-xs text-slate-500">Source: {result.source || 'HOSPITO AI'}</p>
          </div>

          <div>
            {sectionTitle('Brand Names')}
            {renderList(result.brandNames, 'No brand names available.')}
          </div>

          <div>
            {sectionTitle('Uses')}
            {renderList(result.uses, 'No usage details available.')}
          </div>

          <div>
            {sectionTitle('Dosage & Administration')}
            {renderList(result.dosageAndAdministration, 'No dosage details available.')}
          </div>

          <div>
            {sectionTitle('Side Effects')}
            {renderList(result.sideEffects, 'No side effect details available.')}
          </div>

          <div>
            {sectionTitle('Warnings')}
            {renderList(result.warnings, 'No warning details available.')}
          </div>

          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            This is educational support. Final medication decisions must come from your doctor.
          </p>
        </div>
      ) : null}
    </section>
  );
}
