'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Play, Users, Trophy, Clock, CheckCircle } from 'lucide-react';

interface DemoModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const demoQuestions = [
  {
    id: '1',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    explanation: 'Paris has been the capital of France since 987 AD.'
  },
  {
    id: '2',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
    explanation: 'Mars appears red due to iron oxide (rust) on its surface.'
  }
];

const demoPlayers = [
  { id: '1', name: 'Alex', score: 200 },
  { id: '2', name: 'Sam', score: 150 },
  { id: '3', name: 'Jordan', score: 100 }
];

export function DemoMode({ isOpen, onClose }: DemoModeProps) {
  const [demoStep, setDemoStep] = useState<'intro' | 'quiz-creation' | 'gameplay' | 'results'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const resetDemo = () => {
    setDemoStep('intro');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(15);
  };

  // Timer effect for gameplay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (demoStep === 'gameplay' && !selectedAnswer && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - auto select wrong answer
            handleAnswerSelect(demoQuestions[currentQuestion].options[0]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [demoStep, selectedAnswer, timeLeft, currentQuestion]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };

  const nextQuestion = () => {
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(15); // Reset timer for next question
    } else {
      setDemoStep('results');
    }
  };

  const renderIntro = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Play className="w-16 h-16 text-blue-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Interactive Demo</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Experience TrivParty in action! This demo shows you how to create quizzes and play with friends.
        </p>
      </div>
      <Button onClick={() => setDemoStep('quiz-creation')} className="w-full">
        Start Demo
      </Button>
    </div>
  );

  const renderQuizCreation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Creating Your Quiz</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Watch how easy it is to generate a quiz from any Wikipedia page or YouTube video.
        </p>
      </div>
      
      <Card className="border-dashed border-2 border-blue-300 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Content Source</label>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <code className="text-sm text-gray-800 dark:text-gray-200">https://en.wikipedia.org/wiki/Solar_System</code>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Content extracted successfully!</span>
            </div>
            
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Quiz generated with 15 questions</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={() => setDemoStep('gameplay')} className="w-full">
        Start Playing
      </Button>
    </div>
  );

  const renderGameplay = () => {
    const question = demoQuestions[currentQuestion];
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Badge variant="secondary">Question {currentQuestion + 1} of {demoQuestions.length}</Badge>
          <div className={`flex items-center gap-2 ${timeLeft <= 5 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{timeLeft}s</span>
          </div>
        </div>
        
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`
                    justify-start h-auto p-4 text-left rounded-lg border transition-all font-medium
                    ${selectedAnswer === option
                      ? option === question.correctAnswer
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-red-500 text-white border-red-600"
                      : showExplanation && option === question.correctAnswer
                      ? "bg-green-500 text-white border-green-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                    ${!!selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  onClick={() => !selectedAnswer && handleAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {showExplanation && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Demo leaderboard */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-gray-900 dark:text-white">
              <Users className="w-4 h-4" />
              Live Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demoPlayers.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className={player.name === 'You' ? 'font-bold' : ''}>{player.name}</span>
                  </div>
                  <span className="font-mono">{player.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {showExplanation && (
          <Button onClick={nextQuestion} className="w-full">
            {currentQuestion < demoQuestions.length - 1 ? 'Next Question' : 'View Results'}
          </Button>
        )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <Trophy className="w-16 h-16 text-yellow-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Game Complete!</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Great job! You&apos;ve experienced the full TrivParty flow.
        </p>
      </div>
      
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Final Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoPlayers.map((player, index) => (
              <div key={player.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                </div>
                <span className="font-mono text-lg text-gray-900 dark:text-white">{player.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-3">
        <button 
          onClick={resetDemo} 
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
        <Button onClick={onClose} className="flex-1">
          Start Creating
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {demoStep === 'intro' && 'Welcome to TrivParty'}
            {demoStep === 'quiz-creation' && 'Demo: Quiz Creation'}
            {demoStep === 'gameplay' && 'Demo: Gameplay'}
            {demoStep === 'results' && 'Demo: Results'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {demoStep === 'intro' && renderIntro()}
          {demoStep === 'quiz-creation' && renderQuizCreation()}
          {demoStep === 'gameplay' && renderGameplay()}
          {demoStep === 'results' && renderResults()}
        </div>
      </DialogContent>
    </Dialog>
  );
}