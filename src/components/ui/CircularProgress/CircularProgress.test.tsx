import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './CircularProgress';

describe('CircularProgress', () => {
  it('renders children content', () => {
    render(
      <CircularProgress progress={0.5}>
        <span data-testid="content">Test Content</span>
      </CircularProgress>
    );

    expect(screen.getByTestId('content')).toHaveTextContent('Test Content');
  });

  it('renders SVG with progress ring', () => {
    const { container } = render(
      <CircularProgress progress={0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Should have track and progress circles
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // track + progress ring
  });

  it('applies custom color to progress ring', () => {
    const { container } = render(
      <CircularProgress progress={0.5} color="var(--color-status-danger)">
        <span>Content</span>
      </CircularProgress>
    );

    // Find the progress ring (second circle, has filter attribute)
    const circles = container.querySelectorAll('circle');
    const progressRing = circles[1];
    expect(progressRing).toHaveAttribute('stroke', 'var(--color-status-danger)');
  });

  it('uses default color (accent primary)', () => {
    const { container } = render(
      <CircularProgress progress={0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    const circles = container.querySelectorAll('circle');
    const progressRing = circles[1];
    expect(progressRing).toHaveAttribute('stroke', 'var(--color-accent-primary)');
  });

  it('respects showTrack prop', () => {
    const { container, rerender } = render(
      <CircularProgress progress={0.5} showTrack={true}>
        <span>Content</span>
      </CircularProgress>
    );

    // With showTrack=true, should have 2 circles (track + ring)
    expect(container.querySelectorAll('circle').length).toBe(2);

    rerender(
      <CircularProgress progress={0.5} showTrack={false}>
        <span>Content</span>
      </CircularProgress>
    );

    // With showTrack=false, should have only 1 circle (ring)
    expect(container.querySelectorAll('circle').length).toBe(1);
  });

  it('clamps progress between 0 and 1', () => {
    const { container, rerender } = render(
      <CircularProgress progress={-0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    // Progress should be clamped to 0
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);

    rerender(
      <CircularProgress progress={1.5}>
        <span>Content</span>
      </CircularProgress>
    );

    // Progress should be clamped to 1
    const circlesAfter = container.querySelectorAll('circle');
    expect(circlesAfter.length).toBeGreaterThan(0);
  });

  it('applies custom size', () => {
    const { container } = render(
      <CircularProgress progress={0.5} size={100}>
        <span>Content</span>
      </CircularProgress>
    );

    // The wrapper div should have the custom size
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '100px', height: '100px' });
  });

  it('uses default size of 180px', () => {
    const { container } = render(
      <CircularProgress progress={0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '180px', height: '180px' });
  });

  it('applies custom strokeWidth', () => {
    const { container } = render(
      <CircularProgress progress={0.5} strokeWidth={10}>
        <span>Content</span>
      </CircularProgress>
    );

    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('stroke-width', '10');
    expect(circles[1]).toHaveAttribute('stroke-width', '10');
  });

  it('renders without children', () => {
    const { container } = render(<CircularProgress progress={0.5} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles progress of 0', () => {
    const { container } = render(
      <CircularProgress progress={0}>
        <span>Empty</span>
      </CircularProgress>
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles progress of 1 (full)', () => {
    const { container } = render(
      <CircularProgress progress={1}>
        <span>Full</span>
      </CircularProgress>
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
