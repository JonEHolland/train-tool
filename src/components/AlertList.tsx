import type { AlertEntity } from '../types';
import { Card, CardBody, Label, EmptyState, Carousel } from './ui';

interface AlertListProps {
  alerts: AlertEntity[];
  loading: boolean;
  error: string | null;
}

export function AlertList({ alerts, loading, error }: AlertListProps) {
  // Handle loading and error states
  if (loading) {
    return (
      <Card className="alert-card">
        <CardBody>
          <div className="loading">Loading alerts...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="alert-card">
        <CardBody>
          <div className="error">{error}</div>
        </CardBody>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="alert-card">
        <CardBody>
          <EmptyState
            title="No active alerts"
            subtitle="All systems operating normally"
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="alert-card">
      <Carousel
        header={<Label>SERVICE ALERTS</Label>}
        showDots={alerts.length > 1}
        hintText="Swipe for more alerts"
      >
        {alerts.map((entity, index) => {
          const alertData = entity?.alert;
          const header = alertData?.header_text?.translation?.[0]?.text || 'Alert';
          const desc = alertData?.description_text?.translation?.[0]?.text || '';
          const truncatedDesc = desc.length > 200 ? `${desc.slice(0, 200)}...` : desc;

          return (
            <div key={index} className="alert-content">
              <div className="alert-header">{header}</div>
              <div className="alert-desc">{truncatedDesc}</div>
            </div>
          );
        })}
      </Carousel>
    </Card>
  );
}
