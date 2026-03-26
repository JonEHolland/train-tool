import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircularProgress } from './CircularProgress';

describe('CircularProgress', () => {
  it('renders SVG with track and progress circles', () => {
    const { container } = render(
      <CircularProgress progress={0.5}>
        <span>Content</span>
      </CircularProgress>
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom color to progress ring', () => {
    const { container } = render(
      <CircularProgress progress={0.5} color="var(--color-status-danger)">
        <span>Content</span>
      </CircularProgress>
    );

    const progressRing = container.querySelectorAll('circle')[1];
    expect(progressRing).toHaveAttribute('stroke', 'var(--color-status-danger)');
  });

  it('hides track when showTrack is false', () => {
    const { container } = render(
      <CircularProgress progress={0.5} showTrack={false}>
        <span>Content</span>
      </CircularProgress>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});
