import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategorySelect from '../src/components/CategorySelect';
import { CATEGORIES } from '../src/constants/categories';

describe('CategorySelect', () => {
  it('renders every category from the API as an option', () => {
    render(<CategorySelect id="c" label="Category" value="Dairy" onChange={() => {}} />);
    const options = screen.getAllByRole('option').map((o) => o.value);
    expect(options).toEqual(CATEGORIES);
    expect(CATEGORIES).toHaveLength(14);
  });

  it('shows friendly labels for multi-word categories', () => {
    render(<CategorySelect id="c" label="Category" value="FrozenFood" onChange={() => {}} />);
    expect(screen.getByRole('option', { name: 'Frozen Food' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cleaning Supplies' })).toBeInTheDocument();
  });

  it('can include an empty first option, e.g. "All categories" for filtering', () => {
    render(<CategorySelect id="c" label="Filter" value="" onChange={() => {}} emptyOptionLabel="All categories" />);
    const first = screen.getAllByRole('option')[0];
    expect(first).toHaveTextContent('All categories');
    expect(first).toHaveValue('');
    expect(screen.getByLabelText('Filter')).toHaveValue('');
  });

  it('can show a "Select category" placeholder for an optional category', async () => {
    const onChange = vi.fn();
    render(<CategorySelect id="c" label="Category" value="Fruit" onChange={onChange} emptyOptionLabel="Select category" />);

    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Select category');

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onChange with the selected category', async () => {
    const onChange = vi.fn();
    render(<CategorySelect id="c" label="Category" value="Dairy" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Meat');
    expect(onChange).toHaveBeenCalledWith('Meat');
  });
});
