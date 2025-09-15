'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Youtube, Play, Users, Zap, Trophy, HelpCircle } from "lucide-react";
import { Tutorial } from "@/components/ui/Tutorial";
import { DemoMode } from "@/components/ui/DemoMode";
import { useOnboarding } from "@/contexts/OnboardingProvider";
import { useState } from "react";

export default function Home() {
  const { showTutorial, completeTutorial, startTutorial, isOnboardingComplete } = useOnboarding();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C084FC 50%, #A855F7 75%, #8B5CF6 100%)' }}>
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm floating" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 left-20 w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm floating" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 rounded-full bg-white/5 backdrop-blur-sm floating" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 glass-card flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TrivParty</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowDemo(true)}
              className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Try Demo</span>
            </button>
            {isOnboardingComplete && (
              <button 
                onClick={startTutorial}
                className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Help</span>
              </button>
            )}
            <Link href="/create">
              <button className="glass-button px-4 py-2 rounded-full text-white font-medium">
                <span className="hidden sm:inline">Create Quiz</span>
                <span className="sm:hidden">Create</span>
              </button>
            </Link>
            <Link href="/join">
              <button className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-white font-medium transition-all duration-300 backdrop-blur-sm border border-white/30">
                <span className="hidden sm:inline">Join Game</span>
                <span className="sm:hidden">Join</span>
              </button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-16 sm:mb-24">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
            Think fast.
            <span className="block gradient-text">Play Loud!</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Embark on a Journey of Knowledge Exploration with Our
            Extensive Collection of Interactive Quizzes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link href="/create">
              <button className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 flex items-center justify-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Get it now</span>
              </button>
            </Link>
            <button 
              onClick={() => setShowDemo(true)}
              className="w-full sm:w-auto glass-button px-8 py-4 rounded-full text-white font-semibold text-lg flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Try Interactive Demo</span>
            </button>
          </div>
        </div>



        {/* How It Works */}
        <div className="text-center mb-16 sm:mb-24">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-12">
            How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 glass-card flex items-center justify-center text-white text-2xl font-bold mb-6">
                1
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white">Choose Your Source</h4>
              <p className="text-white/80 leading-relaxed">
                Paste a Wikipedia article or YouTube video URL
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 glass-card flex items-center justify-center text-white text-2xl font-bold mb-6">
                2
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white"> Generate Questions</h4>
              <p className="text-white/80 leading-relaxed">
                AI creates engaging multiple-choice questions from the content
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 glass-card flex items-center justify-center text-white text-2xl font-bold mb-6">
                3
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white">Play & Share</h4>
              <p className="text-white/80 leading-relaxed">
                Start playing immediately or share with friends to join
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative">
          {/* Solid background overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-purple-700/90 rounded-2xl"></div>
          <div className="relative glass-card p-8 sm:p-12 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-6 text-white drop-shadow-lg">Ready to Get Started?</h3>
            <p className="text-xl text-white mb-8 leading-relaxed drop-shadow-md">
              Create your first quiz in under 2 minutes
            </p>
            <Link href="/create">
              <button className="bg-white hover:bg-gray-100 text-purple-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto shadow-lg">
                <Zap className="w-5 h-5" />
                <span>Create Your First Quiz</span>
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 mt-16 border-t border-white/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left text-white/60">
            <p>&copy; 2024 TrivParty. Turn any content into interactive trivia.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/rules" className="text-white/60 hover:text-white transition-colors">
              Game Rules
            </Link>
            <Link href="/create" className="text-white/60 hover:text-white transition-colors">
              Create Quiz
            </Link>
            <Link href="/join" className="text-white/60 hover:text-white transition-colors">
              Join Game
            </Link>
          </div>
        </div>
      </footer>

      {/* Tutorial Modal */}
      <Tutorial 
        isOpen={showTutorial} 
        onClose={() => {}} 
        onComplete={completeTutorial} 
      />

      {/* Demo Mode */}
      <DemoMode 
        isOpen={showDemo} 
        onClose={() => setShowDemo(false)} 
      />
    </div>
  );
}
