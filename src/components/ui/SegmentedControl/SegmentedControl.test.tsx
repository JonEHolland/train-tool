import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

const mockOptions = [
  { value: 'n-line', title: 'N Line', subtitle: 'North' },
  { value: 's-line', title: 'S Line', subtitle: 'South' },
];

describe('SegmentedControl', () => {
  it('renders options with subtitles', () => {
    render(<SegmentedControl options={mockOptions} value="n-line" onChange={() => {}} />);

    expect(screen.getByText('N Line')).toBeInTheDocument();
    expect(screen.getByText('S Line')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
  });

  it('marks active option', () => {
    const { container } = render(
      <SegmentedControl options={mockOptions} value="n-line" onChange={() => {}} />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).toContain('active');
    expect(buttons[1].className).not.toContain('active');
  });

  it('calls onChange with option value when clicked', () => {
    const handleChange = vi.fn();
    render(<SegmentedControl options={mockOptions} value="n-line" onChange={handleChange} />);

    fireEvent.click(screen.getByText('S Line'));
    expect(handleChange).toHaveBeenCalledWith('s-line');
  });
});
