import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Disclaimer } from './Disclaimer';

describe('Disclaimer', () => {
  it('renders as a footer element', () => {
    render(<Disclaimer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('has disclaimer class', () => {
    const { container } = render(<Disclaimer />);
    expect(container.querySelector('.disclaimer')).toBeInTheDocument();
  });

  it('displays the disclaimer text', () => {
    render(<Disclaimer />);
    expect(
      screen.getByText(/SounderTrain is a free, independent service/i)
    ).toBeInTheDocument();
  });

  it('mentions not affiliated with Sound Transit', () => {
    render(<Disclaimer />);
    expect(
      screen.getByText(/not affiliated with, endorsed by, or connected to Sound Transit/i)
    ).toBeInTheDocument();
  });

  it('mentions GTFS data source', () => {
    render(<Disclaimer />);
    expect(
      screen.getByText(/sourced from publicly available GTFS feeds/i)
    ).toBeInTheDocument();
  });

  it('mentions official Sound Transit resources', () => {
    render(<Disclaimer />);
    expect(
      screen.getByText(/Use official Sound Transit resources for authoritative schedule information/i)
    ).toBeInTheDocument();
  });

  it('has the disclaimer-text class on the paragraph', () => {
    const { container } = render(<Disclaimer />);
    expect(container.querySelector('.disclaimer-text')).toBeInTheDocument();
  });
});
