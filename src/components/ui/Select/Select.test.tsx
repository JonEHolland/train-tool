import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

const mockOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('renders options and shows selected value', () => {
    render(<Select label="Choose" options={mockOptions} value="b" onChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toContainHTML('Option A');
    expect(select).toContainHTML('Option B');
    expect(select).toContainHTML('Option C');
    expect(select.value).toBe('b');
  });

  it('calls onChange with selected value', () => {
    const handleChange = vi.fn();
    render(<Select label="Choose" options={mockOptions} value="a" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c' } });
    expect(handleChange).toHaveBeenCalledWith('c');
  });

  it('is accessible by label', () => {
    render(<Select label="Your Station" options={mockOptions} value="a" onChange={() => {}} />);
    expect(screen.getByLabelText('Your Station')).toBeInTheDocument();
  });
});
