'use client';

import { memo, useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { revalidateHistorical, revalidatePredictions } from '@/lib/api-revalidate';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCw, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [busy, setBusy] = useState<'pred' | 'hist' | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [progress, setProgress] = useState(0);

  // Auto-dismiss with single sweep underline timing
  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(timer);
  }, [msg]);

  // No layout reservation: message chip is overlaid absolutely so it doesn't push siblings

  async function handleRevalidatePredictions() {
    try {
      setBusy('pred');
      setMsg(null);
      await revalidatePredictions('Energa');
      setMsg({ text: 'Odświeżono prognozy', type: 'success' });
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Błąd odświeżania', type: 'error' });
    } finally {
      setBusy(null);
    }
  }

  async function handleRevalidateHistorical(scope?: 'panels' | 'campaigns') {
    try {
      setBusy('hist');
      setMsg(null);
      await revalidateHistorical(scope);
      setMsg({ text: 'Odświeżono historię', type: 'success' });
    } catch (e: any) {
      setMsg({ text: e?.message ?? 'Błąd odświeżania', type: 'error' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-full bg-background/60 backdrop-blur-sm border px-3 py-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${details.color} ${details.animation}`} />
          {details.text(lastRefresh)}
        </div>

        {/* Predictions toggle */}
        <div className="flex items-center space-x-2">
          <Switch id="predictions-toggle-footer" checked={showPredictions} onCheckedChange={onShowPredictionsToggle} />
          <Label htmlFor="predictions-toggle-footer">Prognozy</Label>
        </div>

        {/* Debug + Animations */}
        <div className="flex items-center space-x-2">
          <Switch id="debug-toggle-footer" checked={showDebugInfo} onCheckedChange={onShowDebugInfoToggle} />
          <Label htmlFor="debug-toggle-footer">Debug</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="animations-toggle-footer" checked={animationsEnabled} onCheckedChange={onAnimationsToggle} />
          <Label htmlFor="animations-toggle-footer">Animacje</Label>
        </div>

        {/* Compact in-style revalidate control */}
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={busy !== null}
                    aria-label="Revalidate data"
                  >
                    <RotateCw className={`h-4 w-4 origin-center ${busy ? 'motion-safe:animate-spin' : ''}`} />
                    <AnimatePresence initial={false}>
                      {msg && (
                        <motion.div
                          key={`mini-chip-${msg.text}`}
                          className="pointer-events-none absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 2 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          style={{ width: 16, height: 16 }}
                          aria-hidden
                        >
                          <div className={`${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full shadow-sm`} style={{ width: 16, height: 16 }}>
                            <div className="flex items-center justify-center w-full h-full text-[10px] leading-none text-white">
                              {msg.type === 'success' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Odśwież dane</p>
                  <p className="text-xs text-muted-foreground">
                    Używaj ostrożnie — operacja może być kosztowna obliczeniowo
                    i chwilowo obciążyć system.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleRevalidatePredictions} title="Operacja może być kosztowna obliczeniowo">
                Prognozy (Energa) — ostrożnie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRevalidateHistorical('panels')} title="Operacja może być kosztowna obliczeniowo">
                Historia: Panele — ostrożnie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRevalidateHistorical('campaigns')} title="Operacja może być kosztowna obliczeniowo">
                Historia: Kampanie — ostrożnie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRevalidateHistorical()} title="Operacja może być kosztowna obliczeniowo">
                Historia: Wszystko — ostrożnie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        {/* Time range quick select (md+) moved to the right end */}
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

        {/* Feedback handled inline on the refresh button via a tiny corner badge; no extra layout */}
      </div>
    </div>
  );
});

ConnectionStatusIndicator.displayName = 'ConnectionStatusIndicator';
