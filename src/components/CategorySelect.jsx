import { CATEGORIES, categoryLabel } from '../constants/categories';

export default function CategorySelect({ id, label, value, onChange, includeAll = false, error }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
        {includeAll && <option value="">All categories</option>}
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
