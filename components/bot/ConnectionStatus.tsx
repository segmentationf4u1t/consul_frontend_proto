'use client';

import { memo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type ConnectionStatus = 'connected' | 'reconnecting' | 'stalled' | 'error';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  lastRefresh: Date;
  animationsEnabled: boolean;
  onAnimationsToggle: (enabled: boolean) => void;
  showPredictions: boolean;
  onShowPredictionsToggle: (enabled: boolean) => void;
  showDebugInfo: boolean;
  onShowDebugInfoToggle: (enabled: boolean) => void;
  // ... add: historical chart time range
  timeRange?: '1h' | '6h' | '24h' | 'all';
  onTimeRangeChange?: (range: '1h' | '6h' | '24h' | 'all') => void;
}

const statusDetails = {
  connected: {
    color: 'bg-green-500',
    animation: 'animate-pulse-green',
    text: (lastRefresh: Date) => `Ostatnia aktualizacja ${lastRefresh.toLocaleTimeString()}`,
  },
  reconnecting: {
    color: 'bg-orange-400',
    animation: 'animate-pulse-orange',
    text: () => 'Ponowne łączenie...',
  },
  stalled: {
    color: 'bg-red-500',
    animation: 'animate-pulse-red-dot',
    text: () => 'Błąd: Zatrzymano transmisję danych',
  },
  error: {
    color: 'bg-red-500',
    animation: '',
    text: () => 'Błąd połączenia',
  },
};

export const ConnectionStatusIndicator = memo(({
  status, lastRefresh, animationsEnabled, onAnimationsToggle,
  showPredictions, onShowPredictionsToggle,
  showDebugInfo, onShowDebugInfoToggle,
  timeRange, onTimeRangeChange
}: ConnectionStatusIndicatorProps) => {
  const details = statusDetails[status];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-4 rounded-full bg-background/50 backdrop-blur-sm border px-3 py-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${details.color} ${details.animation}`} />
          {details.text(lastRefresh)}
        </div>
        {/* Re-enable predictions toggle */}
        <div className="flex items-center space-x-2">
          <Switch id="predictions-toggle-footer" checked={showPredictions} onCheckedChange={onShowPredictionsToggle} />
          <Label htmlFor="predictions-toggle-footer">Prognozy</Label>
        </div>
        <div className="hidden md:flex items-center space-x-1">
          {onTimeRangeChange && (['1h','6h','24h','all'] as const).map(r => (
            <button
              key={r}
              onClick={() => onTimeRangeChange(r)}
              className={`px-2 py-0.5 rounded text-xs border ${
                timeRange === r ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
              aria-pressed={timeRange === r}
              title={`Zakres: ${r}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="debug-toggle-footer" checked={showDebugInfo} onCheckedChange={onShowDebugInfoToggle} />
          <Label htmlFor="debug-toggle-footer">Debug</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="animations-toggle-footer" checked={animationsEnabled} onCheckedChange={onAnimationsToggle} />
          <Label htmlFor="animations-toggle-footer">Animacje</Label>
        </div>
      </div>
    </div>
  );
});

ConnectionStatusIndicator.displayName = 'ConnectionStatusIndicator';
