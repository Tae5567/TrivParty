'use client';

import React from 'react';
import { Card, CardProps } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeProvider';
import { useThemeAnimations } from '@/hooks/useThemeAnimations';
import { cn } from '@/lib/utils';

interface ThemedCardProps extends CardProps {
  themeVariant?: 'primary' | 'secondary' | 'accent' | 'gradient' | 'glass';
  animate?: 'pulse' | 'bounce' | 'glow' | 'float' | 'none';
}

export function ThemedCard({
  themeVariant = 'glass',
  animate = 'none',
  className,
  children,
  ...props
}: ThemedCardProps) {
  const { partyTheme, customBranding } = useTheme();
  const { getAnimationClass, animationClasses } = useThemeAnimations();

  const getThemeClasses = () => {
    const baseClasses = [animationClasses];
    
    if (animate !== 'none') {
      baseClasses.push(getAnimationClass(animate));
    }

    switch (themeVariant) {
      case 'primary':
        baseClasses.push('theme-primary');
        break;
      case 'secondary':
        baseClasses.push('theme-secondary');
        break;
      case 'accent':
        baseClasses.push('theme-accent');
        break;
      case 'gradient':
        baseClasses.push('theme-gradient');
        break;
      case 'glass':
        baseClasses.push('glass-card');
        break;
    }

    return baseClasses.join(' ');
  };

  const customStyle = React.useMemo(() => {
    if (themeVariant === 'gradient') {
      const colors = { ...partyTheme.colors, ...customBranding.colors };
      return {
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
        color: colors.foreground,
      };
    }
    return {};
  }, [partyTheme.colors, customBranding.colors, themeVariant]);

  return (
    <Card
      className={cn(getThemeClasses(), className)}
      style={customStyle}
      {...props}
    >
      {children}
    </Card>
  );
}