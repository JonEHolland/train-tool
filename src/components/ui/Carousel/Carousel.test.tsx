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

  it('renders all items for sliding (hidden via CSS overflow)', () => {
    render(<Carousel>{mockItems}</Carousel>);
    // With sliding carousel, all items are in DOM but only one visible via CSS
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('returns null for empty children', () => {
    const { container } = render(<Carousel>{[]}</Carousel>);
    expect(container.firstChild).toBeNull();
  });

  describe('navigation dots', () => {
    it('renders dots for multiple items', () => {
      render(<Carousel>{mockItems}</Carousel>);
      const dots = screen.getAllByRole('button', { name: /Go to item/i });
      expect(dots).toHaveLength(3);
    });

    it('does not render dots for single item', () => {
      render(<Carousel>{[<div key="1">Only Item</div>]}</Carousel>);
      expect(screen.queryByRole('button', { name: /Go to item/i })).not.toBeInTheDocument();
    });

    it('does not render dots when showDots is false', () => {
      render(<Carousel showDots={false}>{mockItems}</Carousel>);
      expect(screen.queryByRole('button', { name: /Go to item/i })).not.toBeInTheDocument();
    });

    it('navigates to item when dot is clicked', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Go to item 3' }));
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('arrow navigation', () => {
    it('shows next arrow when not at end', () => {
      render(<Carousel>{mockItems}</Carousel>);
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('does not show prev arrow at start', () => {
      render(<Carousel>{mockItems}</Carousel>);
      expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    });

    it('navigates to next item when next arrow is clicked', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('shows prev arrow after navigating forward', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    });

    it('navigates back when prev arrow is clicked', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('does not show next arrow at end', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });

    it('does not render arrows when showArrows is false', () => {
      render(<Carousel showArrows={false}>{mockItems}</Carousel>);
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });
  });

  describe('swipe navigation', () => {
    it('navigates to next on swipe left', () => {
      render(<Carousel>{mockItems}</Carousel>);
      const content = screen.getByTestId('carousel-content');

      fireEvent.touchStart(content, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(content);

      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('navigates to previous on swipe right', () => {
      render(<Carousel>{mockItems}</Carousel>);
      const content = screen.getByTestId('carousel-content');

      // First go to second item
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Swipe right
      fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(content);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('does not navigate on small swipe', () => {
      render(<Carousel>{mockItems}</Carousel>);
      const content = screen.getByTestId('carousel-content');

      fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 90 }] });
      fireEvent.touchEnd(content);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('respects swipeThreshold prop', () => {
      render(<Carousel swipeThreshold={10}>{mockItems}</Carousel>);
      const content = screen.getByTestId('carousel-content');

      // Small swipe that exceeds custom threshold
      fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 85 }] });
      fireEvent.touchEnd(content);

      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('hint text', () => {
    it('shows hint with current position', () => {
      render(<Carousel>{mockItems}</Carousel>);
      expect(screen.getByText(/Swipe for more \(1\/3\)/)).toBeInTheDocument();
    });

    it('updates hint when navigating', () => {
      render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByText(/Swipe for more \(2\/3\)/)).toBeInTheDocument();
    });

    it('does not show hint for single item', () => {
      render(<Carousel>{[<div key="1">Only</div>]}</Carousel>);
      expect(screen.queryByText(/Swipe for more/)).not.toBeInTheDocument();
    });

    it('uses custom hintText prop', () => {
      render(<Carousel hintText="Swipe for more alerts">{mockItems}</Carousel>);
      expect(screen.getByText('Swipe for more alerts (1/3)')).toBeInTheDocument();
    });

    it('does not show hint when showHint is false', () => {
      render(<Carousel showHint={false}>{mockItems}</Carousel>);
      expect(screen.queryByText(/Swipe for more/)).not.toBeInTheDocument();
    });
  });

  describe('header slot', () => {
    it('renders header content when provided', () => {
      render(<Carousel header={<span>My Header</span>}>{mockItems}</Carousel>);
      expect(screen.getByText('My Header')).toBeInTheDocument();
    });

    it('does not render header when not provided', () => {
      const { container } = render(<Carousel showDots={false}>{[<div key="1">Only</div>]}</Carousel>);
      // No header section when no header prop and single item (no dots)
      expect(container.querySelector('[class*="header"]')).not.toBeInTheDocument();
    });

    it('renders header with dots in same row', () => {
      render(<Carousel header={<span>Alerts</span>}>{mockItems}</Carousel>);
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Go to item/i })).toHaveLength(3);
    });
  });

  describe('active dot styling', () => {
    it('marks first dot as active initially', () => {
      const { container } = render(<Carousel>{mockItems}</Carousel>);
      const dots = container.querySelectorAll('button[aria-label^="Go to item"]');
      expect(dots[0].className).toContain('Active');
      expect(dots[1].className).not.toContain('Active');
    });

    it('updates active dot when navigating', () => {
      const { container } = render(<Carousel>{mockItems}</Carousel>);

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      const dots = container.querySelectorAll('button[aria-label^="Go to item"]');
      expect(dots[0].className).not.toContain('Active');
      expect(dots[1].className).toContain('Active');
    });
  });

  it('forwards className prop', () => {
    const { container } = render(<Carousel className="custom-carousel">{mockItems}</Carousel>);
    expect(container.firstChild).toHaveClass('custom-carousel');
  });

  describe('single child optimization', () => {
    it('renders single child without carousel controls', () => {
      render(<Carousel>{[<div key="1">Only item</div>]}</Carousel>);

      // Content is visible
      expect(screen.getByText('Only item')).toBeInTheDocument();

      // No navigation controls
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Go to item/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Swipe for more/)).not.toBeInTheDocument();
    });

    it('renders header with single child', () => {
      render(
        <Carousel header={<span>Alerts</span>}>
          {[<div key="1">Only alert</div>]}
        </Carousel>
      );

      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Only alert')).toBeInTheDocument();
    });

    it('does not set up swipe handlers for single child', () => {
      const { container } = render(<Carousel>{[<div key="1">Only</div>]}</Carousel>);

      // Verify no track element with transform (used for multi-item sliding)
      const track = container.querySelector('[class*="track"]');
      expect(track).not.toBeInTheDocument();
    });
  });
});

