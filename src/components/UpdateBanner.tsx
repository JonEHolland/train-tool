import { Banner, Button } from './ui';

interface UpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ visible, onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <Banner
      icon="⚡"
      title="Update Available"
      subtitle="New features ready to install"
      visible={visible}
      onDismiss={onDismiss}
      actions={
        <Button variant="primary" onClick={onUpdate}>
          Update Now
        </Button>
      }
    />
  );
}
