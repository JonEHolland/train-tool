import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteSelect } from './RouteSelect';
import type { ScheduleData } from '../types';

// Mock schedule data with route names in both formats
const mockScheduleData: ScheduleData = {
  schedule: {
    'n-line': {
      name: 'N Line (North)',
      routeId: 'n-line',
      stops: [],
      directions: {},
    },
    's-line': {
      name: 'S Line (South)',
      routeId: 's-line',
      stops: [],
      directions: {},
    },
  },
};

// Schedule data with route name without parentheses
const mockScheduleDataSimple: ScheduleData = {
  schedule: {
    'express': {
      name: 'Express Route',
      routeId: 'express',
      stops: [],
      directions: {},
    },
    'local': {
      name: 'Local Route',
      routeId: 'local',
      stops: [],
      directions: {},
    },
  },
};

describe('RouteSelect', () => {
  it('renders all routes from schedule data', () => {
    render(
      <RouteSelect
        scheduleData={mockScheduleData}
        currentRoute="n-line"
        onRouteChange={() => {}}
      />
    );

    expect(screen.getByText('N Line')).toBeInTheDocument();
    expect(screen.getByText('S Line')).toBeInTheDocument();
  });

  it('parses route names with parentheses into title and subtitle', () => {
    render(
      <RouteSelect
        scheduleData={mockScheduleData}
        currentRoute="n-line"
        onRouteChange={() => {}}
      />
    );

    // Title should be "N Line", subtitle should be "North"
    expect(screen.getByText('N Line')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('S Line')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
  });

  it('handles route names without parentheses', () => {
    render(
      <RouteSelect
        scheduleData={mockScheduleDataSimple}
        currentRoute="express"
        onRouteChange={() => {}}
      />
    );

    expect(screen.getByText('Express Route')).toBeInTheDocument();
    expect(screen.getByText('Local Route')).toBeInTheDocument();
  });

  it('calls onRouteChange when a different route is clicked', () => {
    const handleChange = vi.fn();
    render(
      <RouteSelect
        scheduleData={mockScheduleData}
        currentRoute="n-line"
        onRouteChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText('S Line'));
    expect(handleChange).toHaveBeenCalledWith('s-line');
  });

  it('shows the currently selected route as active', () => {
    const { container } = render(
      <RouteSelect
        scheduleData={mockScheduleData}
        currentRoute="s-line"
        onRouteChange={() => {}}
      />
    );

    // Find the buttons and check which one is active
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).not.toContain('active');
    expect(buttons[1].className).toContain('active');
  });

  it('renders inside a route-select container', () => {
    const { container } = render(
      <RouteSelect
        scheduleData={mockScheduleData}
        currentRoute="n-line"
        onRouteChange={() => {}}
      />
    );

    expect(container.querySelector('.route-select')).toBeInTheDocument();
  });
});
