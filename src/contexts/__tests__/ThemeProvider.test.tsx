import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Test component that uses the theme context
function TestComponent() {
  const {
    theme,
    setTheme,
    partyTheme,
    setPartyTheme,
    availablePartyThemes,
    customBranding,
    setCustomBranding,
  } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="party-theme">{partyTheme.name}</div>
      <div data-testid="custom-title">{customBranding.title || 'No title'}</div>
      
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
      
      <button
        onClick={() => setPartyTheme(availablePartyThemes[1])}
        data-testid="set-neon-theme"
      >
        Set Neon Theme
      </button>
      
      <button
        onClick={() => setCustomBranding({ title: 'Custom Quiz' })}
        data-testid="set-custom-title"
      >
        Set Custom Title
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('provides default theme values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('party-theme')).toHaveTextContent('Classic');
    expect(screen.getByTestId('custom-title')).toHaveTextContent('No title');
  });

  it('allows changing the theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('trivparty-theme', 'dark');
  });

  it('allows changing the party theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-neon-theme'));
    
    await waitFor(() => {
      expect(screen.getByTestId('party-theme')).toHaveTextContent('Neon Party');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trivparty-party-theme',
      expect.stringContaining('Neon Party')
    );
  });

  it('allows setting custom branding', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-custom-title'));
    
    await waitFor(() => {
      expect(screen.getByTestId('custom-title')).toHaveTextContent('Custom Quiz');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trivparty-custom-branding',
      expect.stringContaining('Custom Quiz')
    );
  });

  it('loads saved preferences from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'trivparty-theme') return 'dark';
      if (key === 'trivparty-party-theme') {
        return JSON.stringify({
          name: 'Ocean Breeze',
          colors: {
            primary: 'hsl(200 100% 50%)',
            secondary: 'hsl(180 100% 70%)',
            accent: 'hsl(160 100% 60%)',
            background: 'hsl(210 100% 97%)',
            foreground: 'hsl(200 100% 10%)',
          },
          font: 'system',
          animations: 'standard',
        });
      }
      if (key === 'trivparty-custom-branding') {
        return JSON.stringify({ title: 'Saved Quiz' });
      }
      return null;
    });

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('party-theme')).toHaveTextContent('Ocean Breeze');
    expect(screen.getByTestId('custom-title')).toHaveTextContent('Saved Quiz');
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'trivparty-party-theme') return 'invalid json';
      if (key === 'trivparty-custom-branding') return 'invalid json';
      return null;
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fall back to defaults
    expect(screen.getByTestId('party-theme')).toHaveTextContent('Classic');
    expect(screen.getByTestId('custom-title')).toHaveTextContent('No title');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse saved party theme:',
      expect.any(Error)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse saved custom branding:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('throws error when useTheme is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});