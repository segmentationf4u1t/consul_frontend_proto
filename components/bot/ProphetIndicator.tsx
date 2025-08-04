'use client';

import { memo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Clock, Database, TrendingUp, BarChart3, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api-config';

interface ProphetIndicatorProps {
  className?: string;
}

interface SystemInfo {
  database: {
    totalRecords: {
      campaignLogs: number;
      total: number;
    };
    oldestRecord: string | null;
    newestRecord: string | null;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toString();
};

const calculateDataPeriod = (oldest: string | null, newest: string | null): string => {
  if (!oldest || !newest) return 'Brak danych';
  
  const oldestDate = new Date(oldest);
  const newestDate = new Date(newest);
  const diffMs = newestDate.getTime() - oldestDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return '< 1 dzień';
  if (diffDays === 1) return '1 dzień';
  return `${diffDays} dni`;
};

export const ProphetIndicator = memo(({ className }: ProphetIndicatorProps) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/system/info`);
        if (response.ok) {
          const data = await response.json();
          setSystemInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemInfo();
    // Refresh every 5 minutes to keep data current
    const interval = setInterval(fetchSystemInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const campaignRecords = systemInfo?.database.totalRecords.campaignLogs ?? 0;
  const dataPeriod = calculateDataPeriod(
    systemInfo?.database.oldestRecord ?? null,
    systemInfo?.database.newestRecord ?? null
  );

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-muted-foreground">Model Prophet ML</span>
          <Badge variant="secondary" className="text-xs">
            Aktywny
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Min. rekordów</div>
              <div className="font-mono font-medium">50</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Agregacja</div>
              <div className="font-mono font-medium">5min</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Dane w DB</div>
              <div className="font-mono font-medium">
                {isLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  formatNumber(campaignRecords)
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Okres danych</div>
              <div className="font-mono font-medium">
                {isLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  dataPeriod
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <div>
              <div className="text-muted-foreground">Sezonowość</div>
              <div className="font-mono font-medium">Dzienna+Tygodniowa</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <div className="text-muted-foreground">Cache TTL</div>
              <div className="font-mono font-medium">5min</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProphetIndicator.displayName = 'ProphetIndicator';