import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateBanner } from './UpdateBanner';

describe('UpdateBanner', () => {
  it('renders with correct title', () => {
    render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={() => {}} />
    );
    expect(screen.getByText('Update Available')).toBeInTheDocument();
  });

  it('renders with correct subtitle', () => {
    render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={() => {}} />
    );
    expect(screen.getByText('New features ready to install')).toBeInTheDocument();
  });

  it('renders update icon', () => {
    render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={() => {}} />
    );
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('renders Update Now button', () => {
    render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={() => {}} />
    );
    expect(screen.getByRole('button', { name: 'Update Now' })).toBeInTheDocument();
  });

  it('calls onUpdate when Update Now button is clicked', () => {
    const handleUpdate = vi.fn();
    render(
      <UpdateBanner visible={true} onUpdate={handleUpdate} onDismiss={() => {}} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Update Now' }));
    expect(handleUpdate).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = vi.fn();
    render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={handleDismiss} />
    );

    // The Banner component has a dismiss button
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButton);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible prop is false', () => {
    const { container } = render(
      <UpdateBanner visible={false} onUpdate={() => {}} onDismiss={() => {}} />
    );

    // Banner returns null when not visible
    expect(container.querySelector('[class*="banner"]')).not.toBeInTheDocument();
  });

  it('renders when visible prop is true', () => {
    const { container } = render(
      <UpdateBanner visible={true} onUpdate={() => {}} onDismiss={() => {}} />
    );

    expect(container.querySelector('[class*="banner"]')).toBeInTheDocument();
  });
});
