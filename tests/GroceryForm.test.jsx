import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroceryForm from '../src/components/GroceryForm';
import { ApiError } from '../src/api/groceryApi';

function renderForm(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(<GroceryForm title="Add grocery" submitLabel="Add" onSubmit={onSubmit} {...props} />);
  const form = screen.getByRole('form', { name: 'Add grocery' });
  return { onSubmit, form, q: within(form) };
}

describe('GroceryForm', () => {
  it('starts with sensible defaults', () => {
    const { q } = renderForm();
    expect(q.getByLabelText('Name')).toHaveValue('');
    expect(q.getByLabelText('Quantity')).toHaveValue(1);
    expect(q.getByLabelText('Category')).toHaveValue('');
    expect(q.getByRole('option', { name: 'Select category', selected: true })).toBeInTheDocument();
  });

  it('sends a null category when none is selected', async () => {
    const { q, onSubmit } = renderForm();

    await userEvent.type(q.getByLabelText('Name'), 'Bread');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Bread', quantity: 1, category: null });
  });

  it('sends a null category when the user switches back to "Select category"', async () => {
    const { q, onSubmit } = renderForm({ initialValues: { name: 'Steak', quantity: 2, category: 'Meat' } });

    await userEvent.selectOptions(q.getByLabelText('Category'), 'Select category');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Steak', quantity: 2, category: null });
  });

  it('shows "Select category" when editing an item with a null category', () => {
    const { q } = renderForm({ initialValues: { name: 'Bread', quantity: 1, category: null } });
    expect(q.getByLabelText('Category')).toHaveValue('');
  });

  it('pre-fills from initial values', () => {
    const { q } = renderForm({ initialValues: { name: 'Steak', quantity: 2, category: 'Meat' } });
    expect(q.getByLabelText('Name')).toHaveValue('Steak');
    expect(q.getByLabelText('Quantity')).toHaveValue(2);
    expect(q.getByLabelText('Category')).toHaveValue('Meat');
  });

  it('submits a GroceryRequest built from the inputs', async () => {
    const { q, onSubmit } = renderForm();

    await userEvent.type(q.getByLabelText('Name'), '  Banana ');
    await userEvent.click(q.getByRole('button', { name: /increase quantity/i }));
    await userEvent.click(q.getByRole('button', { name: /increase quantity/i }));
    await userEvent.selectOptions(q.getByLabelText('Category'), 'Fruit');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Banana', quantity: 3, category: 'Fruit' });
  });

  it('resets after a successful submit when resetOnSuccess is set', async () => {
    const { q } = renderForm({ resetOnSuccess: true });
    await userEvent.type(q.getByLabelText('Name'), 'Banana');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));
    expect(q.getByLabelText('Name')).toHaveValue('');
  });

  it('validates required name and quantity before calling the API', async () => {
    const { q, onSubmit } = renderForm();

    await userEvent.clear(q.getByLabelText('Quantity'));
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(q.getByText('Name is required.')).toBeInTheDocument();
    expect(q.getByText('Quantity must be a whole number of at least 1.')).toBeInTheDocument();
  });

  it('shows field errors and the message returned by the backend', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(400, 'One or more validation errors occurred.', {
        name: ['Name must be 50 characters or fewer.'],
        category: ['Invalid category.'],
      })
    );
    const { q } = renderForm({ onSubmit });

    await userEvent.type(q.getByLabelText('Name'), 'Something');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(await q.findByRole('alert')).toHaveTextContent('One or more validation errors occurred.');
    expect(q.getByText('Name must be 50 characters or fewer.')).toBeInTheDocument();
    expect(q.getByText('Invalid category.')).toBeInTheDocument();
    // Input is kept so the user can fix it.
    expect(q.getByLabelText('Name')).toHaveValue('Something');
  });

  it('shows field errors that do not map to an input in the general error area', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(400, 'Validation failed.', { request: ['Body is required.'] }));
    const { q } = renderForm({ onSubmit });

    await userEvent.type(q.getByLabelText('Name'), 'x');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(await q.findByRole('alert')).toHaveTextContent('Body is required.');
  });

  it('disables the submit button while saving', async () => {
    let resolve;
    const onSubmit = vi.fn(() => new Promise((r) => (resolve = r)));
    const { q } = renderForm({ onSubmit });

    await userEvent.type(q.getByLabelText('Name'), 'x');
    await userEvent.click(q.getByRole('button', { name: 'Add' }));

    expect(q.getByRole('button', { name: /saving/i })).toBeDisabled();
    resolve();
    expect(await q.findByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('renders a cancel button when onCancel is given', async () => {
    const onCancel = vi.fn();
    const { q } = renderForm({ onCancel });
    await userEvent.click(q.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
