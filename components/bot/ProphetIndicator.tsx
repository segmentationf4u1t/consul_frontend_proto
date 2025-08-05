'use client';

import { memo, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Database, Timer } from 'lucide-react';
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
  if (!oldest || !newest) return '?';
  
  const oldestDate = new Date(oldest);
  const newestDate = new Date(newest);
  const diffMs = newestDate.getTime() - oldestDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return '<1d';
  return `${diffDays}d`;
};

export const ProphetIndicator = memo(({ className }: ProphetIndicatorProps) => {
  // TEMPORARILY DISABLED - Predictions functionality disabled
  return null;
  
  /* TEMPORARILY DISABLED - All ProphetIndicator functionality
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
    const interval = setInterval(fetchSystemInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const campaignRecords = systemInfo?.database.totalRecords.campaignLogs ?? 0;
  const dataPeriod = calculateDataPeriod(
    systemInfo?.database.oldestRecord ?? null,
    systemInfo?.database.newestRecord ?? null
  );

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <Badge variant="outline" className="gap-1 text-xs">
        <Brain className="h-3 w-3 text-blue-500" />
        Prophet ML
      </Badge>
      
      <div className="flex items-center gap-1">
        <Database className="h-3 w-3" />
        <span className="font-mono">
          {isLoading ? '...' : formatNumber(campaignRecords)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Timer className="h-3 w-3" />
        <span className="font-mono">
          {isLoading ? '...' : dataPeriod}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="font-mono">5min</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono">50+</span>
      </div>
    </div>
  );
  */
});

ProphetIndicator.displayName = 'ProphetIndicator';