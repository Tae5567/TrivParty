'use client';

import { ThemeDemo } from '@/components/ui/ThemeDemo';
import { ThemeSettings } from '@/components/ui/ThemeSettings';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-blue-600">Theme Demo</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ThemeSettings />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto">
        <ThemeDemo />
      </main>
    </div>
  );
}