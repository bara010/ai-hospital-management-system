function formatSlot(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentSlots({ slots = [], selectedSlotStart, onSelect, loading }) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading available slots...</p>;
  }

  if (!slots.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">No slots available for this date.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => {
        const active = selectedSlotStart === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              active
                ? 'border-primary bg-blue-50 text-primary'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            {formatSlot(slot.startTime)}
          </button>
        );
      })}
    </div>
  );
}
