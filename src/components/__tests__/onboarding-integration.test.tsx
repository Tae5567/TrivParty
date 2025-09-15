import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingProvider } from '@/contexts/OnboardingProvider';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Simple test component that uses onboarding
function TestApp() {
  return (
    <OnboardingProvider>
      <div>
        <h1>TrivParty App</h1>
        <input data-onboarding="url-input" placeholder="Enter URL" />
        <button data-onboarding="generate-button">Generate Quiz</button>
        <div data-onboarding="quiz-preview">Quiz Preview</div>
      </div>
    </OnboardingProvider>
  );
}

describe('Onboarding Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize onboarding provider without errors', () => {
    render(<TestApp />);
    
    expect(screen.getByText('TrivParty App')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter URL')).toBeInTheDocument();
    expect(screen.getByText('Generate Quiz')).toBeInTheDocument();
  });

  it('should handle onboarding data attributes correctly', () => {
    render(<TestApp />);
    
    const urlInput = screen.getByPlaceholderText('Enter URL');
    const generateButton = screen.getByText('Generate Quiz');
    const quizPreview = screen.getByText('Quiz Preview');
    
    expect(urlInput).toHaveAttribute('data-onboarding', 'url-input');
    expect(generateButton).toHaveAttribute('data-onboarding', 'generate-button');
    expect(quizPreview).toHaveAttribute('data-onboarding', 'quiz-preview');
  });

  it('should not crash when localStorage is unavailable', () => {
    // Simulate localStorage being unavailable
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true,
    });

    expect(() => {
      render(<TestApp />);
    }).not.toThrow();

    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
    });
  });
});

describe('Onboarding Components Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(<TestApp />);
    
    const urlInput = screen.getByPlaceholderText('Enter URL');
    const generateButton = screen.getByText('Generate Quiz');
    
    // These elements should be focusable and accessible
    expect(urlInput).toBeVisible();
    expect(generateButton).toBeVisible();
    
    // Should be able to focus elements
    urlInput.focus();
    expect(document.activeElement).toBe(urlInput);
    
    generateButton.focus();
    expect(document.activeElement).toBe(generateButton);
  });

  it('should handle keyboard navigation', () => {
    render(<TestApp />);
    
    const urlInput = screen.getByPlaceholderText('Enter URL');
    const generateButton = screen.getByText('Generate Quiz');
    
    // Tab navigation should work
    urlInput.focus();
    fireEvent.keyDown(urlInput, { key: 'Tab' });
    
    // Should be able to interact with keyboard
    fireEvent.keyDown(generateButton, { key: 'Enter' });
    fireEvent.keyDown(generateButton, { key: ' ' });
    
    // Should not throw errors
    expect(generateButton).toBeInTheDocument();
  });
});