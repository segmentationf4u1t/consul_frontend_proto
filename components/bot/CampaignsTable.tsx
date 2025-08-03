'use client';

import { memo, Dispatch, SetStateAction } from 'react';
import { WallboardData } from '@/types/wallboard';
import { DataTable } from '@/components/tables/data-table';
import { columns } from '@/components/tables/columns';
import { SortingState } from '@tanstack/react-table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignPrediction } from '@/types/predictions';

interface CampaignsTableProps {
  data: WallboardData | null;
  sorting: SortingState;
  setSorting: Dispatch<SetStateAction<SortingState>>;
  isInitialLoading: boolean;
  error: string | null;
  predictions: Map<string, CampaignPrediction>;
  predictionsLoading: boolean;
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

export const CampaignsTable = memo(({ data, sorting, setSorting, isInitialLoading, error, predictions, predictionsLoading }: CampaignsTableProps) => {
  if (isInitialLoading) {
    return <CampaignsTableSkeleton />;
  }

  if (data?.campaigns && data.campaigns.length > 0) {
    const extendedData = data.campaigns.map(campaign => ({
      ...campaign,
      prediction: predictions.get(campaign.kampanie),
    }));
    return <DataTable columns={columns} data={extendedData} sorting={sorting} setSorting={setSorting} />;
  }

  if (error && !data) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-12 text-center">
        <p className="font-semibold">Brak danych o kampanii</p>
      </CardContent>
    </Card>
  );
});

CampaignsTable.displayName = 'CampaignsTable';
