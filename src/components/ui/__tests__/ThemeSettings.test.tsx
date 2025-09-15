import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeSettings } from '../ThemeSettings';
import { ThemeProvider } from '@/contexts/ThemeProvider';

import { vi } from 'vitest';

// Mock file reading
const mockFileReader = {
  readAsDataURL: vi.fn(),
  result: 'data:image/png;base64,mock-image-data',
  onload: null as any,
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
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

describe('ThemeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('renders theme settings dialog trigger', () => {
    renderWithProvider(<ThemeSettings />);
    
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('opens theme settings dialog when clicked', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Theme & Customization')).toBeInTheDocument();
    });
  });

  it('displays display mode options', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Display Mode')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    });
  });

  it('displays party theme options', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Party Themes')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /classic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /neon party/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ocean breeze/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sunset vibes/i })).toBeInTheDocument();
    });
  });

  it('displays animation settings', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Animations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /minimal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /standard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enhanced/i })).toBeInTheDocument();
    });
  });

  it('displays custom branding options', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Custom Branding')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Custom quiz title')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload logo/i })).toBeInTheDocument();
    });
  });

  it('allows changing quiz title', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Custom quiz title');
      fireEvent.change(titleInput, { target: { value: 'My Custom Quiz' } });
      expect(titleInput).toHaveValue('My Custom Quiz');
    });
  });

  it('displays custom color controls', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Custom Colors')).toBeInTheDocument();
      // Check for color inputs instead of text labels
      const colorInputs = screen.getAllByDisplayValue(/hsl\(/);
      expect(colorInputs.length).toBeGreaterThan(0);
    });
  });

  it('handles logo upload', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload logo/i });
      fireEvent.click(uploadButton);
    });

    // Simulate file selection
    const file = new File(['mock-image'], 'logo.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (input) {
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(input);
      
      // Simulate FileReader onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }
    }
  });

  it('has reset to defaults functionality', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
      expect(resetButton).toBeInTheDocument();
      fireEvent.click(resetButton);
    });
  });

  it('can close the dialog', async () => {
    renderWithProvider(<ThemeSettings />);
    
    fireEvent.click(screen.getByRole('button', { name: /theme/i }));
    
    await waitFor(() => {
      const doneButton = screen.getByRole('button', { name: /done/i });
      fireEvent.click(doneButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Theme & Customization')).not.toBeInTheDocument();
    });
  });
});