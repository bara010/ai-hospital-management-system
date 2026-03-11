function formatDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function badgeClass(status) {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return map[status] || 'bg-slate-50 text-slate-700 border-slate-200';
}

export default function AppointmentTable({ appointments = [], actions }) {
  if (!appointments.length) {
    return <p className="text-sm text-slate-500">No appointments found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Doctor / Patient</th>
            <th className="px-4 py-3">Specialization</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
          {appointments.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{item.doctorName || item.patientName}</td>
              <td className="px-4 py-3">{item.specialization || '-'}</td>
              <td className="px-4 py-3">{formatDateTime(item.startTime)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3">{item.reason || '-'}</td>
              <td className="px-4 py-3">{actions ? actions(item) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
