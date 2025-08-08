'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/api-config';
import { subHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { pl } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const timeZone = 'Europe/Warsaw';
const MAX_WINDOW_HOURS = 48;

type CallsPoint = { id: number; timestamp: string; totalCalls: number };
type CallsPage = { items: CallsPoint[]; nextCursor: { ts: string; id: number } | null };

interface Point {
  ts: number;
  timestamp: string;
  totalCalls: number;
}

interface Props {
  className?: string;
  // Optional: to align x-axis window with the main chart
  timeRange?: '1h' | '6h' | '24h' | 'all';
}

export function TotalCallsChart({ className, timeRange = '6h' }: Props) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);           // first load only
  const [refreshing, setRefreshing] = useState(false);    // subsequent fetches
  const [error, setError] = useState<string | null>(null);

  const firstLoadDoneRef = useRef(false);
  const dataRef = useRef<Point[]>([]);

  const isSameData = (a: Point[], b: Point[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    if (a.length === 0) return true;
    return a[a.length - 1].ts === b[b.length - 1].ts && a[a.length - 1].totalCalls === b[b.length - 1].totalCalls;
  };

  const setDataStable = (next: Point[]) => {
    if (isSameData(dataRef.current, next)) return;
    dataRef.current = next;
    setData(next);
  };

  const hardCutoff = useMemo(() => subHours(new Date(), MAX_WINDOW_HOURS), []);
  const hardCutoffMs = hardCutoff.getTime();

  const fetchCalls = async () => {
    try {
      if (!firstLoadDoneRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const PAGE_SIZE = 1000;
      const MAX_PAGES = 200;
      const fromISO = new Date(hardCutoffMs).toISOString();

      let url = `${API_BASE_URL}/historical/calls?limit=${PAGE_SIZE}&from=${encodeURIComponent(fromISO)}`;
      let nextCursor: CallsPage['nextCursor'] | null = null;
      let acc: Point[] = [];
      let pageCount = 0;

      do {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed calls (status ${res.status})`);
        const page: CallsPage = await res.json();

        const mapped: Point[] = page.items
          .map((r) => {
            const ts = new Date(r.timestamp).getTime();
            if (!Number.isFinite(ts)) return null;
            return {
              ts,
              timestamp: r.timestamp,
              totalCalls: Number(r.totalCalls ?? 0),
            };
          })
          .filter((x): x is Point => !!x);

        acc = acc.concat(mapped);

        nextCursor = page.nextCursor;
        if (nextCursor) {
          const nextTsMs = new Date(nextCursor.ts).getTime();
          if (!Number.isFinite(nextTsMs) || nextTsMs <= hardCutoffMs) nextCursor = null;
        }

        if (nextCursor) {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            from: fromISO,
            cursorTs: nextCursor.ts,
            cursorId: String(nextCursor.id),
          });
          url = `${API_BASE_URL}/historical/calls?${params.toString()}`;
        }

        pageCount += 1;

        const sorted = [...acc].sort((a, b) => a.ts - b.ts);
        setDataStable(sorted);

        if (pageCount >= MAX_PAGES) {
          nextCursor = null;
        }
      } while (nextCursor);

      const finalSorted = [...acc].sort((a, b) => a.ts - b.ts);
      setDataStable(finalSorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      // keep existing data to avoid blink
    } finally {
      setLoading(false);
      setRefreshing(false);
      firstLoadDoneRef.current = true;
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  // X domain based on requested timeRange
  const [xDomain, setXDomain] = useState<[number, number]>(() => {
    const now = Date.now();
    let start: number;
    switch (timeRange) {
      case '1h': start = now - 1 * 3600_000; break;
      case '6h': start = now - 6 * 3600_000; break;
      case '24h': start = now - 24 * 3600_000; break;
      case 'all':
      default: start = now - MAX_WINDOW_HOURS * 3600_000; break;
    }
    return [start, now];
  });

  const setXDomainStable = (next: [number, number]) => {
    setXDomain((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
  };


  useEffect(() => {
    const now = Date.now();
    let span: number;
    switch (timeRange) {
      case '1h': span = 1 * 3600_000; break;
      case '6h': span = 6 * 3600_000; break;
      case '24h': span = 24 * 3600_000; break;
      case 'all':
      default: span = MAX_WINDOW_HOURS * 3600_000; break;
    }
    if (data.length > 0) {
      const latestTs = data[data.length - 1].ts;
      const end = Math.min(latestTs, Date.now()); // clamp to "now"
      const start = end - span;
      setXDomainStable([start, end]);
    } else {
      setXDomainStable([now - span, now]);
    }
  }, [timeRange, data]);


  // NEW: filter data to xDomain so the chart truly reflects the selected range
  const filteredData = useMemo(() => {
    const [start, end] = xDomain;
    const clipped = data.filter(d => d.ts >= start && d.ts <= end);
    return clipped.sort((a, b) => a.ts - b.ts);
  }, [data, xDomain]);

  // Render domain to clip to visible data and reduce whitespace

const renderDomain = useMemo<[number, number]>(() => {
  if (filteredData.length === 0) return xDomain;
  const leftPad = 60_000;
  const rightPad = 0;
  const earliest = filteredData[0].ts;
  const latest = filteredData[filteredData.length - 1].ts;
  const now = Date.now();
  const endRaw = Math.min(latest + rightPad, xDomain[1]);
  const end = Math.min(endRaw, now); // clamp to "now"
  const start = Math.max(earliest - leftPad, xDomain[0]);
  return end - start < 1_000 ? xDomain : [start, end];
}, [filteredData, xDomain]);


  const tickFormat = useMemo(() => {
    const [start, end] = renderDomain;
    const spanMs = end - start;
    const oneHour = 3600_000;
    if (spanMs <= 6 * oneHour) return 'HH:mm';
    if (spanMs <= 24 * oneHour) return 'HH:mm';
    return 'dd.MM HH:mm';
  }, [renderDomain]);

  // NEW: Styled tooltip matching HistoricalChart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const [start, end] = renderDomain;
      const spanMs = end - start;
      const tooltipFmt = spanMs > 24 * 3600_000 ? 'dd.MM HH:mm:ss' : 'HH:mm:ss';

      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">
            {formatInTimeZone(label as number, timeZone, tooltipFmt, { locale: pl })}
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

  if (loading && !firstLoadDoneRef.current) {
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
          <CardTitle>Połączenia (suma)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-destructive font-medium">Błąd ładowania</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchCalls}>
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
          <CardTitle>Połączenia (suma)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Brak danych
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Połączenia (suma)</CardTitle>
          <div className="flex items-center gap-2">
            {refreshing && <Badge variant="secondary" className="text-xs">Aktualizuję…</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {/* Use filteredData and renderDomain */}
            <AreaChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorTotalCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              {/* Soften grid without relying on Tailwind on SVG */}
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                dataKey="ts"
                domain={renderDomain}
                type="number"
                scale="time"
                allowDataOverflow={false}
                minTickGap={20}
                interval="preserveStartEnd"
                tickFormatter={(value) =>
                  formatInTimeZone(value as number, timeZone, tickFormat, { locale: pl })
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
                dataKey="totalCalls"
                stroke="#06b6d4"
                fill="url(#colorTotalCalls)"
                name="Połączenia (suma)"
                strokeWidth={2}
                isAnimationActive={false}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}