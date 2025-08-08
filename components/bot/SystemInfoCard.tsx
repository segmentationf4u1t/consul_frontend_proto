'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Cpu, MemoryStick, HardDrive, Database } from 'lucide-react';
import { SystemInfo } from '@/types/system';
import { API_BASE_URL, withAuth } from '@/lib/api-config';

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
      const response = await fetch(`${API_BASE_URL}/system/info`, withAuth());
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
      const response = await fetch(`${API_BASE_URL}/system/info/refresh`, withAuth({ method: 'POST' }));
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

  const formatNumber = (num: number) => {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 70) return 'text-green-600 dark:text-green-400';
    if (percentage < 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressBar = (percentage: number) => {
    const color = percentage < 70 ? 'bg-green-500' : percentage < 90 ? 'bg-yellow-500' : 'bg-red-500';
    return { width: `${Math.min(percentage, 100)}%`, className: color };
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
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 origin-center motion-safe:animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ładowanie...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !systemInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-destructive">Błąd systemu</span>
            <Button onClick={fetchSystemInfo} variant="ghost" size="sm" className="h-6 px-2">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">System Monitor</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(systemInfo.lastUpdated).toLocaleTimeString('pl-PL')}
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 origin-center ${isRefreshing ? 'motion-safe:animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* CPU Card */}
          {systemInfo.system && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Użycie</span>
                  <span className={`text-sm font-bold ${getStatusColor(systemInfo.system.cpu.usage)}`}>
                    {systemInfo.system.cpu.usage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBar(systemInfo.system.cpu.usage).className}`}
                    style={{ width: getProgressBar(systemInfo.system.cpu.usage).width }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemInfo.system.cpu.cores} cores • Load: {systemInfo.system.cpu.loadAverage.oneMinute}
                </div>
              </div>
            </div>
          )}

          {/* Memory Card */}
          {systemInfo.system && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">RAM</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Użycie</span>
                  <span className={`text-sm font-bold ${getStatusColor(systemInfo.system.memory.usagePercentage)}`}>
                    {systemInfo.system.memory.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBar(systemInfo.system.memory.usagePercentage).className}`}
                    style={{ width: getProgressBar(systemInfo.system.memory.usagePercentage).width }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {systemInfo.system.memory.usedGB.toFixed(1)}GB / {systemInfo.system.memory.totalGB.toFixed(1)}GB
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Storage */}
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Dysk</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Zajęte</span>
                <span className={`text-sm font-bold ${getStatusColor(systemInfo.storage.usedPercentage)}`}>
                  {systemInfo.storage.usedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBar(systemInfo.storage.usedPercentage).className}`}
                  style={{ width: getProgressBar(systemInfo.storage.usedPercentage).width }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {(systemInfo.storage.totalDiskSpaceGB - systemInfo.storage.freeDiskSpaceGB).toFixed(1)}GB / {systemInfo.storage.totalDiskSpaceGB.toFixed(1)}GB
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Baza</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rekordów</span>
                <span className="text-sm font-bold">
                  {formatNumber(systemInfo.database.totalRecords.total)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Rozmiar</span>
                <span className="text-sm font-bold">
                  {systemInfo.database.fileSizeMB}MB
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Panel: {formatNumber(systemInfo.database.totalRecords.panelLogs)} • 
                Kampanie: {formatNumber(systemInfo.database.totalRecords.campaignLogs)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}