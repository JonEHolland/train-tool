import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Carousel } from './Carousel';

const mockItems = [
  <div key="1">Item 1</div>,
  <div key="2">Item 2</div>,
  <div key="3">Item 3</div>,
];

describe('Carousel', () => {
  it('renders first item by default', () => {
    render(<Carousel>{mockItems}</Carousel>);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('returns null for empty children', () => {
    const { container } = render(<Carousel>{[]}</Carousel>);
    expect(container.firstChild).toBeNull();
  });

  it('renders single child without controls', () => {
    render(<Carousel>{[<div key="1">Only item</div>]}</Carousel>);

    expect(screen.getByText('Only item')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Go to item/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Swipe for more/)).not.toBeInTheDocument();
  });

  it('navigates forward and back with arrows', () => {
    render(<Carousel>{mockItems}</Carousel>);

    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
  });

  it('navigates via dot buttons', () => {
    render(<Carousel>{mockItems}</Carousel>);

    const dots = screen.getAllByRole('button', { name: /Go to item/i });
    expect(dots).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Go to item 3' }));
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('navigates via swipe gestures', () => {
    render(<Carousel>{mockItems}</Carousel>);
    const content = screen.getByTestId('carousel-content');

    // Swipe left -> next
    fireEvent.touchStart(content, { touches: [{ clientX: 200 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(content);
    expect(screen.getByText('Item 2')).toBeInTheDocument();

    // Swipe right -> previous
    fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(content);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('ignores small swipes below threshold', () => {
    render(<Carousel>{mockItems}</Carousel>);
    const content = screen.getByTestId('carousel-content');

    fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 90 }] });
    fireEvent.touchEnd(content);

    // Still on first item
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });
});
