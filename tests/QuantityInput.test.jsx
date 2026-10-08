import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuantityInput from '../src/components/QuantityInput';

function Harness({ initial = 1, onChange = () => {} }) {
  const [value, setValue] = useState(initial);
  return (
    <QuantityInput
      id="qty"
      label="Quantity"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe('QuantityInput', () => {
  it('shows the current value', () => {
    render(<Harness initial={4} />);
    expect(screen.getByLabelText('Quantity')).toHaveValue(4);
  });

  it('increments with the up arrow', async () => {
    const onChange = vi.fn();
    render(<Harness initial={4} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /increase quantity/i }));

    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(screen.getByLabelText('Quantity')).toHaveValue(5);
  });

  it('decrements with the down arrow', async () => {
    render(<Harness initial={4} />);
    await userEvent.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(screen.getByLabelText('Quantity')).toHaveValue(3);
  });

  it('disables the down arrow at the minimum of 1', () => {
    render(<Harness initial={1} />);
    expect(screen.getByRole('button', { name: /decrease quantity/i })).toBeDisabled();
  });

  it('lets the user type a number', async () => {
    const onChange = vi.fn();
    render(<Harness initial={1} onChange={onChange} />);
    const input = screen.getByLabelText('Quantity');

    await userEvent.clear(input);
    await userEvent.type(input, '12');

    expect(input).toHaveValue(12);
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it('reports an empty string while the field is cleared', async () => {
    const onChange = vi.fn();
    render(<Harness initial={3} onChange={onChange} />);

    await userEvent.clear(screen.getByLabelText('Quantity'));

    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('treats an empty value as 0 when incrementing', async () => {
    render(<Harness initial="" />);
    await userEvent.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(screen.getByLabelText('Quantity')).toHaveValue(1);
  });
});
