import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label, Heading, Caption } from './Text';

// Helper to check if element has a class containing the given substring
// (handles CSS Module transformed class names)
function hasClassContaining(element: Element | null, substring: string): boolean {
  if (!element) return false;
  return element.className.split(' ').some(cls => cls.includes(substring));
}

describe('Label', () => {
  it('renders children', () => {
    render(<Label>SERVICE ALERTS</Label>);
    expect(screen.getByText('SERVICE ALERTS')).toBeInTheDocument();
  });

  it('renders as span', () => {
    const { container } = render(<Label>Label</Label>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(<Label className="custom-label">Label</Label>);
    expect(container.firstChild).toHaveClass('custom-label');
  });

  it('forwards native span props', () => {
    render(<Label data-testid="my-label" aria-label="Alert label">Label</Label>);

    const label = screen.getByTestId('my-label');
    expect(label).toHaveAttribute('aria-label', 'Alert label');
  });
});

describe('Heading', () => {
  it('renders children', () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders as h2 by default', () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders as h1 when level is 1', () => {
    render(<Heading level={1}>Main Title</Heading>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders as h3 when level is 3', () => {
    render(<Heading level={3}>Subtitle</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders as h4 when level is 4', () => {
    render(<Heading level={4}>Small Title</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
  });

  it('renders as h5 when level is 5', () => {
    render(<Heading level={5}>Tiny Title</Heading>);
    expect(screen.getByRole('heading', { level: 5 })).toBeInTheDocument();
  });

  it('renders as h6 when level is 6', () => {
    render(<Heading level={6}>Smallest Title</Heading>);
    expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(<Heading className="custom-heading">Title</Heading>);
    expect(container.firstChild).toHaveClass('custom-heading');
  });

  it('forwards native heading props', () => {
    render(<Heading data-testid="my-heading" id="main-title">Title</Heading>);

    const heading = screen.getByTestId('my-heading');
    expect(heading).toHaveAttribute('id', 'main-title');
  });
});

describe('Caption', () => {
  it('renders children', () => {
    render(<Caption>Secondary text</Caption>);
    expect(screen.getByText('Secondary text')).toBeInTheDocument();
  });

  it('renders as span', () => {
    const { container } = render(<Caption>Caption</Caption>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('does not apply muted class by default', () => {
    const { container } = render(<Caption>Caption</Caption>);
    expect(hasClassContaining(container.firstChild as Element, 'muted')).toBe(false);
  });

  it('applies muted class when muted prop is true', () => {
    const { container } = render(<Caption muted>Muted text</Caption>);
    expect(hasClassContaining(container.firstChild as Element, 'muted')).toBe(true);
  });

  it('forwards className prop', () => {
    const { container } = render(<Caption className="custom-caption">Caption</Caption>);
    expect(container.firstChild).toHaveClass('custom-caption');
  });

  it('forwards native span props', () => {
    render(<Caption data-testid="my-caption" title="More info">Caption</Caption>);

    const caption = screen.getByTestId('my-caption');
    expect(caption).toHaveAttribute('title', 'More info');
  });

  it('combines muted and custom className', () => {
    const { container } = render(<Caption muted className="custom">Text</Caption>);

    expect(hasClassContaining(container.firstChild as Element, 'muted')).toBe(true);
    expect(container.firstChild).toHaveClass('custom');
  });
});
