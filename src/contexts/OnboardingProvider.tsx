'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  showTutorial: boolean;
  isFirstVisit: boolean;
  completeTutorial: () => void;
  startTutorial: () => void;
  skipTutorial: () => void;
  isOnboardingComplete: boolean;
  currentOnboardingStep: string | null;
  setOnboardingStep: (step: string | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEYS = {
  TUTORIAL_COMPLETED: 'trivparty_tutorial_completed',
  FIRST_VISIT: 'trivparty_first_visit',
  ONBOARDING_STEP: 'trivparty_onboarding_step'
};

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if user has completed tutorial before
      const tutorialCompleted = localStorage?.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
      const hasVisited = localStorage?.getItem(STORAGE_KEYS.FIRST_VISIT) === 'false';
      const savedStep = localStorage?.getItem(STORAGE_KEYS.ONBOARDING_STEP);

      setIsOnboardingComplete(tutorialCompleted);
      setIsFirstVisit(!hasVisited);
      setCurrentOnboardingStep(savedStep);

      // Show tutorial for first-time users
      if (!tutorialCompleted && !hasVisited) {
        setShowTutorial(true);
        localStorage?.setItem(STORAGE_KEYS.FIRST_VISIT, 'false');
      }
    } catch (error) {
      // Handle cases where localStorage is not available
      console.warn('localStorage not available, using default onboarding state');
      setIsOnboardingComplete(false);
      setIsFirstVisit(true);
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    setIsOnboardingComplete(true);
    setCurrentOnboardingStep(null);
    try {
      localStorage?.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
      localStorage?.removeItem(STORAGE_KEYS.ONBOARDING_STEP);
    } catch (error) {
      console.warn('Could not save tutorial completion state');
    }
  };

  const startTutorial = () => {
    setShowTutorial(true);
    setCurrentOnboardingStep('welcome');
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    setIsOnboardingComplete(true);
    try {
      localStorage?.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
    } catch (error) {
      console.warn('Could not save tutorial skip state');
    }
  };

  const setOnboardingStep = (step: string | null) => {
    setCurrentOnboardingStep(step);
    try {
      if (step) {
        localStorage?.setItem(STORAGE_KEYS.ONBOARDING_STEP, step);
      } else {
        localStorage?.removeItem(STORAGE_KEYS.ONBOARDING_STEP);
      }
    } catch (error) {
      console.warn('Could not save onboarding step state');
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        showTutorial,
        isFirstVisit,
        completeTutorial,
        startTutorial,
        skipTutorial,
        isOnboardingComplete,
        currentOnboardingStep,
        setOnboardingStep
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}