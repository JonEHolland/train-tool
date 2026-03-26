import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteSelect } from './RouteSelect';
import type { ScheduleData } from '../types';

const mockScheduleData: ScheduleData = {
  schedule: {
    'n-line': { name: 'N Line (North)', routeId: 'n-line', stops: [], directions: {} },
    's-line': { name: 'S Line (South)', routeId: 's-line', stops: [], directions: {} },
  },
};

describe('RouteSelect', () => {
  it('renders routes with parsed names and shows active route', () => {
    const { container } = render(
      <RouteSelect scheduleData={mockScheduleData} currentRoute="n-line" onRouteChange={() => {}} />
    );

    expect(screen.getByText('N Line')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('S Line')).toBeInTheDocument();

    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).toContain('active');
    expect(buttons[1].className).not.toContain('active');
  });

  it('calls onRouteChange when a different route is clicked', () => {
    const handleChange = vi.fn();
    render(<RouteSelect scheduleData={mockScheduleData} currentRoute="n-line" onRouteChange={handleChange} />);

    fireEvent.click(screen.getByText('S Line'));
    expect(handleChange).toHaveBeenCalledWith('s-line');
  });
});
