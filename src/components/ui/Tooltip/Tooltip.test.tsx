import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from './Tooltip';

// Helper to check if element has a class containing the given substring
// (handles CSS Module transformed class names)
function hasClassContaining(element: Element | null, substring: string): boolean {
  if (!element) return false;
  return element.className.split(' ').some(cls => cls.includes(substring));
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <Tooltip content="Helpful info">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not show tooltip by default', () => {
    render(
      <Tooltip content="Helpful info">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse enter after delay', async () => {
    render(
      <Tooltip content="Helpful info" delay={200}>
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);

    // Tooltip should not be visible before delay
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Advance timer past delay
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful info');
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Helpful info" delay={10}>
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Hover me').parentElement!;

    fireEvent.mouseEnter(wrapper);
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

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
    await act(async () => {
      vi.advanceTimersByTime(100); // Only half the delay
    });

    fireEvent.mouseLeave(wrapper);
    await act(async () => {
      vi.advanceTimersByTime(200); // Finish delay time
    });

    // Tooltip should never appear
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus', async () => {
    render(
      <Tooltip content="Helpful info" delay={10}>
        <button>Focus me</button>
      </Tooltip>
    );

    fireEvent.focus(screen.getByText('Focus me').parentElement!);
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', async () => {
    render(
      <Tooltip content="Helpful info" delay={10}>
        <button>Focus me</button>
      </Tooltip>
    );

    const wrapper = screen.getByText('Focus me').parentElement!;

    fireEvent.focus(wrapper);
    await act(async () => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(wrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('uses default delay of 200ms', async () => {
    render(
      <Tooltip content="Helpful info">
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('respects custom delay', async () => {
    render(
      <Tooltip content="Helpful info" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders complex content', async () => {
    render(
      <Tooltip content={<span data-testid="complex">Complex <strong>content</strong></span>} delay={10}>
        <button>Hover me</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByTestId('complex')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(
      <Tooltip content="Info" className="custom-tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(container.firstChild).toHaveClass('custom-tooltip');
  });

  describe('positioning', () => {
    it('defaults to top position', async () => {
      render(
        <Tooltip content="Info" delay={10}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(hasClassContaining(screen.getByRole('tooltip'), 'top')).toBe(true);
    });

    it('supports bottom position', async () => {
      render(
        <Tooltip content="Info" position="bottom" delay={10}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(hasClassContaining(screen.getByRole('tooltip'), 'bottom')).toBe(true);
    });

    it('supports left position', async () => {
      render(
        <Tooltip content="Info" position="left" delay={10}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(hasClassContaining(screen.getByRole('tooltip'), 'left')).toBe(true);
    });

    it('supports right position', async () => {
      render(
        <Tooltip content="Info" position="right" delay={10}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByText('Hover me').parentElement!);
      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(hasClassContaining(screen.getByRole('tooltip'), 'right')).toBe(true);
    });
  });
});
