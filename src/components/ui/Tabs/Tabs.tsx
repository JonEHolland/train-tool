import type { ReactNode } from 'react';
import { Button } from '../Button';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={`${styles.tabs} ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="tab"
          active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
        >
          {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
          <span className={styles.label}>{tab.label}</span>
        </Button>
      ))}
    </div>
  );
}

// Tab component for custom tab rendering
export interface TabProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Tab({ active = false, onClick, children }: TabProps) {
  return (
    <Button variant="tab" active={active} onClick={onClick} role="tab">
      {children}
    </Button>
  );
}

// TabPanel component for tab content
export interface TabPanelProps {
  id: string;
  active: boolean;
  children: ReactNode;
}

export function TabPanel({ id, active, children }: TabPanelProps) {
  if (!active) return null;

  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={id}
      className={styles.panel}
    >
      {children}
    </div>
  );
}
