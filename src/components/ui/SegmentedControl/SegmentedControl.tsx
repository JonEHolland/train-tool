import type { ReactNode } from 'react';
import { Button } from '../Button';
import styles from './SegmentedControl.module.css';

export interface SegmentOption {
  value: string;
  title: string;
  subtitle?: string;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  return (
    <div className={`${styles.control} ${className}`.trim()}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="segment"
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <span className={styles.title}>{option.title}</span>
          {option.subtitle && (
            <span className={styles.subtitle}>{option.subtitle}</span>
          )}
        </Button>
      ))}
    </div>
  );
}

// Individual Segment component for custom rendering
export interface SegmentProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Segment({ active = false, onClick, children }: SegmentProps) {
  return (
    <Button variant="segment" active={active} onClick={onClick}>
      {children}
    </Button>
  );
}
