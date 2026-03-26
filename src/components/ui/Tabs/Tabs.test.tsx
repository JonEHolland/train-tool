import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabPanel } from './Tabs';

const mockTabs = [
  { id: 'tab1', label: 'First Tab' },
  { id: 'tab2', label: 'Second Tab' },
  { id: 'tab3', label: 'Third Tab' },
];

describe('Tabs', () => {
  it('renders all tabs with correct ARIA attributes', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab2" onTabChange={() => {}} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-tab1');
  });

  it('calls onTabChange when tab is clicked', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={handleChange} />);

    fireEvent.click(screen.getByText('Second Tab'));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });
});

describe('TabPanel', () => {
  it('shows content when active, hides when not', () => {
    const { rerender } = render(<TabPanel id="test" active>Panel Content</TabPanel>);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel Content');

    rerender(<TabPanel id="test" active={false}>Panel Content</TabPanel>);
    expect(screen.queryByText('Panel Content')).not.toBeInTheDocument();
  });
});
