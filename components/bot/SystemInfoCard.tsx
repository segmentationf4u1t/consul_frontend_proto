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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informacje Systemowe
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              Ostatnia aktualizacja: {formatDate(systemInfo.lastUpdated)}
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Information */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Baza Danych
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Całkowita liczba rekordów</p>
              <p className="font-mono text-lg">{formatNumber(systemInfo.database.totalRecords.total)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rozmiar pliku</p>
              <p className="font-mono text-lg">{systemInfo.database.fileSizeMB} MB</p>
            </div>
          </div>
          
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Panel logs:</span>
              <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.panelLogs)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Campaign logs:</span>
              <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.campaignLogs)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Prediction logs:</span>
              <span className="font-mono">{formatNumber(systemInfo.database.totalRecords.predictionLogs)}</span>
            </div>
          </div>

          {systemInfo.database.oldestRecord && systemInfo.database.newestRecord && (
            <div className="mt-3 pt-3 border-t text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Najstarszy rekord:</span>
                <span className="font-mono">{formatDate(systemInfo.database.oldestRecord)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Najnowszy rekord:</span>
                <span className="font-mono">{formatDate(systemInfo.database.newestRecord)}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Storage Information */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Pamięć Masowa
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Wolne miejsce</p>
              <p className="font-mono text-lg">{systemInfo.storage.freeDiskSpaceGB.toFixed(1)} GB</p>
            </div>
            <div>
              <p className="text-muted-foreground">Wykorzystanie</p>
              <p className={`font-mono text-lg ${getStorageColor(systemInfo.storage.usedPercentage)}`}>
                {systemInfo.storage.usedPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Całkowita przestrzeń:</span>
              <span className="font-mono">{systemInfo.storage.totalDiskSpaceGB.toFixed(1)} GB</span>
            </div>
            
            {/* Storage usage bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  systemInfo.storage.usedPercentage < 70 
                    ? 'bg-green-500' 
                    : systemInfo.storage.usedPercentage < 85 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${systemInfo.storage.usedPercentage}%` }}
              />
            </div>
          </div>

          {systemInfo.storage.usedPercentage > 85 && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                Ostrzeżenie: Mało miejsca na dysku
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}