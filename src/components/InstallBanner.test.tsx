import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallBanner } from './InstallBanner';

describe('InstallBanner', () => {
  const mockOnInstall = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnInstall.mockClear();
    mockOnDismiss.mockClear();
  });

  describe('visibility', () => {
    it('renders nothing when visible is false', () => {
      const { container } = render(
        <InstallBanner
          visible={false}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing for unsupported platform', () => {
      const { container } = render(
        <InstallBanner
          visible={true}
          platform="unsupported"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders banner when visible and platform is supported', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText('Install App')).toBeInTheDocument();
    });
  });

  describe('chromium platform', () => {
    it('shows install button', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
    });

    it('shows correct subtitle', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText('Add to your home screen for quick access')).toBeInTheDocument();
    });

    it('calls onInstall when Install button clicked', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Install' }));
      expect(mockOnInstall).toHaveBeenCalledTimes(1);
    });
  });

  describe('safari-ios platform', () => {
    it('shows iOS instructions', () => {
      render(
        <InstallBanner
          visible={true}
          platform="safari-ios"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText('Tap Share, then "Add to Home Screen"')).toBeInTheDocument();
    });

    it('does not show Install button', () => {
      render(
        <InstallBanner
          visible={true}
          platform="safari-ios"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
    });
  });

  describe('safari-macos platform', () => {
    it('shows macOS instructions', () => {
      render(
        <InstallBanner
          visible={true}
          platform="safari-macos"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText('File → Add to Dock for quick access')).toBeInTheDocument();
    });

    it('does not show Install button', () => {
      render(
        <InstallBanner
          visible={true}
          platform="safari-macos"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument();
    });
  });

  describe('dismiss functionality', () => {
    it('shows dismiss button', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('icon', () => {
    it('shows phone icon for all platforms', () => {
      render(
        <InstallBanner
          visible={true}
          platform="chromium"
          onInstall={mockOnInstall}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText('📱')).toBeInTheDocument();
    });
  });
});
