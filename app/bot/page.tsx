'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WallboardData } from '@/types/wallboard';
import { SortingState } from '@tanstack/react-table';
import { Header } from '@/components/bot/Header';
import { MetricCards } from '@/components/bot/MetricCards';
import { CampaignsTable } from '@/components/bot/CampaignsTable';
import { ConnectionStatusIndicator } from '@/components/bot/ConnectionStatus';


type ConnectionStatus = 'connected' | 'reconnecting' | 'stalled' | 'error';

export default function BotPage() {
  const [tipData, setTipData] = useState<WallboardData | null>(null);
  const [energaData, setEnergaData] = useState<WallboardData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [sorting, setSorting] = useState<SortingState>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  

  const resetStallTimer = useCallback(() => {
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
    }
    stallTimeoutRef.current = setTimeout(() => {
      setConnectionStatus('stalled');
    }, 15000); // 15 seconds
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('http://192.168.1.33:3001/wallboard/events');

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      resetStallTimer();
      setError(null);
    };

    eventSource.onmessage = (event) => {
      setConnectionStatus('connected');
      resetStallTimer();
      setError(null);
      
      const data = JSON.parse(event.data);
      if (data.tip) {
        setTipData(data.tip);
      }
      if (data.energa) {
        setEnergaData(data.energa);
      }
      setLastRefresh(new Date());
      setIsInitialLoading(false);
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setConnectionStatus('error');
      setIsInitialLoading(false);
      setError('Brak połączenia z serwerem. Strona odświeży się automatycznie po nawiązaniu połączenia.');

      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
    };

    return () => {
      eventSource.close();
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
    };
  }, [resetStallTimer]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <section className="relative">
          <Header
            connectionStatus={connectionStatus}
            error={error}
          />
          
          <MetricCards 
            data={tipData} 
            animationsEnabled={animationsEnabled}
            isInitialLoading={isInitialLoading}
            error={error}
          />
        </section>

        {/*
        <section>
          <HistoricalChart />
        </section>
        */}

        <section>
          <CampaignsTable
            data={energaData}
            sorting={sorting}
            setSorting={setSorting}
            isInitialLoading={isInitialLoading}
            error={error}
          />
        </section>
        
        <ConnectionStatusIndicator 
            status={connectionStatus} 
            lastRefresh={lastRefresh} 
            animationsEnabled={animationsEnabled}
            onAnimationsToggle={setAnimationsEnabled}
        />
      </div>
    </div>
  );
}
