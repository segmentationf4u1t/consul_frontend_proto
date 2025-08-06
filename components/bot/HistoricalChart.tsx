'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, subHours } from 'date-fns';
import { API_BASE_URL } from '@/lib/api-config';
import { formatInTimeZone } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

const timeZone = 'Europe/Warsaw';

interface HistoricalDataPoint {
  timestamp: string;
  ts: number; // numeric ms since epoch for charting
  kolejka: number;
  zalogowani: number;
  gotowi: number;
  przerwa: number;
  rozmawiaja: number;
}

type PanelsPage = {
  items: Array<{
    id: number;
    timestamp: string;
    kolejka: number;
    zalogowani: number;
    gotowi: number;
    przerwa: number;
    rozmawiaja: number;
  }>;
  nextCursor: { ts: string; id: number } | null;
};

interface HistoricalChartProps {
  className?: string;
}

type TimeRange = '1h' | '6h' | '24h' | 'all';

const timeRangeLabels = {
  '1h': 'Ostatnia godzina',
  '6h': 'Ostatnie 6 godzin',
  '24h': 'Ostatnie 24 godziny',
  'all': 'Wszystkie dane'
};

const metricColors = {
  kolejka: '#ef4444',      // red
  zalogowani: '#3b82f6',   // blue
  gotowi: '#22c55e',       // green
  przerwa: '#f59e0b',      // amber
  rozmawiaja: '#8b5cf6'    // purple
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {formatInTimeZone(new Date(label), timeZone, 'HH:mm:ss', { locale: pl })}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Utility to map a page of items to chart points
const mapItems = (items: PanelsPage['items']): HistoricalDataPoint[] =>
  items
    .map((row) => {
      const ts = new Date(row.timestamp).getTime();
      return {
        timestamp: row.timestamp,
        ts,
        kolejka: Number(row.kolejka ?? 0),
        zalogowani: Number(row.zalogowani ?? 0),
        gotowi: Number(row.gotowi ?? 0),
        przerwa: Number(row.przerwa ?? 0),
        rozmawiaja: Number(row.rozmawiaja ?? 0),
      };
    })
    .filter((d) => !!d.timestamp && Number.isFinite(d.ts));

// Force 48h cap
const MAX_WINDOW_HOURS = 48;

export function HistoricalChart({ className }: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('6h');

  // Compute a fixed 48h cutoff; timeRange still controls UI buttons,
  // but server fetch will never go past 48h.
  const hardCutoff = useMemo(() => subHours(new Date(), MAX_WINDOW_HOURS), []);
  const hardCutoffMs = hardCutoff.getTime();

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const PAGE_SIZE = 1000;
      const MAX_PAGES = 200; // safety cap

      // Start from now back to 48h ago
      const fromISO = new Date(hardCutoffMs).toISOString();

      let url = `${API_BASE_URL}/historical/panels?limit=${PAGE_SIZE}&from=${encodeURIComponent(fromISO)}`;
      let nextCursor: PanelsPage['nextCursor'] | null = null;
      let accumulated: HistoricalDataPoint[] = [];
      let pageCount = 0;

      do {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch historical data (status ${res.status})`);
        const page: PanelsPage = await res.json();

        const mapped = mapItems(page.items);
        accumulated = accumulated.concat(mapped);

        nextCursor = page.nextCursor;

        // If next page is older than 48h window, we can stop after this page
        if (nextCursor) {
          const nextTsMs = new Date(nextCursor.ts).getTime();
          if (!Number.isFinite(nextTsMs) || nextTsMs <= hardCutoffMs) {
            nextCursor = null;
          }
        }

        // Prepare next URL if continuing
        if (nextCursor) {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            from: fromISO, // keep the 48h lower bound
            cursorTs: nextCursor.ts,
            cursorId: String(nextCursor.id),
          });
          url = `${API_BASE_URL}/historical/panels?${params.toString()}`;
        }

        pageCount += 1;

        // Progressive render per page
        const sorted = [...accumulated].sort((a, b) => a.ts - b.ts);
        setData(sorted);

        if (pageCount >= MAX_PAGES) {
          nextCursor = null;
        }
      } while (nextCursor);

      const finalSorted = [...accumulated].sort((a, b) => a.ts - b.ts);
      setData(finalSorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
    const interval = setInterval(fetchHistoricalData, 30000);
    return () => clearInterval(interval);
  }, [/* optionally include a key if time range changes UI but fetch stays 48h */]);

  // Filter: always clip to 48h (secondary guard)
  const [xDomain, setXDomain] = useState<[number, number]>(() => {
    const now = Date.now();
    return [now - MAX_WINDOW_HOURS * 3600_000, now];
  });

  // Recompute domain on timeRange change
  useEffect(() => {
    const now = Date.now();
    let start: number;
    switch (timeRange) {
      case '1h': start = now - 1 * 3600_000; break;
      case '6h': start = now - 6 * 3600_000; break;
      case '24h': start = now - 24 * 3600_000; break;
      case 'all':
      default: start = now - MAX_WINDOW_HOURS * 3600_000; break;
    }
    const end = now;
    setXDomain([start, end]);
  }, [timeRange]);

  // Clamp filtered data strictly within domain to avoid stray points skewing scale
  const filteredData = useMemo(() => {
    const [start, end] = xDomain;
    const clipped = data.filter(d => d.ts >= start && d.ts <= end);
    // Ensure ascending order
    return clipped.sort((a, b) => a.ts - b.ts);
  }, [data, xDomain]);

  // Compute explicit domain per mode
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const latest = filteredData[filteredData.length - 1];
    const earliest = filteredData[0];
    
    return {
      latest,
      earliest,
      totalPoints: filteredData.length,
      timeSpan: new Date(latest.timestamp).getTime() - new Date(earliest.timestamp).getTime()
    };
  }, [filteredData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wykres historyczny
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-destructive font-medium">Błąd ładowania danych</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchHistoricalData}>
              Spróbuj ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wykres historyczny
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="font-medium">Brak danych historycznych</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dane pojawią się po pierwszym zapisie z systemu
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Wykres historyczny
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {stats.totalPoints} punktów
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistoricalData}
              className="h-8"
            >
              Odśwież
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="h-8 text-xs"
            >
              {timeRangeLabels[range]}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                {Object.entries(metricColors).map(([key, color]) => (
                  <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />  // soften grid
              <XAxis
                dataKey="ts"
                domain={xDomain}
                type="number"
                scale="time"
                allowDataOverflow
                tickFormatter={(value) =>
                  formatInTimeZone(new Date(value), timeZone, 'HH:mm', { locale: pl })
                }
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                type="monotone"
                dataKey="kolejka"
                stroke={metricColors.kolejka}
                fill={`url(#colorkolejka)`}
                name="Kolejka"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="zalogowani"
                stroke={metricColors.zalogowani}
                fill={`url(#colorzalogowani)`}
                name="Zalogowani"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="gotowi"
                stroke={metricColors.gotowi}
                fill={`url(#colorgotowi)`}
                name="Gotowi"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="przerwa"
                stroke={metricColors.przerwa}
                fill={`url(#colorprzerwa)`}
                name="Przerwa"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="rozmawiaja"
                stroke={metricColors.rozmawiaja}
                fill={`url(#colorrozmawiaja)`}
                name="Rozmawiają"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}