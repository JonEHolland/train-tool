import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateBanner } from './UpdateBanner';

describe('UpdateBanner', () => {
  it('renders correctly when visible and responds to callbacks', () => {
    const handleUpdate = vi.fn();
    const handleDismiss = vi.fn();
    render(<UpdateBanner visible={true} onUpdate={handleUpdate} onDismiss={handleDismiss} />);

    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('New features ready to install')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Update Now' }));
    expect(handleUpdate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const { container } = render(<UpdateBanner visible={false} onUpdate={() => {}} onDismiss={() => {}} />);
    expect(container.querySelector('[class*="banner"]')).not.toBeInTheDocument();
  });
});
