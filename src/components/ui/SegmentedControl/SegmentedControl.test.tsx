import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl, Segment } from './SegmentedControl';

const mockOptions = [
  { value: 'n-line', title: 'N Line', subtitle: 'North' },
  { value: 's-line', title: 'S Line', subtitle: 'South' },
];

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(<SegmentedControl options={mockOptions} value="n-line" onChange={() => {}} />);

    expect(screen.getByText('N Line')).toBeInTheDocument();
    expect(screen.getByText('S Line')).toBeInTheDocument();
  });

  it('renders subtitles when provided', () => {
    render(<SegmentedControl options={mockOptions} value="n-line" onChange={() => {}} />);

    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
  });

  it('renders without subtitles', () => {
    const optionsNoSubtitle = [
      { value: 'a', title: 'Option A' },
      { value: 'b', title: 'Option B' },
    ];
    render(<SegmentedControl options={optionsNoSubtitle} value="a" onChange={() => {}} />);

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
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

  it('forwards className prop', () => {
    const { container } = render(
      <SegmentedControl options={mockOptions} value="n-line" onChange={() => {}} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles single option', () => {
    const singleOption = [{ value: 'only', title: 'Only Option' }];
    render(<SegmentedControl options={singleOption} value="only" onChange={() => {}} />);

    expect(screen.getByText('Only Option')).toBeInTheDocument();
  });
});

describe('Segment', () => {
  it('renders children', () => {
    render(<Segment>Custom Content</Segment>);
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('applies active state', () => {
    const { container } = render(<Segment active>Active</Segment>);
    expect(container.querySelector('button')?.className).toContain('active');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Segment onClick={handleClick}>Click Me</Segment>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
