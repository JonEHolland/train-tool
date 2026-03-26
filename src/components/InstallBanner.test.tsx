import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallBanner } from './InstallBanner';

describe('InstallBanner', () => {
  const mockOnInstall = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnInstall.mockClear();
    mockOnDismiss.mockClear();
  });

  it('renders nothing when not visible or unsupported platform', () => {
    const { container, rerender } = render(
      <InstallBanner visible={false} platform="chromium" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<InstallBanner visible={true} platform="unsupported" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows install button for chromium and calls onInstall', () => {
    render(<InstallBanner visible={true} platform="chromium" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(screen.getByText('Add to your home screen for quick access')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(mockOnInstall).toHaveBeenCalledTimes(1);
  });

  it('shows iOS instructions without install button', () => {
    render(<InstallBanner visible={true} platform="safari-ios" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('Tap Share, then "Add to Home Screen"')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('shows macOS instructions without install button', () => {
    render(<InstallBanner visible={true} platform="safari-macos" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />);
    expect(screen.getByText('File → Add to Dock for quick access')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    render(<InstallBanner visible={true} platform="chromium" onInstall={mockOnInstall} onDismiss={mockOnDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});
