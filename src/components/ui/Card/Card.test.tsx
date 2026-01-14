import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody } from './Card';

// Helper to check if element has a class containing the given substring
// (handles CSS Module transformed class names)
function hasClassContaining(element: Element | null, substring: string): boolean {
  if (!element) return false;
  return element.className.split(' ').some(cls => cls.includes(substring));
}

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies overflow class when overflow is true', () => {
    const { container } = render(<Card overflow>Content</Card>);
    expect(hasClassContaining(container.firstChild as Element, 'overflow')).toBe(true);
  });

  it('does not apply overflow class by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(hasClassContaining(container.firstChild as Element, 'overflow')).toBe(false);
  });

  it('forwards className prop', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('forwards native div props', () => {
    render(<Card data-testid="my-card" aria-label="Test card">Content</Card>);

    const card = screen.getByTestId('my-card');
    expect(card).toHaveAttribute('aria-label', 'Test card');
  });

  it('renders nested components', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(container.firstChild).toHaveClass('custom-header');
  });

  it('renders complex children', () => {
    render(
      <CardHeader>
        <span data-testid="title">Title</span>
        <button>Action</button>
      </CardHeader>
    );

    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body Content</CardBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('forwards className prop', () => {
    const { container } = render(<CardBody className="custom-body">Body</CardBody>);
    expect(container.firstChild).toHaveClass('custom-body');
  });

  it('renders complex children', () => {
    render(
      <CardBody>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </CardBody>
    );

    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});
