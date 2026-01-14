import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  describe('severity variants', () => {
    it('renders danger severity', () => {
      const { container } = render(<Badge severity="danger">Error</Badge>);
      expect(container.querySelector('span')?.className).toContain('danger');
    });

    it('renders warning severity', () => {
      const { container } = render(<Badge severity="warning">Warning</Badge>);
      expect(container.querySelector('span')?.className).toContain('warning');
    });

    it('renders info severity', () => {
      const { container } = render(<Badge severity="info">Info</Badge>);
      expect(container.querySelector('span')?.className).toContain('info');
    });

    it('renders success severity', () => {
      const { container } = render(<Badge severity="success">Success</Badge>);
      expect(container.querySelector('span')?.className).toContain('success');
    });

    it('renders comfortable severity', () => {
      const { container } = render(<Badge severity="comfortable">OK</Badge>);
      expect(container.querySelector('span')?.className).toContain('comfortable');
    });
  });

  describe('sizes', () => {
    it('renders medium size by default', () => {
      const { container } = render(<Badge severity="danger">Medium</Badge>);
      expect(container.querySelector('span')?.className).toContain('md');
    });

    it('renders small size', () => {
      const { container } = render(<Badge severity="danger" size="sm">Small</Badge>);
      expect(container.querySelector('span')?.className).toContain('sm');
    });
  });

  describe('dot mode', () => {
    it('renders as dot when dot prop is true', () => {
      const { container } = render(<Badge severity="danger" dot />);
      expect(container.querySelector('span')?.className).toContain('dot');
    });

    it('hides dot from accessibility tree', () => {
      const { container } = render(<Badge severity="danger" dot />);
      expect(container.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
    });

    it('does not render children when in dot mode', () => {
      render(<Badge severity="danger" dot>Hidden</Badge>);
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('renders children', () => {
      render(<Badge severity="info">Delayed</Badge>);
      expect(screen.getByText('Delayed')).toBeInTheDocument();
    });

    it('renders complex children', () => {
      render(
        <Badge severity="warning">
          <span data-testid="inner">Custom</span>
        </Badge>
      );
      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });
  });

  it('forwards className prop', () => {
    const { container } = render(<Badge severity="danger" className="custom">Custom</Badge>);
    expect(container.querySelector('span')?.className).toContain('custom');
  });
});
