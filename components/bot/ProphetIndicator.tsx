'use client';

import { memo, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, SlidersHorizontal } from 'lucide-react';
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
  const [modelType, setModelType] = useState<string | null>(null);
  const [modelConfig, setModelConfig] = useState<string[] | null>(null);
  const [modelUsed, setModelUsed] = useState<'prophet' | 'heuristic' | 'heuristic_cold_start' | 'none' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const fetchPreview = async () => {
      try {
        // Use a cheap endpoint: small campaign prediction to surface metadata
        const res = await fetch(`${API_BASE_URL}/predictions/campaigns/Energa`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;
        setModelType(typeof data.modelType === 'string' ? data.modelType : null);
        setModelConfig(Array.isArray(data.modelConfig) ? data.modelConfig : null);
        setModelUsed(typeof data.modelUsed === 'string' ? data.modelUsed : null);
      } catch {
        if (!cancelled) {
          setModelType(null);
          setModelConfig(null);
          setModelUsed(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPreview();
    const id = setInterval(fetchPreview, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <Badge variant="outline" className="gap-1 text-xs">
        <Brain className="h-3 w-3 text-blue-500" />
        {modelUsed === 'prophet' && modelType ? (
          <span className="max-w-[160px] truncate" title={modelType}>{modelType}</span>
        ) : (
          'Prophet'
        )}
      </Badge>
      {loading ? (
        <span className="text-muted-foreground/70">…</span>
      ) : modelUsed === 'prophet' && modelType ? (
        <>
          {modelConfig && modelConfig.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <SlidersHorizontal className="h-3 w-3 opacity-70" />
              <span className="truncate max-w-[200px]" title={modelConfig.join(', ')}>
                {modelConfig.slice(0, 3).join(' • ')}
                {modelConfig.length > 3 ? ' …' : ''}
              </span>
            </div>
          )}
        </>
      ) : (
        <span className="text-muted-foreground/70">heuristic</span>
      )}
    </div>
  );
});

ProphetIndicator.displayName = 'ProphetIndicator';