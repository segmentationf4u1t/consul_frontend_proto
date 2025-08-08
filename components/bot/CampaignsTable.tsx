'use client';

import { memo, Dispatch, SetStateAction } from 'react';
import { WallboardData } from '@/types/wallboard';
import { DataTable } from '@/components/tables/data-table';
import { columns, TableRowData } from '@/components/tables/columns';
import { SortingState } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useScreenSize } from '@/hooks/use-mobile';
import { CampaignPrediction } from '@/types/predictions';
import { useMemo } from 'react';
import { useCampaignSummaries } from '@/hooks/use-campaign-summaries';

interface CampaignsTableProps {
  data: WallboardData | null;
  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  isInitialLoading: boolean;
  error: string | null;
  predictions: Map<string, CampaignPrediction>; // TEMPORARILY DISABLED - was: Map<string, CampaignPrediction>
  predictionsLoading: boolean;
  showPredictions: boolean;
  onRowClick?: (campaignName: string) => void;
}

const CampaignsTableSkeleton = () => (
    <Card>
        <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="flex space-x-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
            </div>
            {/* Rows */}
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                </div>
            ))}
        </CardContent>
    </Card>
);

// Helper function to convert time string (HH:MM:SS or MM:SS) to seconds
const timeStringToSeconds = (timeStr: string): number => {
  if (!timeStr || timeStr === '0' || timeStr === '-') return 0;
  
  const parts = timeStr.split(':').map(p => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // Just seconds
    return parts[0];
  }
  return 0;
};

// Helper function to convert seconds back to time string
const secondsToTimeString = (seconds: number): string => {
  if (seconds === 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

export const CampaignsTable = memo(({ data, sorting, setSorting, isInitialLoading, error, predictions, predictionsLoading, showPredictions, onRowClick }: CampaignsTableProps) => {
  const { isMobile, isTablet } = useScreenSize();
  const campaignNames = useMemo(() => data?.campaigns?.map(c => c.kampanie) ?? [], [data?.campaigns])
  const { summaries } = useCampaignSummaries(campaignNames)
  
  if (isInitialLoading) {
    return <CampaignsTableSkeleton />;
  }

  if (data?.campaigns && data.campaigns.length > 0) {
    const extendedData = data.campaigns.map(campaign => ({
      ...campaign,
      prediction: predictions.get(campaign.kampanie),
    }));

    // Calculate totals and averages
    const totalOdebrane = extendedData.reduce((sum, campaign) => sum + (campaign.odebrane || 0), 0);
    const totalPolaczenia = extendedData.reduce((sum, campaign) => sum + (campaign.polaczenia || 0), 0);
    
    // Weighted/global metrics
    const totalWaitWeightedSeconds = extendedData.reduce(
      (sum, c) => sum + timeStringToSeconds(c.czasOczekiwania) * (c.polaczenia || 0),
      0
    );
    const totalTalkWeightedSeconds = extendedData.reduce(
      (sum, c) => sum + timeStringToSeconds(c.srednyCzasRozmowy) * (c.odebrane || 0),
      0
    );

    const globalOdebranePercent =
      totalPolaczenia > 0 ? (totalOdebrane / totalPolaczenia) * 100 : 0;

    const avgCzasOczekiwaniaSeconds =
      totalPolaczenia > 0 ? totalWaitWeightedSeconds / totalPolaczenia : 0;

    // Prefer weighting by odebrane; fallback to polaczenia if no odebrane
    const talkWeightDenominator = totalOdebrane > 0 ? totalOdebrane : totalPolaczenia;
    const avgSrednyCzasRozmowySeconds =
      talkWeightDenominator > 0 ? totalTalkWeightedSeconds / talkWeightDenominator : 0;

    // Create TOTAL row - pure frontend summary without predictions
    const totalRow = {
      kampanie: 'TOTAL',
      zalogowani: null, // Empty for TOTAL row
      gotowi: null, // Empty for TOTAL row
      kolejka: null, // Empty for TOTAL row
      odebrane: totalOdebrane,
      odebranePercent: Math.round(globalOdebranePercent * 100) / 100, // Round to 2 decimals
      czasOczekiwania: secondsToTimeString(Math.round(avgCzasOczekiwaniaSeconds)),
      srednyCzasRozmowy: secondsToTimeString(Math.round(avgSrednyCzasRozmowySeconds)),
      polaczenia: totalPolaczenia,
      prediction: null, // Empty for TOTAL row (no predictions)
      isTotal: true, // Flag to identify this as the total row
    };

    // Add total row at the end - cast to the expected table row type
    const dataWithTotal = [...extendedData, totalRow] as TableRowData[];
    
    const tableColumns = columns({ showPredictions: showPredictions, isMobile, isTablet, summaries });
    return (
      <DataTable
        columns={tableColumns}
        data={dataWithTotal}
        sorting={sorting}
        setSorting={setSorting}
        showPredictions={showPredictions}
        onRowClick={(row) => {
          const r = row as any as TableRowData;
          if (!r.isTotal) onRowClick?.(r.kampanie);
        }}
      />
    );
  }

  if (error && !data) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="font-semibold text-muted-foreground">Brak danych o kampanii</p>
      </CardContent>
    </Card>
  );
});

CampaignsTable.displayName = 'CampaignsTable';
