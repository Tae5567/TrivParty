import { renderHook } from '@testing-library/react';
import { useThemeAnimations } from '../useThemeAnimations';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import React from 'react';

import { vi } from 'vitest';

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useThemeAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default animation classes for standard animations', () => {
    const { result } = renderHook(() => useThemeAnimations(), { wrapper });

    expect(result.current.animationClasses).toContain('transition-all');
    expect(result.current.animationClasses).toContain('duration-200');
    expect(result.current.shouldAnimate).toBe(true);
    expect(result.current.animationLevel).toBe('standard');
  });

  it('returns correct animation classes for different animation types', () => {
    const { result } = renderHook(() => useThemeAnimations(), { wrapper });

    expect(result.current.getAnimationClass('pulse')).toBe('animate-pulse');
    expect(result.current.getAnimationClass('bounce')).toBe('animate-bounce');
    expect(result.current.getAnimationClass('glow')).toBe('');
    expect(result.current.getAnimationClass('float')).toBe('');
  });

  it('handles minimal animations correctly', () => {
    // Mock a theme with minimal animations
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'trivparty-party-theme') {
        return JSON.stringify({
          name: 'Classic',
          colors: {
            primary: 'hsl(222.2 84% 4.9%)',
            secondary: 'hsl(210 40% 96%)',
            accent: 'hsl(210 40% 96%)',
            background: 'hsl(0 0% 100%)',
            foreground: 'hsl(222.2 84% 4.9%)',
          },
          font: 'system',
          animations: 'minimal',
        });
      }
      return null;
    });

    const { result } = renderHook(() => useThemeAnimations(), { wrapper });

    expect(result.current.animationClasses).toContain('transition-none');
    expect(result.current.shouldAnimate).toBe(false);
    expect(result.current.animationLevel).toBe('minimal');
    expect(result.current.getAnimationClass('pulse')).toBe('');
    expect(result.current.getAnimationClass('bounce')).toBe('');
  });

  it('handles enhanced animations correctly', () => {
    // Mock a theme with enhanced animations
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'trivparty-party-theme') {
        return JSON.stringify({
          name: 'Neon Party',
          colors: {
            primary: 'hsl(280 100% 70%)',
            secondary: 'hsl(200 100% 70%)',
            accent: 'hsl(60 100% 70%)',
            background: 'hsl(240 10% 3.9%)',
            foreground: 'hsl(0 0% 98%)',
          },
          font: 'system',
          animations: 'enhanced',
        });
      }
      return null;
    });

    const { result } = renderHook(() => useThemeAnimations(), { wrapper });

    expect(result.current.animationClasses).toContain('transition-all');
    expect(result.current.animationClasses).toContain('duration-300');
    expect(result.current.shouldAnimate).toBe(true);
    expect(result.current.animationLevel).toBe('enhanced');
    expect(result.current.getAnimationClass('pulse')).toBe('party-pulse');
    expect(result.current.getAnimationClass('bounce')).toBe('party-bounce');
    expect(result.current.getAnimationClass('glow')).toBe('party-glow');
    expect(result.current.getAnimationClass('float')).toBe('floating');
  });

  it('returns empty string for unknown animation types', () => {
    const { result } = renderHook(() => useThemeAnimations(), { wrapper });

    expect(result.current.getAnimationClass('unknown' as any)).toBe('');
  });
});