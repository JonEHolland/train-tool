import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, Tab, TabPanel } from './Tabs';

const mockTabs = [
  { id: 'tab1', label: 'First Tab' },
  { id: 'tab2', label: 'Second Tab' },
  { id: 'tab3', label: 'Third Tab' },
];

describe('Tabs', () => {
  it('renders all tabs', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={() => {}} />);

    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('marks active tab', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab2" onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when tab is clicked', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={handleChange} />);

    fireEvent.click(screen.getByText('Second Tab'));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('renders with tablist role', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders tabs with tab role', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('sets aria-controls on tabs', () => {
    render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'panel-tab1');
    expect(tabs[1]).toHaveAttribute('aria-controls', 'panel-tab2');
  });

  it('renders tab icons when provided', () => {
    const tabsWithIcons = [
      { id: 'a', label: 'Tab A', icon: <span data-testid="icon-a">🔵</span> },
      { id: 'b', label: 'Tab B', icon: <span data-testid="icon-b">🟢</span> },
    ];
    render(<Tabs tabs={tabsWithIcons} activeTab="a" onTabChange={() => {}} />);

    expect(screen.getByTestId('icon-a')).toBeInTheDocument();
    expect(screen.getByTestId('icon-b')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(
      <Tabs tabs={mockTabs} activeTab="tab1" onTabChange={() => {}} className="custom-tabs" />
    );

    expect(container.firstChild).toHaveClass('custom-tabs');
  });
});

describe('Tab', () => {
  it('renders children', () => {
    render(<Tab>Custom Tab</Tab>);
    expect(screen.getByText('Custom Tab')).toBeInTheDocument();
  });

  it('has tab role', () => {
    render(<Tab>Tab</Tab>);
    expect(screen.getByRole('tab')).toBeInTheDocument();
  });

  it('applies active state', () => {
    const { container } = render(<Tab active>Active Tab</Tab>);
    expect(container.querySelector('button')?.className).toContain('active');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Tab onClick={handleClick}>Click Me</Tab>);

    fireEvent.click(screen.getByRole('tab'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('TabPanel', () => {
  it('renders content when active', () => {
    render(<TabPanel id="test" active>Panel Content</TabPanel>);
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('does not render when not active', () => {
    render(<TabPanel id="test" active={false}>Hidden Content</TabPanel>);
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('has tabpanel role', () => {
    render(<TabPanel id="test" active>Content</TabPanel>);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('sets correct id', () => {
    render(<TabPanel id="my-tab" active>Content</TabPanel>);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-my-tab');
  });

  it('sets aria-labelledby', () => {
    render(<TabPanel id="my-tab" active>Content</TabPanel>);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'my-tab');
  });
});
