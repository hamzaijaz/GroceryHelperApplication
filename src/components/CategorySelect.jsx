import { CATEGORIES, categoryLabel } from '../constants/categories';

// emptyOptionLabel adds a first option with value '' (e.g. "All categories" or "Select category").
export default function CategorySelect({ id, label, value, onChange, emptyOptionLabel, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
        {emptyOptionLabel && <option value="">{emptyOptionLabel}</option>}
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {categoryLabel(category)}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
