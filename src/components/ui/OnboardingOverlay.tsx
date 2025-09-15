'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { X, ArrowRight, Target } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

interface OnboardingOverlayProps {
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isActive: boolean;
}

export function OnboardingOverlay({
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  isActive
}: OnboardingOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const findTarget = () => {
      const element = document.querySelector(currentStepData.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate position for the overlay
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let top = rect.top + scrollTop;
        let left = rect.left + scrollLeft;
        
        // Adjust position based on desired placement
        switch (currentStepData.position) {
          case 'bottom':
            top += rect.height + 10;
            left += rect.width / 2;
            break;
          case 'top':
            top -= 10;
            left += rect.width / 2;
            break;
          case 'right':
            top += rect.height / 2;
            left += rect.width + 10;
            break;
          case 'left':
            top += rect.height / 2;
            left -= 10;
            break;
        }
        
        setOverlayPosition({ top, left });
        
        // Highlight the target element
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '8px';
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Try to find the element immediately, then retry after a short delay
    findTarget();
    const timeout = setTimeout(findTarget, 100);

    return () => {
      clearTimeout(timeout);
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [currentStep, currentStepData, isActive, targetElement]);

  if (!isActive || !currentStepData) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onNext();
    } else {
      onComplete();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-1000" />
      
      {/* Onboarding card */}
      <div
        className="fixed z-1002 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          top: overlayPosition.top,
          left: overlayPosition.left,
        }}
      >
        <Card className="w-80 shadow-xl border-blue-200 bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{currentStepData.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{currentStepData.description}</p>
            
            {currentStepData.action && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Try it:</strong> {currentStepData.action}
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={onPrevious}
                disabled={currentStep === 0}
                size="sm"
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onSkip} size="sm">
                  Skip Tour
                </Button>
                <Button onClick={handleNext} size="sm" className="flex items-center gap-1">
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}