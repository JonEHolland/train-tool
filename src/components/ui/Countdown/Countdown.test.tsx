import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Countdown } from './Countdown';

// Helper to check if element has a class containing the given substring
// (handles CSS Module transformed class names)
function hasClassContaining(element: Element | null, substring: string): boolean {
  if (!element) return false;
  return element.className.split(' ').some(cls => cls.includes(substring));
}

describe('Countdown', () => {
  it('renders children', () => {
    render(<Countdown>5m</Countdown>);
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  describe('variants', () => {
    it('applies default variant by default', () => {
      const { container } = render(<Countdown>Time</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'default')).toBe(true);
    });

    it('applies danger variant', () => {
      const { container } = render(<Countdown variant="danger">Urgent</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'danger')).toBe(true);
    });

    it('applies warning variant', () => {
      const { container } = render(<Countdown variant="warning">Soon</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'warning')).toBe(true);
    });

    it('applies comfortable variant', () => {
      const { container } = render(<Countdown variant="comfortable">OK</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'comfortable')).toBe(true);
    });
  });

  describe('size', () => {
    it('does not apply large class by default', () => {
      const { container } = render(<Countdown>Time</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'large')).toBe(false);
    });

    it('applies large class when large prop is true', () => {
      const { container } = render(<Countdown large>Time</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'large')).toBe(true);
    });
  });

  describe('pulse animation', () => {
    it('does not apply pulse class by default', () => {
      const { container } = render(<Countdown>Time</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'pulse')).toBe(false);
    });

    it('applies pulse class when pulse prop is true', () => {
      const { container } = render(<Countdown pulse>Time</Countdown>);
      expect(hasClassContaining(container.firstChild as Element, 'pulse')).toBe(true);
    });
  });

  it('forwards className prop', () => {
    const { container } = render(<Countdown className="custom">Time</Countdown>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('combines multiple props', () => {
    const { container } = render(
      <Countdown variant="danger" large pulse className="custom">
        Departing
      </Countdown>
    );

    const element = container.firstChild as Element;
    expect(hasClassContaining(element, 'danger')).toBe(true);
    expect(hasClassContaining(element, 'large')).toBe(true);
    expect(hasClassContaining(element, 'pulse')).toBe(true);
    expect(element).toHaveClass('custom');
  });

  it('renders complex children', () => {
    render(
      <Countdown>
        <span data-testid="time">10</span>
        <span data-testid="unit">min</span>
      </Countdown>
    );

    expect(screen.getByTestId('time')).toBeInTheDocument();
    expect(screen.getByTestId('unit')).toBeInTheDocument();
  });
});
