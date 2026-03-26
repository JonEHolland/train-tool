import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StopSelect } from './StopSelect';
import type { Stop } from '../types';

const mockStops: Stop[] = [
  { stopId: 'stop-1', name: 'King Street Station' },
  { stopId: 'stop-2', name: 'Tukwila Station' },
  { stopId: 'stop-3', name: 'Kent Station' },
];

describe('StopSelect', () => {
  it('renders stops, shows selected, and is accessible by label', () => {
    render(<StopSelect stops={mockStops} currentStop="stop-2" onStopChange={() => {}} />);

    const select = screen.getByLabelText('Your Station') as HTMLSelectElement;
    expect(select).toContainHTML('King Street Station');
    expect(select).toContainHTML('Tukwila Station');
    expect(select.value).toBe('stop-2');
  });

  it('calls onStopChange when a different stop is selected', () => {
    const handleChange = vi.fn();
    render(<StopSelect stops={mockStops} currentStop="stop-1" onStopChange={handleChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'stop-3' } });
    expect(handleChange).toHaveBeenCalledWith('stop-3');
  });
});
