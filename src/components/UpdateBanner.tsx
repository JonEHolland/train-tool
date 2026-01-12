interface UpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ visible, onUpdate, onDismiss }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <div className="update-banner-icon">⚡</div>
        <div className="update-banner-text">
          <div className="update-banner-title">Update Available</div>
          <div className="update-banner-subtitle">New features ready to install</div>
        </div>
      </div>
      <div className="update-banner-actions">
        <button className="update-banner-button" onClick={onUpdate}>
          Update Now
        </button>
        <button className="update-banner-dismiss" onClick={onDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
