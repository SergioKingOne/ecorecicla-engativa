/**
 * 1–5 star rating (RF-16). Interactive when `onChange` is provided; otherwise
 * a read-only display with a text alternative for screen readers.
 */
export default function StarRating({ value = 0, onChange }) {
  if (!onChange) {
    return (
      <span aria-label={`Calificación: ${value} de 5 estrellas`} className="text-amber-500">
        {'★'.repeat(value)}
        <span className="text-gray-300">{'★'.repeat(5 - value)}</span>
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label="Calificación de 1 a 5 estrellas" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(star)}
          className={`text-3xl ${star <= value ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
