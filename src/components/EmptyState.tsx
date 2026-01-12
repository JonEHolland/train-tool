interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="no-service">
      <div className="no-service-message">{title}</div>
      <div className="no-service-subtitle">{subtitle}</div>
    </div>
  );
}
