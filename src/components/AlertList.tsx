import { memo } from 'react';
import { useExceptionService } from '../context/ExceptionServiceContext';
import { Card, CardBody, Label, Carousel } from './ui';

interface AlertListProps {
  loading: boolean;
  error: string | null;
}

/**
 * Displays service alerts, excluding any that are "consumed" by the exception service banner.
 * Subscribes to ExceptionServiceContext for filtered alerts.
 */
export const AlertList = memo(function AlertList({ loading, error }: AlertListProps) {
  const { filteredAlerts } = useExceptionService();

  // Handle loading and error states
  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="loading">Loading alerts...</div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <div className="error">{error}</div>
        </CardBody>
      </Card>
    );
  }

  // No alerts to display (either none exist, or all consumed by banner)
  if (filteredAlerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <Carousel
        header={<Label>SERVICE ALERTS</Label>}
        showDots={filteredAlerts.length > 1}
        hintText="Swipe for more alerts"
      >
        {filteredAlerts.map((entity, index) => {
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
});
