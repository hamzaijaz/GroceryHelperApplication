const MIN = 1;

// Number input with explicit up/down arrow buttons. The value is a number, or '' while the
// user has cleared the field so they can type a new value.
export default function QuantityInput({ id, label, value, onChange, error }) {
  const current = value === '' ? 0 : Number(value);

  function handleType(e) {
    const raw = e.target.value;
    onChange(raw === '' ? '' : Number(raw));
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="quantity">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onChange(Math.max(MIN, current - 1))}
          disabled={current <= MIN}
        >
          ▼
        </button>
        <input id={id} type="number" min={MIN} step={1} value={value} onChange={handleType} aria-invalid={!!error} />
        <button type="button" aria-label="Increase quantity" onClick={() => onChange(current + 1)}>
          ▲
        </button>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
