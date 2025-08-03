'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, subHours, isAfter } from 'date-fns';
import { API_BASE_URL } from '@/lib/api-config';
import { formatInTimeZone } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

const timeZone = 'Europe/Warsaw';

interface HistoricalDataPoint {
  timestamp: string;
  kolejka: number;
  zalogowani: number;
  gotowi: number;
  przerwa: number;
  rozmawiaja: number;
}

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

export function HistoricalChart({ className }: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('6h');

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/historical`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const rawData = await response.json();
      const allDataPoints: HistoricalDataPoint[] = [];
      
      // Parse CSV data from each file
      Object.entries(rawData).forEach(([filename, csvContent]) => {
        if (typeof csvContent === 'string') {
          const lines = csvContent.trim().split('\n');
          const headers = lines[0].split(',');
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
              const dataPoint: HistoricalDataPoint = {
                timestamp: values[0],
                kolejka: parseInt(values[1]) || 0,
                zalogowani: parseInt(values[2]) || 0,
                gotowi: parseInt(values[3]) || 0,
                przerwa: parseInt(values[4]) || 0,
                rozmawiaja: parseInt(values[5]) || 0,
              };
              allDataPoints.push(dataPoint);
            }
          }
        }
      });
      
      // Sort by timestamp
      allDataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setData(allDataPoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchHistoricalData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (timeRange === 'all') return data;
    
    const now = new Date();
    const cutoff = timeRange === '1h' ? subHours(now, 1) :
                   timeRange === '6h' ? subHours(now, 6) :
                   subHours(now, 24);
    
    return data.filter(point => isAfter(new Date(point.timestamp), cutoff));
  }, [data, timeRange]);

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
              
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => formatInTimeZone(new Date(value), timeZone, 'HH:mm', { locale: pl })}
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis className="text-xs" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                type="monotoneX"
                dataKey="kolejka"
                stackId="1"
                stroke={metricColors.kolejka}
                fill={`url(#colorkolejka)`}
                name="Kolejka"
                strokeWidth={2}
              />
              <Area
                type="monotoneX"
                dataKey="zalogowani"
                stackId="1"
                stroke={metricColors.zalogowani}
                fill={`url(#colorzalogowani)`}
                name="Zalogowani"
                strokeWidth={2}
              />
              <Area
                type="monotoneX"
                dataKey="gotowi"
                stackId="1"
                stroke={metricColors.gotowi}
                fill={`url(#colorgotowi)`}
                name="Gotowi"
                strokeWidth={2}
              />
              <Area
                type="monotoneX"
                dataKey="przerwa"
                stackId="1"
                stroke={metricColors.przerwa}
                fill={`url(#colorprzerwa)`}
                name="Przerwa"
                strokeWidth={2}
              />
              <Area
                type="monotoneX"
                dataKey="rozmawiaja"
                stackId="1"
                stroke={metricColors.rozmawiaja}
                fill={`url(#colorrozmawiaja)`}
                name="Rozmawiają"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}