'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Volume2, VolumeX, TestTube } from 'lucide-react'
import { useSoundEffects, useGameSounds } from '@/hooks/useSoundEffects'

interface SoundSettingsProps {
  className?: string
}

export function SoundSettings({ className = '' }: SoundSettingsProps) {
  const { config, toggleEnabled, setVolume, isSupported } = useSoundEffects()
  const { 
    playCorrectAnswer, 
    playIncorrectAnswer, 
    playButtonClick,
    playCelebration,
    playVictoryFanfare 
  } = useGameSounds()

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <VolumeX className="w-8 h-8 mx-auto mb-2" />
            <p>Sound effects are not supported in this browser</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Sound Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Sounds */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sound Effects</p>
            <p className="text-sm text-muted-foreground">
              Enable audio feedback for interactions
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        {/* Volume Control */}
        {config.enabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Volume</p>
              <span className="text-sm text-muted-foreground">
                {Math.round(config.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[config.volume]}
              onValueChange={([value]) => setVolume(value)}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Test Sounds */}
        {config.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              <p className="font-medium">Test Sounds</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={playCorrectAnswer}
                className="text-xs"
              >
                Correct
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playIncorrectAnswer}
                className="text-xs"
              >
                Incorrect
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playButtonClick}
                className="text-xs"
              >
                Click
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playCelebration}
                className="text-xs"
              >
                Celebration
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={playVictoryFanfare}
              className="w-full text-xs"
            >
              Victory Fanfare
            </Button>
          </div>
        )}

        {/* Sound Description */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Correct/incorrect answer feedback</p>
          <p>• Button interaction sounds</p>
          <p>• Celebration effects for achievements</p>
          <p>• Victory fanfare for game completion</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact sound toggle for in-game use
export function SoundToggle() {
  const { config, toggleEnabled, isSupported } = useSoundEffects()

  if (!isSupported) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleEnabled}
      className="gap-2"
    >
      {config.enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {config.enabled ? 'Sound On' : 'Sound Off'}
      </span>
    </Button>
  )
}