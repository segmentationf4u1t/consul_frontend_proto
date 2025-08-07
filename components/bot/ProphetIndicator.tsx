'use client';

import { memo, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api-config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
        const candidates = [
          'TIP_Ogolna_PL',
          'TIP_Ogolna_EN',
          'TIP_Onkologia_PL',
          'TIP_Ogolna_RU',
          'TIP_Ogolna_UA',
          'Polenergia 991',
          'Energa'
        ];

        let found: any = null;
        for (const name of candidates) {
          const res = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(name)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && data.modelUsed === 'prophet') {
            found = data;
            break;
          }
          // Keep last good response as fallback (even if heuristic)
          if (!found) found = data;
        }

        if (cancelled) return;
        if (found) {
          setModelType(typeof found.modelType === 'string' ? found.modelType : null);
          setModelConfig(Array.isArray(found.modelConfig) ? found.modelConfig : null);
          setModelUsed(typeof found.modelUsed === 'string' ? found.modelUsed : null);
        } else {
          setModelType(null);
          setModelConfig(null);
          setModelUsed(null);
        }
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

  const renderInlineSummary = () => {
    if (loading) return '…';
    if (!(modelUsed === 'prophet')) return null;
    const cfg = modelConfig ?? [];
    const shortMap: Record<string, string> = {
      '5min_increments': '5m',
      'PL_holidays': 'PL',
      'business_hours_regressor': 'BH',
      'multiplicative_seasonality': 'mult',
      'interval_0.8': 'iw=0.8',
      'changepoint_prior_0.01': 'cp=0.01',
      'seasonality_prior_3.0': 'sp=3.0',
    };
    const short = cfg.map(c => shortMap[c] ?? c).slice(0, 3).join(' • ');
    if (short) return short;
    if (modelType) return modelType;
    return null;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center text-xs text-muted-foreground", className)}>
            <Badge variant="outline" className="gap-1 text-[11px] leading-none px-2 py-0.5">
              <Brain className="h-3 w-3 text-blue-500" />
              <span>Prophet</span>
              {renderInlineSummary() && (
                <span className="hidden sm:inline text-muted-foreground/80">•</span>
              )}
              <span className="hidden sm:inline max-w-[160px] truncate" title={modelType ?? undefined}>
                {renderInlineSummary()}
              </span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs">
          <div className="space-y-1">
            <div className="text-[12px] text-muted-foreground">Prophet configuration</div>
            <div className="text-[12px]"><span className="text-muted-foreground">Model:</span> {modelType ?? '—'}</div>
            <div className="text-[12px]"><span className="text-muted-foreground">Tags:</span> {modelConfig?.join(' • ') ?? '—'}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ProphetIndicator.displayName = 'ProphetIndicator';