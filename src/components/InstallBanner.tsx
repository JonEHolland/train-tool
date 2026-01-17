import { Banner, Button } from './ui';
import type { InstallPlatform } from '../types';

interface InstallBannerProps {
  visible: boolean;
  platform: InstallPlatform;
  onInstall: () => void;
  onDismiss: () => void;
}

interface BannerContent {
  icon: string;
  title: string;
  subtitle: string;
  showInstallButton: boolean;
}

function getBannerContent(platform: InstallPlatform): BannerContent | null {
  switch (platform) {
    case 'chromium':
      return {
        icon: '📱',
        title: 'Install App',
        subtitle: 'Add to your home screen for quick access',
        showInstallButton: true,
      };
    case 'safari-ios':
      return {
        icon: '📱',
        title: 'Install App',
        subtitle: 'Tap Share, then "Add to Home Screen"',
        showInstallButton: false,
      };
    case 'safari-macos':
      return {
        icon: '📱',
        title: 'Install App',
        subtitle: 'File → Add to Dock for quick access',
        showInstallButton: false,
      };
    case 'unsupported':
    default:
      return null;
  }
}

export function InstallBanner({ visible, platform, onInstall, onDismiss }: InstallBannerProps) {
  const content = getBannerContent(platform);

  if (!content) {
    return null;
  }

  return (
    <Banner
      icon={content.icon}
      title={content.title}
      subtitle={content.subtitle}
      visible={visible}
      onDismiss={onDismiss}
      actions={
        content.showInstallButton ? (
          <Button variant="primary" onClick={onInstall}>
            Install
          </Button>
        ) : undefined
      }
    />
  );
}
