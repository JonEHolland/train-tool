import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders title', () => {
    render(<Banner title="Update Available" />);
    expect(screen.getByText('Update Available')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Banner title="Update" subtitle="New features available" />);
    expect(screen.getByText('New features available')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<Banner title="Update" />);
    // Just verify title renders and no subtitle text appears
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<Banner title="Update" icon={<span data-testid="icon">⚡</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <Banner
        title="Update"
        actions={<button data-testid="action">Update Now</button>}
      />
    );
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });

  it('renders dismiss button when onDismiss is provided', () => {
    render(<Banner title="Update" onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
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

  it('renders when visible is true', () => {
    render(<Banner title="Update" visible />);
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(<Banner title="Update" visible={false} />);
    expect(screen.queryByText('Update')).not.toBeInTheDocument();
  });

  it('renders by default (visible defaults to true)', () => {
    render(<Banner title="Update" />);
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(<Banner title="Update" className="custom-banner" />);
    expect(container.firstChild).toHaveClass('custom-banner');
  });

  it('renders with both actions and dismiss button', () => {
    render(
      <Banner
        title="Update"
        actions={<button>Action</button>}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });
});
