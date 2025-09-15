'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type PartyTheme = {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  font: string;
  animations: 'minimal' | 'standard' | 'enhanced';
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  partyTheme: PartyTheme;
  setPartyTheme: (theme: PartyTheme) => void;
  availablePartyThemes: PartyTheme[];
  customBranding: {
    logo?: string;
    title?: string;
    colors?: Partial<PartyTheme['colors']>;
  };
  setCustomBranding: (branding: ThemeContextType['customBranding']) => void;
};

const defaultPartyThemes: PartyTheme[] = [
  {
    name: 'Classic',
    colors: {
      primary: 'hsl(222.2 84% 4.9%)',
      secondary: 'hsl(210 40% 96%)',
      accent: 'hsl(210 40% 98%)',
      background: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },
    font: 'system',
    animations: 'standard',
  },
  {
    name: 'Neon Party',
    colors: {
      primary: 'hsl(280 100% 70%)',
      secondary: 'hsl(200 100% 70%)',
      accent: 'hsl(60 100% 70%)',
      background: 'hsl(240 10% 3.9%)',
      foreground: 'hsl(0 0% 98%)',
    },
    font: 'system',
    animations: 'enhanced',
  },
  {
    name: 'Ocean Breeze',
    colors: {
      primary: 'hsl(200 100% 50%)',
      secondary: 'hsl(180 100% 70%)',
      accent: 'hsl(160 100% 60%)',
      background: 'hsl(210 100% 97%)',
      foreground: 'hsl(200 100% 10%)',
    },
    font: 'system',
    animations: 'standard',
  },
  {
    name: 'Sunset Vibes',
    colors: {
      primary: 'hsl(15 100% 60%)',
      secondary: 'hsl(45 100% 70%)',
      accent: 'hsl(330 100% 70%)',
      background: 'hsl(20 100% 98%)',
      foreground: 'hsl(15 100% 10%)',
    },
    font: 'system',
    animations: 'standard',
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<'div'>) {
  const [theme, setTheme] = useState<Theme>('system');
  const [partyTheme, setPartyTheme] = useState<PartyTheme>(defaultPartyThemes[0]);
  const [customBranding, setCustomBranding] = useState<ThemeContextType['customBranding']>({});

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem('trivparty-theme') as Theme;
    const savedPartyTheme = localStorage.getItem('trivparty-party-theme');
    const savedBranding = localStorage.getItem('trivparty-custom-branding');

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedPartyTheme) {
      try {
        const parsed = JSON.parse(savedPartyTheme);
        setPartyTheme(parsed);
      } catch (error) {
        console.warn('Failed to parse saved party theme:', error);
      }
    }

    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setCustomBranding(parsed);
      } catch (error) {
        console.warn('Failed to parse saved custom branding:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Apply party theme CSS variables
    const colors = { ...partyTheme.colors, ...customBranding.colors };
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply animation preference
    root.setAttribute('data-animations', partyTheme.animations);

    // Save preferences
    localStorage.setItem('trivparty-theme', theme);
    localStorage.setItem('trivparty-party-theme', JSON.stringify(partyTheme));
    localStorage.setItem('trivparty-custom-branding', JSON.stringify(customBranding));
  }, [theme, partyTheme, customBranding]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    partyTheme,
    setPartyTheme,
    availablePartyThemes: defaultPartyThemes,
    customBranding,
    setCustomBranding,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div {...props}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};