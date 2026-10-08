import { useId, useState } from 'react';
import CategorySelect from './CategorySelect';
import QuantityInput from './QuantityInput';
import ErrorMessage from './ErrorMessage';
import { CATEGORIES } from '../constants/categories';

const FORM_FIELDS = ['name', 'quantity', 'category'];

function toFormValues(initial) {
  return {
    name: initial?.name ?? '',
    quantity: initial?.quantity ?? 1,
    category: initial?.category ?? CATEGORIES[0],
  };
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = ['Name is required.'];
  if (!Number.isInteger(values.quantity) || values.quantity < 1) {
    errors.quantity = ['Quantity must be a whole number of at least 1.'];
  }
  return errors;
}

// Used for both adding and editing. onSubmit receives a GroceryRequest and may reject with
// an ApiError, whose message and field errors are shown on the form.
export default function GroceryForm({ title, submitLabel, initialValues, onSubmit, onCancel, resetOnSuccess = false }) {
  const idPrefix = useId();
  const [values, setValues] = useState(() => toFormValues(initialValues));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const clientErrors = validate(values);
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      await onSubmit({ name: values.name.trim(), quantity: values.quantity, category: values.category });
      if (resetOnSuccess) setValues(toFormValues());
    } catch (error) {
      const serverErrors = error.fieldErrors ?? {};
      setFieldErrors(serverErrors);
      // Errors for fields that are not on this form (e.g. "request") go in the general message.
      const unmapped = Object.entries(serverErrors)
        .filter(([field]) => !FORM_FIELDS.includes(field))
        .flatMap(([, messages]) => messages);
      setFormError([error.message || 'Something went wrong.', ...unmapped].join(' '));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field) => fieldErrors[field]?.join(' ');

  return (
    <form aria-label={title} onSubmit={handleSubmit} noValidate className="grocery-form">
      <h2>{title}</h2>
      <ErrorMessage message={formError} />
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>Name</label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          aria-invalid={!!fieldError('name')}
        />
        {fieldError('name') && <span className="field-error">{fieldError('name')}</span>}
      </div>
      <QuantityInput
        id={`${idPrefix}-quantity`}
        label="Quantity"
        value={values.quantity}
        onChange={(v) => setField('quantity', v)}
        error={fieldError('quantity')}
      />
      <CategorySelect
        id={`${idPrefix}-category`}
        label="Category"
        value={values.category}
        onChange={(v) => setField('category', v)}
        error={fieldError('category')}
      />
      <div className="actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
