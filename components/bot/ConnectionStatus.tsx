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
import { RotateCw } from 'lucide-react';
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

  // Add a local flag to delay slot collapse until chip finishes exiting
  const [slotOpen, setSlotOpen] = useState(false);

  // When msg appears/disappears, handle slot timing
  useEffect(() => {
    if (msg) {
      setSlotOpen(true); // open immediately when message shows
    } else {
      // delay collapse to allow chip exit to complete smoothly
      const t = setTimeout(() => setSlotOpen(false), 260); // should match chip exit duration
      return () => clearTimeout(t);
    }
  }, [msg]);

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
                    <RotateCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
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

        {/* Animated slot to avoid snap width changes */}
        <div className="hidden md:inline-flex relative items-center" aria-live="polite" role="status">
          {/* Width reservation: opens/closes based on slotOpen, not msg */}
          <AnimatePresence initial={false}>
            {slotOpen ? (
              <motion.div
                key="reserve-open"
                initial={{ width: 0 }}
                animate={{ width: 200 }} // fixed max reservation space
                exit={{ width: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="h-0"
                style={{ willChange: 'width' }}
              />
            ) : (
              <motion.div
                key="reserve-closed"
                initial={false}
                animate={{ width: 0 }}
                transition={{ duration: 0.2, ease: 'easeIn' }}
                className="h-0"
              />
            )}
          </AnimatePresence>

          {/* Absolutely positioned chip inside the reservation */}
          <div className="absolute inset-y-0 right-0 flex items-center">
            <AnimatePresence mode="wait" initial={false}>
              {msg && (
                <motion.div
                  key={`pulse-chip-${msg.text}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 26,
                    mass: 0.6,
                    // soften exit specifically
                    opacity: { duration: 0.24, ease: 'easeInOut' },
                    y: { duration: 0.24, ease: 'easeOut' },
                    scale: { duration: 0.24, ease: 'easeOut' }
                  }}
                  className="relative flex items-center gap-2 rounded-full px-3 py-1 text-xs
                             bg-background/70 backdrop-blur-md shadow-sm"
                >
                  {/* halo */}
                  <span
                    className={`pointer-events-none absolute inset-0 -z-10 rounded-full blur-md ${
                      msg.type === 'success'
                        ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-400/10 to-emerald-500/10'
                        : 'bg-gradient-to-r from-rose-500/10 via-rose-400/10 to-rose-500/10'
                    }`}
                  />
                  {/* dot */}
                  <span className={`${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} h-2 w-2 rounded-full shadow-sm`} />
                  {/* text */}
                  <span className={msg.type === 'success' ? 'text-emerald-700 dark:text-emerald-200' : 'text-rose-700 dark:text-rose-200'}>
                    {msg.text}
                  </span>
                  {/* underline sweep */}
                  <span className="pointer-events-none absolute left-2 right-2 -bottom-1 h-px overflow-hidden">
                    <motion.span
                      key="sweep"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.7, ease: [0.22, 0.8, 0.2, 1] }}
                      className={`${msg.type === 'success' ? 'bg-emerald-500/70' : 'bg-rose-500/70'} block h-px w-1/2 rounded-full`}
                    />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

ConnectionStatusIndicator.displayName = 'ConnectionStatusIndicator';
