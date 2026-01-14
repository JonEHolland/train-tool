import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies default variant (primary)', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('primary');
  });

  it('applies segment variant', () => {
    const { container } = render(<Button variant="segment">Segment</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('segment');
  });

  it('applies tab variant', () => {
    const { container } = render(<Button variant="tab">Tab</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('tab');
  });

  it('applies ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('ghost');
  });

  it('applies icon variant', () => {
    const { container } = render(<Button variant="icon">×</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('icon');
  });

  it('applies active state', () => {
    const { container } = render(<Button active>Active</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('active');
  });

  it('does not apply active state when false', () => {
    const { container } = render(<Button active={false}>Inactive</Button>);
    const button = container.querySelector('button');
    expect(button?.className).not.toContain('active');
  });

  it('forwards className prop', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('custom-class');
  });

  it('forwards native button props', () => {
    render(<Button disabled aria-label="Test button">Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });

  it('supports type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
