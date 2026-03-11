export default function RatingStars({ value = 0, onChange, disabled = false, size = 'md' }) {
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(star)}
            className={`transition ${disabled ? 'cursor-default' : 'hover:scale-110'} ${active ? 'text-amber-500' : 'text-slate-300'}`}
            aria-label={`Rate ${star} star`}
          >
            <svg viewBox="0 0 24 24" className={starSize} fill="currentColor">
              <path d="M12 17.3 18.2 21l-1.7-7 5.5-4.7-7.2-.6L12 2 9.2 8.7 2 9.3 7.5 14l-1.7 7L12 17.3Z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
