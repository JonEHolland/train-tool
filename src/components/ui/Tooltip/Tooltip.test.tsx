import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('shows tooltip on hover after delay and hides on leave', async () => {
    render(
      <Tooltip content="Helpful info" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Hover me').parentElement!;

    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful info');

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cancels tooltip if mouse leaves before delay', async () => {
    render(
      <Tooltip content="Helpful info" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Hover me').parentElement!;
    fireEvent.mouseEnter(wrapper);
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.mouseLeave(wrapper);
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on focus and hides on blur (keyboard accessibility)', async () => {
    render(
      <Tooltip content="Helpful info" delay={10}>
        <button>Focus me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Focus me').parentElement!;

    fireEvent.focus(wrapper);
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
