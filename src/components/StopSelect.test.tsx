import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StopSelect } from './StopSelect';
import type { Stop } from '../types';

const mockStops: Stop[] = [
  { stopId: 'stop-1', name: 'King Street Station' },
  { stopId: 'stop-2', name: 'Tukwila Station' },
  { stopId: 'stop-3', name: 'Kent Station' },
  { stopId: 'stop-4', name: 'Auburn Station' },
];

describe('StopSelect', () => {
  it('renders all stops as options', () => {
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toContainHTML('King Street Station');
    expect(select).toContainHTML('Tukwila Station');
    expect(select).toContainHTML('Kent Station');
    expect(select).toContainHTML('Auburn Station');
  });

  it('displays "Your Station" label', () => {
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={() => {}}
      />
    );

    expect(screen.getByText('Your Station')).toBeInTheDocument();
  });

  it('shows the currently selected stop', () => {
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-3"
        onStopChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('stop-3');
  });

  it('calls onStopChange when a different stop is selected', () => {
    const handleChange = vi.fn();
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={handleChange}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'stop-4' } });
    expect(handleChange).toHaveBeenCalledWith('stop-4');
  });

  it('is accessible by label', () => {
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Your Station')).toBeInTheDocument();
  });

  it('renders inside a stop-select container', () => {
    const { container } = render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={() => {}}
      />
    );

    expect(container.querySelector('.stop-select')).toBeInTheDocument();
  });

  it('handles empty stops array', () => {
    render(
      <StopSelect
        stops={[]}
        currentStop=""
        onStopChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select.querySelectorAll('option')).toHaveLength(0);
  });

  it('uses stopId as option value', () => {
    render(
      <StopSelect
        stops={mockStops}
        currentStop="stop-1"
        onStopChange={() => {}}
      />
    );

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveValue('stop-1');
    expect(options[1]).toHaveValue('stop-2');
  });
});
