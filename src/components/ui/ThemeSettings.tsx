'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Moon, Sun, Monitor, Palette, Settings, Upload } from 'lucide-react';

export function ThemeSettings() {
  const {
    theme,
    setTheme,
    partyTheme,
    setPartyTheme,
    availablePartyThemes,
    customBranding,
    setCustomBranding,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: partyTheme.colors.primary,
    secondary: partyTheme.colors.secondary,
    accent: partyTheme.colors.accent,
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handlePartyThemeChange = (themeName: string) => {
    const selectedTheme = availablePartyThemes.find(t => t.name === themeName);
    if (selectedTheme) {
      setPartyTheme(selectedTheme);
      setCustomColors({
        primary: selectedTheme.colors.primary,
        secondary: selectedTheme.colors.secondary,
        accent: selectedTheme.colors.accent,
      });
    }
  };

  const handleAnimationChange = (animations: 'minimal' | 'standard' | 'enhanced') => {
    setPartyTheme({
      ...partyTheme,
      animations,
    });
  };

  const handleCustomColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => ({ ...prev, [colorKey]: value }));
    setCustomBranding({
      ...customBranding,
      colors: {
        ...customBranding.colors,
        [colorKey]: value,
      },
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCustomBranding({
          ...customBranding,
          logo: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaults = () => {
    setTheme('system');
    setPartyTheme(availablePartyThemes[0]);
    setCustomBranding({});
    setCustomColors({
      primary: availablePartyThemes[0].colors.primary,
      secondary: availablePartyThemes[0].colors.secondary,
      accent: availablePartyThemes[0].colors.accent,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white text-black border-gray-200 [&_*]:text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Palette className="h-5 w-5 text-black" />
            Theme & Customization
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-black">
          {/* Dark Mode Toggle */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="font-semibold mb-3 text-black">Display Mode</h3>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('system')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </Card>

          {/* Party Themes */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="font-semibold mb-3 text-black">Party Themes</h3>
            <div className="grid grid-cols-2 gap-2">
              {availablePartyThemes.map((themeOption) => (
                <Button
                  key={themeOption.name}
                  variant={partyTheme.name === themeOption.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePartyThemeChange(themeOption.name)}
                  className="justify-start"
                >
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: themeOption.colors.primary }}
                  />
                  {themeOption.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* Animation Settings */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="font-semibold mb-3 text-black">Animations</h3>
            <div className="flex gap-2">
              <Button
                variant={partyTheme.animations === 'minimal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnimationChange('minimal')}
              >
                Minimal
              </Button>
              <Button
                variant={partyTheme.animations === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnimationChange('standard')}
              >
                Standard
              </Button>
              <Button
                variant={partyTheme.animations === 'enhanced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAnimationChange('enhanced')}
              >
                Enhanced
              </Button>
            </div>
          </Card>

          {/* Custom Branding */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="font-semibold mb-3 text-black">Custom Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-black">Quiz Title</label>
                <Input
                  placeholder="Custom quiz title"
                  value={customBranding.title || ''}
                  onChange={(e) => setCustomBranding({
                    ...customBranding,
                    title: e.target.value,
                  })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-black">Logo</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  {customBranding.logo && (
                    <img
                      src={customBranding.logo}
                      alt="Custom logo"
                      className="h-8 w-8 object-contain rounded"
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Custom Colors */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <h3 className="font-semibold mb-3 text-black">Custom Colors</h3>
            <div className="space-y-3">
              {Object.entries(customColors).map(([colorKey, colorValue]) => (
                <div key={colorKey} className="flex items-center gap-3">
                  <label className="text-sm font-medium capitalize w-20 text-black">
                    {colorKey}
                  </label>
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => handleCustomColorChange(colorKey, e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={colorValue}
                    onChange={(e) => handleCustomColorChange(colorKey, e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}