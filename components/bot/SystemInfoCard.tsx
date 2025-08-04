'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Database, HardDrive, Clock, FileText } from 'lucide-react';
import { SystemInfo } from '@/types/system';
import { API_BASE_URL } from '@/lib/api-config';

interface SystemInfoCardProps {
  className?: string;
}

export function SystemInfoCard({ className = '' }: SystemInfoCardProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system/info`);
      if (!response.ok) {
        throw new Error('Failed to fetch system info');
      }
      const data = await response.json();
      setSystemInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching system info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/info/refresh`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to refresh system info');
      }
      const result = await response.json();
      if (result.success && result.data) {
        setSystemInfo(result.data);
        setError(null);
      } else {
        throw new Error(result.message || 'Refresh failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
      console.error('Error refreshing system info:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pl-PL');
  };

  const getStorageColor = (percentage: number) => {
    if (percentage < 70) return 'text-green-600';
    if (percentage < 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchSystemInfo();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchSystemInfo, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informacje Systemowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !systemInfo) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informacje Systemowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              {error || 'Brak danych systemowych'}
            </p>
            <Button onClick={fetchSystemInfo} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Spróbuj ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Debug Info
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
        <CardDescription className="text-xs">
          Aktualizacja: {formatDate(systemInfo.lastUpdated)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Compact Database and Storage Info */}
        <div className="grid grid-cols-2 gap-4">
          {/* Database Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Baza Danych
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rekordów:</span>
                <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rozmiar:</span>
                <span className="font-mono">{systemInfo.database.fileSizeMB} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Panel:</span>
                <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.panelLogs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kampanie:</span>
                <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.campaignLogs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prognozy:</span>
                <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.predictionLogs)}</span>
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              Dysk
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wolne:</span>
                <span className="font-mono">{systemInfo.storage.freeDiskSpaceGB.toFixed(1)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Całkowite:</span>
                <span className="font-mono">{systemInfo.storage.totalDiskSpaceGB.toFixed(1)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Użycie:</span>
                <span className={`font-mono ${getStorageColor(systemInfo.storage.usedPercentage)}`}>
                  {systemInfo.storage.usedPercentage.toFixed(1)}%
                </span>
              </div>
              
              {/* Compact storage bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    systemInfo.storage.usedPercentage < 70 
                      ? 'bg-green-500' 
                      : systemInfo.storage.usedPercentage < 85 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${systemInfo.storage.usedPercentage}%` }}
                />
              </div>

              {systemInfo.storage.usedPercentage > 85 && (
                <Badge variant="destructive" className="text-xs mt-1">
                  Mało miejsca
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Data age range - compact */}
        {systemInfo.database.oldestRecord && systemInfo.database.newestRecord && (
          <div className="pt-2 border-t text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Od:</span>
              <span className="font-mono">{formatDate(systemInfo.database.oldestRecord)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Do:</span>
              <span className="font-mono">{formatDate(systemInfo.database.newestRecord)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}