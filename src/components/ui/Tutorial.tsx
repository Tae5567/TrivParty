'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ChevronLeft, ChevronRight, X, Play, Users, Trophy, Lightbulb } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  image?: string;
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  steps?: TutorialStep[];
}

const defaultSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TrivParty!',
    content: 'Create engaging trivia games from Wikipedia pages or YouTube videos. Invite friends and compete in real-time!',
    icon: <Play className="w-8 h-8 text-blue-500" />
  },
  {
    id: 'create-quiz',
    title: 'Create Your Quiz',
    content: 'Paste a Wikipedia URL or YouTube link. Our AI will generate multiple-choice questions automatically from the content.',
    icon: <Lightbulb className="w-8 h-8 text-yellow-500" />
  },
  {
    id: 'invite-players',
    title: 'Invite Players',
    content: 'Share the session link with friends. They can join with just a nickname - no account required!',
    icon: <Users className="w-8 h-8 text-green-500" />
  },
  {
    id: 'play-compete',
    title: 'Play & Compete',
    content: 'Answer questions in real-time, see live scores, and compete for the top spot on the leaderboard!',
    icon: <Trophy className="w-8 h-8 text-purple-500" />
  }
];

export function Tutorial({ isOpen, onClose, onComplete, steps = defaultSteps }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Getting Started
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {currentStepData.icon}
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">{currentStepData.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentStepData.content}
              </p>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentStep + 1} of {steps.length}
            </span>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext} className="flex items-center gap-2">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}