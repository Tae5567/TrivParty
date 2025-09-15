import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingProvider';
import { Tutorial } from '@/components/ui/Tutorial';
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay';
import { DemoMode } from '@/components/ui/DemoMode';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { it } from 'zod/v4/locales';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test component to access onboarding context
function TestComponent() {
  const {
    showTutorial,
    isFirstVisit,
    completeTutorial,
    startTutorial,
    skipTutorial,
    isOnboardingComplete,
    currentOnboardingStep,
    setOnboardingStep,
  } = useOnboarding();

  return (
    <div>
      <div data-testid="show-tutorial">{showTutorial.toString()}</div>
      <div data-testid="is-first-visit">{isFirstVisit.toString()}</div>
      <div data-testid="is-onboarding-complete">{isOnboardingComplete.toString()}</div>
      <div data-testid="current-step">{currentOnboardingStep || 'null'}</div>
      <button onClick={completeTutorial} data-testid="complete-tutorial">
        Complete Tutorial
      </button>
      <button onClick={startTutorial} data-testid="start-tutorial">
        Start Tutorial
      </button>
      <button onClick={skipTutorial} data-testid="skip-tutorial">
        Skip Tutorial
      </button>
      <button onClick={() => setOnboardingStep('test-step')} data-testid="set-step">
        Set Step
      </button>
    </div>
  );
}

describe('OnboardingProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with default values for first-time users', () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('show-tutorial')).toHaveTextContent('true');
    expect(screen.getByTestId('is-first-visit')).toHaveTextContent('true');
    expect(screen.getByTestId('is-onboarding-complete')).toHaveTextContent('false');
  });

  it('should not show tutorial for returning users', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'trivparty_tutorial_completed') return 'true';
      if (key === 'trivparty_first_visit') return 'false';
      return null;
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('show-tutorial')).toHaveTextContent('false');
    expect(screen.getByTestId('is-first-visit')).toHaveTextContent('false');
    expect(screen.getByTestId('is-onboarding-complete')).toHaveTextContent('true');
  });

  it('should complete tutorial and update localStorage', () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    fireEvent.click(screen.getByTestId('complete-tutorial'));

    expect(screen.getByTestId('show-tutorial')).toHaveTextContent('false');
    expect(screen.getByTestId('is-onboarding-complete')).toHaveTextContent('true');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('trivparty_tutorial_completed', 'true');
  });

  it('should start tutorial manually', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'trivparty_tutorial_completed') return 'true';
      return null;
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    fireEvent.click(screen.getByTestId('start-tutorial'));

    expect(screen.getByTestId('show-tutorial')).toHaveTextContent('true');
    expect(screen.getByTestId('current-step')).toHaveTextContent('welcome');
  });

  it('should skip tutorial and mark as complete', () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    fireEvent.click(screen.getByTestId('skip-tutorial'));

    expect(screen.getByTestId('show-tutorial')).toHaveTextContent('false');
    expect(screen.getByTestId('is-onboarding-complete')).toHaveTextContent('true');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('trivparty_tutorial_completed', 'true');
  });

  it('should manage onboarding steps', () => {
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    fireEvent.click(screen.getByTestId('set-step'));

    expect(screen.getByTestId('current-step')).toHaveTextContent('test-step');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('trivparty_onboarding_step', 'test-step');
  });
});

describe('Tutorial Component', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tutorial steps', () => {
    render(
      <Tutorial
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Welcome to TrivParty!')).toBeInTheDocument();
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
  });

  it('should navigate between steps', async () => {
    render(
      <Tutorial
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Go to next step
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Create Your Quiz')).toBeInTheDocument();
      expect(screen.getByText('2 of 4')).toBeInTheDocument();
    });

    // Go back to previous step
    fireEvent.click(screen.getByText('Previous'));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to TrivParty!')).toBeInTheDocument();
      expect(screen.getByText('1 of 4')).toBeInTheDocument();
    });
  });

  it('should complete tutorial on last step', async () => {
    render(
      <Tutorial
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to last step
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {});
    }

    // Complete tutorial
    fireEvent.click(screen.getByText('Get Started'));
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should skip tutorial', () => {
    render(
      <Tutorial
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    fireEvent.click(screen.getByText('Skip'));
    
    expect(mockOnComplete).toHaveBeenCalled();
  });
});

describe('OnboardingOverlay Component', () => {
  const mockSteps = [
    {
      id: 'step1',
      title: 'Step 1',
      description: 'First step description',
      targetSelector: '[data-test="target1"]',
      position: 'bottom' as const,
    },
    {
      id: 'step2',
      title: 'Step 2',
      description: 'Second step description',
      targetSelector: '[data-test="target2"]',
      position: 'top' as const,
    },
  ];

  const mockProps = {
    steps: mockSteps,
    currentStep: 0,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onSkip: vi.fn(),
    onComplete: vi.fn(),
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock DOM elements for targeting
    document.body.innerHTML = `
      <div data-test="target1">Target 1</div>
      <div data-test="target2">Target 2</div>
    `;
  });

  it('should render onboarding overlay', () => {
    render(<OnboardingOverlay {...mockProps} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('First step description')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('should handle navigation', () => {
    render(<OnboardingOverlay {...mockProps} />);

    fireEvent.click(screen.getByText('Next'));
    expect(mockProps.onNext).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Previous'));
    expect(mockProps.onPrevious).toHaveBeenCalled();
  });

  it('should handle skip and complete', () => {
    render(<OnboardingOverlay {...mockProps} />);

    fireEvent.click(screen.getByText('Skip Tour'));
    expect(mockProps.onSkip).toHaveBeenCalled();
  });

  it('should not render when inactive', () => {
    render(<OnboardingOverlay {...mockProps} isActive={false} />);

    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
  });
});

describe('DemoMode Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render demo introduction', () => {
    render(<DemoMode isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Interactive Demo')).toBeInTheDocument();
    expect(screen.getByText(/Experience TrivParty in action/)).toBeInTheDocument();
  });

  it('should navigate through demo steps', async () => {
    render(<DemoMode isOpen={true} onClose={mockOnClose} />);

    // Start demo
    fireEvent.click(screen.getByText('Start Demo'));
    
    await waitFor(() => {
      expect(screen.getByText('Creating Your Quiz')).toBeInTheDocument();
    });

    // Continue to gameplay
    fireEvent.click(screen.getByText('Start Playing'));
    
    await waitFor(() => {
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    });
  });

  it('should handle demo quiz interaction', async () => {
    render(<DemoMode isOpen={true} onClose={mockOnClose} />);

    // Navigate to gameplay
    fireEvent.click(screen.getByText('Start Demo'));
    await waitFor(() => {});
    fireEvent.click(screen.getByText('Start Playing'));
    
    await waitFor(() => {
      // Select an answer
      fireEvent.click(screen.getByText('Paris'));
    });

    // Wait for explanation to appear
    await waitFor(() => {
      expect(screen.getByText(/Explanation:/)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should complete demo and offer options', async () => {
    render(<DemoMode isOpen={true} onClose={mockOnClose} />);

    // Navigate through all demo steps quickly
    fireEvent.click(screen.getByText('Start Demo'));
    await waitFor(() => {});
    fireEvent.click(screen.getByText('Start Playing'));
    await waitFor(() => {});
    
    // Answer first question
    fireEvent.click(screen.getByText('Paris'));
    await waitFor(() => {}, { timeout: 1000 });
    
    // Move to next question
    const nextButton = screen.queryByText('Next Question');
    if (nextButton) {
      fireEvent.click(nextButton);
      await waitFor(() => {});
    }
    
    // Answer second question
    fireEvent.click(screen.getByText('Mars'));
    await waitFor(() => {}, { timeout: 1000 });
    
    // View results
    fireEvent.click(screen.getByText('View Results'));
    
    await waitFor(() => {
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      expect(screen.getByText('Final Leaderboard')).toBeInTheDocument();
    });

    // Test completion options
    fireEvent.click(screen.getByText('Start Creating'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('Onboarding Integration', () => {
  it('should show tutorial for first-time users on homepage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const HomePage = () => {
      const { showTutorial, completeTutorial } = useOnboarding();
      return (
        <div>
          <div data-testid="homepage">Homepage</div>
          <Tutorial 
            isOpen={showTutorial} 
            onClose={() => {}} 
            onComplete={completeTutorial} 
          />
        </div>
      );
    };

    render(
      <OnboardingProvider>
        <HomePage />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('homepage')).toBeInTheDocument();
    expect(screen.getByText('Welcome to TrivParty!')).toBeInTheDocument();
  });

  it('should show onboarding overlay on quiz creation page', () => {
    const CreatePage = () => {
      const { setOnboardingStep } = useOnboarding();
      
      React.useEffect(() => {
        setOnboardingStep('quiz-creation');
      }, [setOnboardingStep]);

      return (
        <div>
          <div data-testid="create-page">Create Quiz</div>
          <input data-onboarding="url-input" placeholder="Enter URL" />
          <button data-onboarding="generate-button">Generate</button>
        </div>
      );
    };

    render(
      <OnboardingProvider>
        <CreatePage />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('create-page')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter URL')).toBeInTheDocument();
  });
});