import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function HomePage() {
  return (
    <AppLayout>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="panel bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Modern Hospital Stack</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight lg:text-4xl">
            HOSPITO makes appointments, records, and consultations simple.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-blue-100 lg:text-base">
            Built for patients, doctors, and admins with secure TOTP login, live video consultation,
            appointment automation, and full medical workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Create Account
            </Link>
            <Link to="/login" className="rounded-xl border border-blue-200/50 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Login
            </Link>
            <Link to="/doctors" className="rounded-xl border border-blue-200/50 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Browse Doctors
            </Link>
          </div>
        </div>

        <aside className="panel">
          <h2 className="panel-title">Platform Highlights</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="rounded-xl bg-slate-50 p-3">Role-based dashboards with clean workflow separation</li>
            <li className="rounded-xl bg-slate-50 p-3">Real appointment slots generated from doctor schedules</li>
            <li className="rounded-xl bg-slate-50 p-3">Video consultation with records and prescriptions</li>
            <li className="rounded-xl bg-slate-50 p-3">Secure auth with email + password + TOTP</li>
          </ul>
        </aside>
      </section>
    </AppLayout>
  );
}
