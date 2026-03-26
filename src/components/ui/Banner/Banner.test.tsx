import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner', () => {
  it('toggles visibility via visible prop', () => {
    const { rerender } = render(<Banner title="Update" visible />);
    expect(screen.getByText('Update')).toBeInTheDocument();

    rerender(<Banner title="Update" visible={false} />);
    expect(screen.queryByText('Update')).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = vi.fn();
    render(<Banner title="Update" onDismiss={handleDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<Banner title="Update" />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('renders actions, dismiss, subtitle, and icon together', () => {
    render(
      <Banner
        title="Update"
        subtitle="New features"
        icon={<span data-testid="icon">⚡</span>}
        actions={<button>Action</button>}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('New features')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });
});
