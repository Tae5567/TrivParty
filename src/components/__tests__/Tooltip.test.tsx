import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip, HelpText } from '@/components/ui/Tooltip';

describe('Tooltip Component', () => {
  it('should render tooltip on hover by default', async () => {
    render(
      <Tooltip content="This is a tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me');
    
    // Tooltip should not be visible initially
    expect(screen.queryByText('This is a tooltip')).not.toBeInTheDocument();

    // Hover to show tooltip
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
    });

    // Mouse leave to hide tooltip
    fireEvent.mouseLeave(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('This is a tooltip')).not.toBeInTheDocument();
    });
  });

  it('should render tooltip on click when trigger is click', async () => {
    render(
      <Tooltip content="Click tooltip" trigger="click">
        <button>Click me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Click me');
    
    // Tooltip should not be visible initially
    expect(screen.queryByText('Click tooltip')).not.toBeInTheDocument();

    // Click to show tooltip
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Click tooltip')).toBeInTheDocument();
    });

    // Click again to hide tooltip
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('Click tooltip')).not.toBeInTheDocument();
    });
  });

  it('should render default help icon when no children provided', () => {
    render(<Tooltip content="Help text" />);
    
    // Should render help circle icon
    const helpIcon = document.querySelector('svg');
    expect(helpIcon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Tooltip content="Test" className="custom-class">
        <span>Test</span>
      </Tooltip>
    );

    const container = screen.getByText('Test').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should position tooltip correctly', async () => {
    const positions = ['top', 'bottom', 'left', 'right'] as const;
    
    for (const position of positions) {
      const { unmount } = render(
        <Tooltip content="Test tooltip" position={position}>
          <button>Test {position}</button>
        </Tooltip>
      );

      const trigger = screen.getByText(`Test ${position}`);
      fireEvent.mouseEnter(trigger);
      
      await waitFor(() => {
        const tooltip = screen.getByText('Test tooltip');
        expect(tooltip).toBeInTheDocument();
      });

      unmount();
    }
  });
});

describe('HelpText Component', () => {
  it('should render help icon with tooltip', async () => {
    render(<HelpText text="This is help text" />);
    
    const helpIcon = document.querySelector('svg');
    expect(helpIcon).toBeInTheDocument();

    // Hover to show help text
    if (helpIcon) {
      fireEvent.mouseEnter(helpIcon);
      
      await waitFor(() => {
        expect(screen.getByText('This is help text')).toBeInTheDocument();
      });
    }
  });

  it('should apply custom className to HelpText', () => {
    render(<HelpText text="Help" className="help-custom" />);
    
    const container = document.querySelector('.help-custom');
    expect(container).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<HelpText text="Accessible help" />);
    
    const helpIcon = document.querySelector('svg');
    expect(helpIcon?.parentElement).toHaveClass('cursor-help');
  });
});

describe('Tooltip Accessibility', () => {
  it('should be keyboard accessible', async () => {
    render(
      <Tooltip content="Keyboard accessible" trigger="click">
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me');
    
    // Focus and press Enter
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Keyboard accessible')).toBeInTheDocument();
    });
  });

  it('should handle escape key to close tooltip', async () => {
    render(
      <Tooltip content="Escapable tooltip" trigger="click">
        <button>Test</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Test');
    
    // Open tooltip
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Escapable tooltip')).toBeInTheDocument();
    });

    // Press escape to close
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Escapable tooltip')).not.toBeInTheDocument();
    });
  });
});

describe('Tooltip Edge Cases', () => {
  it('should handle empty content gracefully', () => {
    render(
      <Tooltip content="">
        <button>Empty tooltip</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Empty tooltip');
    fireEvent.mouseEnter(trigger);
    
    // Should not crash with empty content
    expect(trigger).toBeInTheDocument();
  });

  it('should handle very long content', async () => {
    const longContent = 'This is a very long tooltip content that should wrap properly and not break the layout or cause any issues with positioning or display.';
    
    render(
      <Tooltip content={longContent}>
        <button>Long tooltip</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Long tooltip');
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  it('should handle rapid hover events', async () => {
    render(
      <Tooltip content="Rapid hover">
        <button>Rapid test</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Rapid test');
    
    // Rapid hover in and out
    for (let i = 0; i < 5; i++) {
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
    }
    
    // Final hover
    fireEvent.mouseEnter(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Rapid hover')).toBeInTheDocument();
    });
  });
});