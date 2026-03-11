import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={doctor.profilePictureUrl || 'https://via.placeholder.com/360x220?text=Doctor'}
          alt={doctor.doctorName}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {doctor.availability || 'Available'}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold text-dark">{doctor.doctorName}</h3>
          <p className="text-sm text-slate-500">{doctor.specialization}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Rating: {doctor.rating || 0}</span>
          <span className="text-slate-400">{doctor.ratingCount || 0} reviews</span>
        </div>

        <Link className="btn-primary w-full" to={`/book/${doctor.id}`}>
          Book Appointment
        </Link>
      </div>
    </article>
  );
}
