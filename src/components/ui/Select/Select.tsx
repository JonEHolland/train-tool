import type { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export function Select({
  label,
  options,
  value,
  onChange,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
