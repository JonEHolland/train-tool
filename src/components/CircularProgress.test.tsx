import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress, calculateProgress, getUrgencyColor } from './CircularProgress';

describe('CircularProgress helpers', () => {
  describe('calculateProgress', () => {
    it('returns 0 for 0 minutes or less', () => {
      expect(calculateProgress(0)).toBe(0);
      expect(calculateProgress(-5)).toBe(0);
    });

    it('returns 1 for 60 minutes or more', () => {
      expect(calculateProgress(60)).toBe(1);
      expect(calculateProgress(120)).toBe(1);
      expect(calculateProgress(1000)).toBe(1);
    });

    it('returns proportional value for times between 0 and 60', () => {
      expect(calculateProgress(30)).toBe(0.5);
      expect(calculateProgress(15)).toBe(0.25);
      expect(calculateProgress(45)).toBe(0.75);
    });

    it('handles edge cases', () => {
      expect(calculateProgress(1)).toBeCloseTo(1 / 60);
      expect(calculateProgress(59)).toBeCloseTo(59 / 60);
    });
  });

  describe('getUrgencyColor', () => {
    it('returns danger color for 2 minutes or less', () => {
      expect(getUrgencyColor(0)).toBe('var(--color-status-danger)');
      expect(getUrgencyColor(1)).toBe('var(--color-status-danger)');
      expect(getUrgencyColor(2)).toBe('var(--color-status-danger)');
    });

    it('returns warning color for 3-5 minutes', () => {
      expect(getUrgencyColor(3)).toBe('var(--color-status-warning)');
      expect(getUrgencyColor(4)).toBe('var(--color-status-warning)');
      expect(getUrgencyColor(5)).toBe('var(--color-status-warning)');
    });

    it('returns secondary accent for 6-15 minutes', () => {
      expect(getUrgencyColor(6)).toBe('var(--color-accent-secondary)');
      expect(getUrgencyColor(10)).toBe('var(--color-accent-secondary)');
      expect(getUrgencyColor(15)).toBe('var(--color-accent-secondary)');
    });

    it('returns primary accent for more than 15 minutes', () => {
      expect(getUrgencyColor(16)).toBe('var(--color-accent-primary)');
      expect(getUrgencyColor(30)).toBe('var(--color-accent-primary)');
      expect(getUrgencyColor(60)).toBe('var(--color-accent-primary)');
    });
  });
});

describe('CircularProgress component', () => {
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

  it('applies custom color', () => {
    const { container } = render(
      <CircularProgress progress={0.5} color="var(--color-status-danger)">
        <span>Content</span>
      </CircularProgress>
    );

    const progressRing = container.querySelector('.circular-progress-ring');
    expect(progressRing).toHaveAttribute('stroke', 'var(--color-status-danger)');
  });

  it('respects showTrack prop', () => {
    const { container, rerender } = render(
      <CircularProgress progress={0.5} showTrack={true}>
        <span>Content</span>
      </CircularProgress>
    );

    expect(container.querySelector('.circular-progress-track')).toBeInTheDocument();

    rerender(
      <CircularProgress progress={0.5} showTrack={false}>
        <span>Content</span>
      </CircularProgress>
    );

    expect(container.querySelector('.circular-progress-track')).not.toBeInTheDocument();
  });

  it('clamps progress between 0 and 1', () => {
    const { container, rerender } = render(
      <CircularProgress progress={-0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    // Progress should be clamped to 0, meaning full strokeDashoffset
    let ring = container.querySelector('.circular-progress-ring');
    expect(ring).toBeInTheDocument();

    rerender(
      <CircularProgress progress={1.5}>
        <span>Content</span>
      </CircularProgress>
    );

    // Progress should be clamped to 1
    ring = container.querySelector('.circular-progress-ring');
    expect(ring).toBeInTheDocument();
  });
});
