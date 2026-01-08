interface WeekendNoticeProps {
  visible: boolean;
}

export function WeekendNotice({ visible }: WeekendNoticeProps) {
  if (!visible) return null;

  return (
    <div className="weekend-notice">
      Sounder trains do not operate on weekends or holidays.
    </div>
  );
}
