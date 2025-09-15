'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useThemeAnimations } from '@/hooks/useThemeAnimations';
import { ThemedButton } from './ThemedButton';
import { ThemedCard } from './ThemedCard';
import { Card } from './card';

export function ThemeDemo() {
  const { partyTheme, customBranding } = useTheme();
  const { getAnimationClass } = useThemeAnimations();

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold mb-4">Theme Demo</h2>
      
      {/* Current Theme Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Current Theme: {partyTheme.name}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Primary</div>
            <div 
              className="w-full h-8 rounded border"
              style={{ backgroundColor: partyTheme.colors.primary }}
            />
            <div className="text-xs font-mono">{partyTheme.colors.primary}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Secondary</div>
            <div 
              className="w-full h-8 rounded border"
              style={{ backgroundColor: partyTheme.colors.secondary }}
            />
            <div className="text-xs font-mono">{partyTheme.colors.secondary}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Accent</div>
            <div 
              className="w-full h-8 rounded border"
              style={{ backgroundColor: partyTheme.colors.accent }}
            />
            <div className="text-xs font-mono">{partyTheme.colors.accent}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Animations</div>
            <div className="text-sm capitalize">{partyTheme.animations}</div>
          </div>
        </div>
      </Card>

      {/* Custom Branding */}
      {(customBranding.title || customBranding.logo) && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Custom Branding</h3>
          <div className="flex items-center gap-4">
            {customBranding.logo && (
              <img 
                src={customBranding.logo} 
                alt="Custom logo" 
                className="h-12 w-12 object-contain rounded"
              />
            )}
            {customBranding.title && (
              <div className="text-lg font-semibold">{customBranding.title}</div>
            )}
          </div>
        </Card>
      )}

      {/* Themed Components Demo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Themed Buttons */}
        <ThemedCard className="p-4">
          <h3 className="font-semibold mb-4">Themed Buttons</h3>
          <div className="space-y-3">
            <ThemedButton themeVariant="primary" className="w-full">
              Primary Button
            </ThemedButton>
            <ThemedButton themeVariant="secondary" className="w-full">
              Secondary Button
            </ThemedButton>
            <ThemedButton themeVariant="accent" className="w-full">
              Accent Button
            </ThemedButton>
            <ThemedButton themeVariant="gradient" className="w-full">
              Gradient Button
            </ThemedButton>
          </div>
        </ThemedCard>

        {/* Animated Components */}
        <ThemedCard className="p-4">
          <h3 className="font-semibold mb-4">Animated Components</h3>
          <div className="space-y-3">
            <ThemedButton 
              themeVariant="primary" 
              animate="pulse" 
              className="w-full"
            >
              Pulsing Button
            </ThemedButton>
            <ThemedButton 
              themeVariant="secondary" 
              animate="bounce" 
              className="w-full"
            >
              Bouncing Button
            </ThemedButton>
            <ThemedButton 
              themeVariant="accent" 
              animate="glow" 
              className="w-full"
            >
              Glowing Button
            </ThemedButton>
          </div>
        </ThemedCard>
      </div>

      {/* Animation Classes Demo */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Animation Classes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 bg-blue-100 rounded text-center ${getAnimationClass('pulse')}`}>
            Pulse
          </div>
          <div className={`p-4 bg-green-100 rounded text-center ${getAnimationClass('bounce')}`}>
            Bounce
          </div>
          <div className={`p-4 bg-purple-100 rounded text-center ${getAnimationClass('glow')}`}>
            Glow
          </div>
          <div className={`p-4 bg-orange-100 rounded text-center ${getAnimationClass('float')}`}>
            Float
          </div>
        </div>
      </Card>
    </div>
  );
}