import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import DoctorCard from '../components/DoctorCard';
import Loading from '../components/Loading';
import { SPECIALIZATION_OPTIONS } from '../constants/medicalSpecializations';
import { publicApi } from '../services/hospitoApi';

export default function DoctorListPage() {
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDoctors = async (specialization = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await publicApi.doctors(specialization);
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    loadDoctors(search.trim());
  };

  return (
    <AppLayout>
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-dark">Doctor Directory</h1>
            <p className="mt-1 text-sm text-slate-500">Find specialists and book available 30-minute slots.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {doctors.length} doctors listed
          </span>
        </div>

        <form className="mt-5 flex flex-wrap gap-2" onSubmit={onSearch}>
          <input
            className="input max-w-xl flex-1"
            list="specialization-options"
            placeholder="Search by specialization"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary" type="submit">Search</button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setSearch('');
              loadDoctors('');
            }}
          >
            Clear
          </button>
        </form>

        {loading ? <div className="mt-4"><Loading label="Loading doctors..." /></div> : null}
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
      </section>

      <datalist id="specialization-options">
        {SPECIALIZATION_OPTIONS.map((specialization) => (
          <option key={specialization} value={specialization} />
        ))}
      </datalist>
    </AppLayout>
  );
}
