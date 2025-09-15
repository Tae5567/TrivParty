'use client';

import { useTheme } from '@/contexts/ThemeProvider';
import { useEffect, useState } from 'react';

export function useThemeAnimations() {
  const { partyTheme } = useTheme();
  const [animationClasses, setAnimationClasses] = useState<string>('');

  useEffect(() => {
    const classes = [];
    
    switch (partyTheme.animations) {
      case 'minimal':
        classes.push('transition-none');
        break;
      case 'enhanced':
        classes.push('transition-all', 'duration-300', 'ease-in-out');
        break;
      default:
        classes.push('transition-all', 'duration-200', 'ease-in-out');
    }

    setAnimationClasses(classes.join(' '));
  }, [partyTheme.animations]);

  const getAnimationClass = (type: 'pulse' | 'bounce' | 'glow' | 'float') => {
    if (partyTheme.animations === 'minimal') return '';
    
    switch (type) {
      case 'pulse':
        return partyTheme.animations === 'enhanced' ? 'party-pulse' : 'animate-pulse';
      case 'bounce':
        return partyTheme.animations === 'enhanced' ? 'party-bounce' : 'animate-bounce';
      case 'glow':
        return partyTheme.animations === 'enhanced' ? 'party-glow' : '';
      case 'float':
        return partyTheme.animations === 'enhanced' ? 'floating' : '';
      default:
        return '';
    }
  };

  const shouldAnimate = partyTheme.animations !== 'minimal';

  return {
    animationClasses,
    getAnimationClass,
    shouldAnimate,
    animationLevel: partyTheme.animations,
  };
}