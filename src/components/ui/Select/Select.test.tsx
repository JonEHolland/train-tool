import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

const mockOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('renders label', () => {
    render(<Select label="Choose" options={mockOptions} value="a" onChange={() => {}} />);
    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Choose" options={mockOptions} value="a" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toContainHTML('Option A');
    expect(select).toContainHTML('Option B');
    expect(select).toContainHTML('Option C');
  });

  it('shows selected value', () => {
    render(<Select label="Choose" options={mockOptions} value="b" onChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('b');
  });

  it('calls onChange with selected value', () => {
    const handleChange = vi.fn();
    render(<Select label="Choose" options={mockOptions} value="a" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c' } });
    expect(handleChange).toHaveBeenCalledWith('c');
  });

  it('associates label with select via htmlFor', () => {
    render(<Select label="Choose" options={mockOptions} value="a" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    const label = screen.getByText('Choose');

    expect(select).toHaveAttribute('id');
    expect(label).toHaveAttribute('for', select.getAttribute('id'));
  });

  it('uses provided id', () => {
    render(<Select id="my-select" label="Choose" options={mockOptions} value="a" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'my-select');
  });

  it('generates id from label if not provided', () => {
    render(<Select label="Your Station" options={mockOptions} value="a" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'select-your-station');
  });

  it('forwards className prop', () => {
    const { container } = render(
      <Select label="Choose" options={mockOptions} value="a" onChange={() => {}} className="custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  it('is accessible by label', () => {
    render(<Select label="Your Station" options={mockOptions} value="a" onChange={() => {}} />);

    expect(screen.getByLabelText('Your Station')).toBeInTheDocument();
  });

  it('handles empty options', () => {
    render(<Select label="Choose" options={[]} value="" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select.querySelectorAll('option')).toHaveLength(0);
  });
});
