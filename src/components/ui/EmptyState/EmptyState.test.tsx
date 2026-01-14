import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items" subtitle="Add some items to get started" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<EmptyState title="No items" subtitle="Add some items to get started" />);
    expect(screen.getByText('Add some items to get started')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No items"
        subtitle="Add items"
        icon={<span data-testid="empty-icon">📭</span>}
      />
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState title="No items" subtitle="Add items" />);
    expect(container.querySelectorAll('[class*="icon"]')).toHaveLength(0);
  });

  it('forwards className prop', () => {
    const { container } = render(
      <EmptyState title="No items" subtitle="Add items" className="custom-empty" />
    );
    expect(container.firstChild).toHaveClass('custom-empty');
  });

  it('renders complex icon elements', () => {
    render(
      <EmptyState
        title="No results"
        subtitle="Try a different search"
        icon={
          <svg data-testid="svg-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
          </svg>
        }
      />
    );
    expect(screen.getByTestId('svg-icon')).toBeInTheDocument();
  });
});
