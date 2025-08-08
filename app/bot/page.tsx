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
import { TotalCallsChart } from '@/components/bot/TotalCallsChart';
import HistoricalSummary from '@/components/bot/HistoricalSummary';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import type { CampaignHistoricalSummary as Summary } from '@/types/historical';
import { SlaKpiPanel } from '@/components/bot/SlaKpiPanel';
import { CampaignVarianceMini } from '@/components/bot/CampaignVarianceMini';

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

  // Drilldown state
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Client-side buffer of recent totals per campaign for sparkline
  const [recentBuffer, setRecentBuffer] = useState<Record<string, Array<{ ts: number; total: number }>>>({});
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const weekdayNames = ['Nd','Pn','Wt','Śr','Cz','Pt','So'];
  function SparklineInline({ values }: { values: number[] }) {
    if (!values || values.length === 0) return null;
    const width = 160;
    const height = 36;
    const padding = 4;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = (width - padding * 2) / Math.max(1, values.length - 1);
    const points = values
      .map((v, i) => {
        const x = padding + i * step;
        const y = height - padding - ((v - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
    return (
      <svg width={width} height={height} aria-hidden className="text-muted-foreground/60">
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
      </svg>
    );
  }

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
        // Update recent buffer totals per campaign
        const ts = Date.now();
        const nextBuf: Record<string, Array<{ ts: number; total: number }>> = { ...recentBuffer };
        for (const c of data.energa.campaigns ?? []) {
          const arr = nextBuf[c.kampanie] ? [...nextBuf[c.kampanie]] : [];
          arr.push({ ts, total: c.polaczenia ?? 0 });
          // Keep last 60 samples (~15 min if 15s SSE)
          while (arr.length > 60) arr.shift();
          nextBuf[c.kampanie] = arr;
        }
        setRecentBuffer(nextBuf);
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
            <span className="text-xs text-muted-foreground">— Pulpit</span>
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
            <SlaKpiPanel data={energaData} />
            <CampaignsTable
              data={energaData}
              sorting={sorting}
              setSorting={setSorting}
              isInitialLoading={isInitialLoading}
              error={error}
              predictions={predictions}
              predictionsLoading={predictionsLoading}
              showPredictions={showPredictions}
              onRowClick={(name) => { setSelectedCampaign(name); setSelectedSummary(null); setIsDrawerOpen(true); }}
            />

            {showPredictions && (
              <div className="flex gap-4">
                <div className="w-80">
                  <ProphetIndicator />
                </div>
              </div>
            )}
          </section>

          <section className="mt-6">
            {/* 2-column responsive layout: 1 column on small screens, 2 columns from md up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="min-w-0">
                <HistoricalChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />
              </div>
              <div className="min-w-0">
                <TotalCallsChart timeRange={timeRange} />
              </div>
            </div>
          </section>
          

          {/* Drilldown Drawer */}
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{selectedCampaign ?? ''}</DrawerTitle>
                <DrawerDescription>Szczegóły kampanii</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                {selectedCampaign && (
                  <>
                    {/* Recent sparkline from client buffer */}
                    <div className="rounded-md border p-3">
                      <div className="text-[11px] text-muted-foreground mb-1">Ostatnie aktualizacje</div>
                      <SparklineInline values={(recentBuffer[selectedCampaign] ?? []).map(v => v.total)} />
                    </div>
                    {/* Forecast variance mini chart */}
                    <div className="rounded-md border p-3">
                      <CampaignVarianceMini campaign={selectedCampaign} />
                    </div>
                    {/* Best weekday and last 7 days */}
                    {selectedSummary && (
                      <div className="rounded-md border p-3">
                        <div className="grid grid-cols-1 gap-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Najlepszy dzień tygodnia</span>
                            {(() => {
                              const arr = (selectedSummary.weekdayTotals?.length ? selectedSummary.weekdayTotals : selectedSummary.weekdayAverages?.map(a => ({ weekday: a.weekday, total: a.avgTotal })) ?? []);
                              if (!arr.length) return <span className="font-mono">—</span>;
                              const best = arr.reduce((m, x) => x.total > m.total ? x : m, arr[0]);
                              return <span className="font-mono">{weekdayNames[best.weekday]} • {Math.round(best.total)}</span>;
                            })()}
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-1">Ostatnie 7 dni</div>
                            <div className="flex flex-wrap gap-1">
                              {(selectedSummary.recentDailyTotals ?? []).map((d) => (
                                <div key={d.dateLocal} className="text-[11px] px-1.5 py-0.5 rounded bg-muted/50">
                                  <span className="font-mono">{d.dateLocal}</span>
                                  <span className="mx-1">•</span>
                                  <span className="font-mono">{d.total}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Historical summary for selected campaign */}
                    <HistoricalSummary campaign={selectedCampaign} onSummaryLoaded={setSelectedSummary} />
                  </>
                )}
              </div>
              <div className="p-4 pt-0">
                <DrawerClose asChild>
                  <Button variant="secondary" className="w-full">Zamknij</Button>
                </DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>

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
