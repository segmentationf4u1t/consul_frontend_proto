'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WallboardData } from '@/types/wallboard';
import { SortingState } from '@tanstack/react-table';
import { Header } from '@/components/bot/Header';
import { MetricCards } from '@/components/bot/MetricCards';
import { CampaignsTable } from '@/components/bot/CampaignsTable';
import { ConnectionStatusIndicator } from '@/components/bot/ConnectionStatus';
import { SystemInfoCard } from '@/components/bot/SystemInfoCard';
import { ProphetIndicator } from '@/components/bot/ProphetIndicator';
import { usePredictions } from '@/hooks/use-predictions';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { API_BASE_URL } from '@/lib/api-config';
import { HistoricalChart } from '@/components/bot/HistoricalChart';
import { MetricCardsShakeStyle } from '@/components/bot/MetricCards';
import { DynamicIslandNav } from '@/components/ui/dynamic-island-nav';
import { Button } from '@/components/ui/button';
import { Bell, RotateCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { revalidateHistorical, revalidatePredictions } from '@/lib/api-revalidate';

type ConnectionStatus = 'connected' | 'reconnecting' | 'stalled' | 'error';

export default function BotPage() {
  const [tipData, setTipData] = useState<WallboardData | null>(null);
  const [energaData, setEnergaData] = useState<WallboardData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showPredictions, setShowPredictions] = useLocalStorage('showPredictions', true);
  const [showDebugInfo, setShowDebugInfo] = useLocalStorage('showDebugInfo', false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { predictions, isLoading: predictionsLoading } = usePredictions(energaData?.campaigns);
  const [timeRange, setTimeRange] = useLocalStorage<'1h' | '6h' | '24h' | 'all'>('historicalTimeRange', '6h');

  const resetStallTimer = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
    }
    stallTimeoutRef.current = setTimeout(() => {
      setConnectionStatus('stalled');
    }, 15000); // 15 seconds
  }, []);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/wallboard/events`);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      resetStallTimer();
      setError(null);
    };

    eventSource.onmessage = (event) => {
      setConnectionStatus('connected');
      resetStallTimer();
      setError(null);
      
      const data = JSON.parse(event.data);
      if (data.tip) {
        setTipData(data.tip);
      }
      if (data.energa) {
        setEnergaData(data.energa);
      }
      setLastRefresh(new Date());
      setIsInitialLoading(false);
      if (data?.control === 'refresh') {
        // Call your data refreshers here:
        // refetchPredictions?.();
        // refetchHistorical?.();
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setConnectionStatus('error');
      setIsInitialLoading(false);
      setError('Brak połączenia z serwerem. Strona odświeży się automatycznie po nawiązaniu połączenia.');

      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
    };

    return () => {
      eventSource.close();
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
    };
  }, [resetStallTimer]);

  // Optionally, bring your data hooks or reload logic here.
  // For example, if you have custom hooks:
  // const { refetch: refetchPredictions } = usePredictions('Energa')
  // const { refetch: refetchHistorical } = useHistorical(...)

  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(fn: () => Promise<any>) {
    try {
      setBusy(true);
      setMsg(null);
      await fn();
      setMsg('Revalidation queued');
    } catch (e: any) {
      setMsg(e?.message ?? 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Dynamic Island Navigation */}
      <DynamicIslandNav
        leading={
          <div className="flex items-center gap-3 pl-1">
            {/* Brand orb */}
            <div className="relative h-5 w-5 rounded-full">
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/90 via-primary/70 to-primary/40 shadow-[0_0_12px_rgba(0,0,0,0.08)]" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay" />
            </div>

            {/* Branding block: company + project name */}
            <div className="flex items-center gap-3">
              
              <div className="leading-tight">
                
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
                  Crafted by
                </div>
                <div className="text-xs font-medium text-foreground/90">
                  Cyfrowa Manufaktura
                </div>
              </div>

            </div>
          </div>
        }
        title={
          <div className="flex items-center justify-center gap-2">
            <span className="truncate">Wallboard</span>
            <span className="text-xs text-muted-foreground">— Dashboard</span>
          </div>
        }
        trailing={
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Akcje">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => revalidatePredictions('Energa')} title="Operacja może być kosztowna obliczeniowo">
                  Prognozy (Energa) — ostrożnie
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => revalidateHistorical('panels')} title="Operacja może być kosztowna obliczeniowo">
                  Historia: Panele — ostrożnie
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => revalidateHistorical('campaigns')} title="Operacja może być kosztowna obliczeniowo">
                  Historia: Kampanie — ostrożnie
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => revalidateHistorical()} title="Operacja może być kosztowna obliczeniowo">
                  Historia: Wszystko — ostrożnie
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Powiadomienia">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        }
        expandedContent={
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border p-2">
              <div className="text-[11px] text-muted-foreground">Status</div>
              <div className="mt-1 text-sm">
                {connectionStatus === 'connected' ? 'Połączono' : connectionStatus === 'reconnecting' ? 'Ponowne łączenie…' : 'Brak połączenia'}
              </div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[11px] text-muted-foreground">Zakres</div>
              <div className="mt-1 flex items-center gap-1">
                {(['1h','6h','24h','all'] as const).map(r => (
                  <button
                    key={r}
                    className={`px-2 py-0.5 rounded text-xs border ${timeRange === r ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                    onClick={() => setTimeRange(r)}
                    aria-pressed={timeRange === r}
                    title={`Zakres: ${r}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-2">
              <div className="text-[11px] text-muted-foreground">Szybkie akcje</div>
              <div className="mt-1 flex items-center gap-1">
                <Button variant="secondary" size="sm" className="h-7">Eksport CSV</Button>
                <Button variant="secondary" size="sm" className="h-7">Filtrowanie</Button>
              </div>
            </div>
          </div>
        }
        maxWidth={920}
        minWidth={560}
      />
      {/* push page content down a bit to avoid overlap */}
      <div className="h-16" />

      <MetricCardsShakeStyle />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <section className="relative">
            <Header
              connectionStatus={connectionStatus}
              error={error}
            />
            
            <MetricCards 
              data={tipData} 
              animationsEnabled={animationsEnabled}
              isInitialLoading={isInitialLoading}
              error={error}
            />
          </section>
      
          <section className="space-y-4">
            <CampaignsTable
              data={energaData}
              sorting={sorting}
              setSorting={setSorting}
              isInitialLoading={isInitialLoading}
              error={error}
              predictions={predictions}
              predictionsLoading={predictionsLoading}
              showPredictions={showPredictions}
            />

            {showPredictions && (
              <div className="flex">
                <div className="w-80">
                  <ProphetIndicator />
                </div>
              </div>
            )}
          </section>

          <section>
            <HistoricalChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </section>

          {showDebugInfo && (
            <section>
              <SystemInfoCard />
            </section>
          )}
          
          <ConnectionStatusIndicator 
              status={connectionStatus} 
              lastRefresh={lastRefresh} 
              animationsEnabled={animationsEnabled}
              onAnimationsToggle={setAnimationsEnabled}
              showPredictions={showPredictions}
              onShowPredictionsToggle={setShowPredictions}
              showDebugInfo={showDebugInfo}
              onShowDebugInfoToggle={setShowDebugInfo}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
          />

        
        </div>
      </div>
    </>
  );
}
