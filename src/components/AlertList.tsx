import type { AlertEntity } from '../types';
import { EmptyState } from './EmptyState';

interface AlertListProps {
  alerts: AlertEntity[];
  loading: boolean;
  error: string | null;
}

export function AlertList({ alerts, loading, error }: AlertListProps) {
  let content: React.ReactNode;

  if (loading) {
    content = <div className="loading">Loading alerts...</div>;
  } else if (error) {
    content = <div className="error">{error}</div>;
  } else if (alerts.length === 0) {
    content = (
      <EmptyState
        title="No active alerts"
        subtitle="All systems operating normally"
      />
    );
  } else {
    content = alerts.map(entity => {
      const alert = entity.alert;
      const header = alert?.header_text?.translation?.[0]?.text || 'Alert';
      const desc = alert?.description_text?.translation?.[0]?.text || '';
      const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}...` : desc;

      return (
        <div key={entity.id} className="alert-item">
          <div className="alert-header">{header}</div>
          <div className="alert-desc">{truncatedDesc}</div>
        </div>
      );
    });
  }

  return (
    <div className="card alert-card">
      <div className="card-body">{content}</div>
    </div>
  );
}
