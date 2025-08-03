'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { WallboardData, CampaignData } from '@/types/wallboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

export default function BotPage() {
  const [tipData, setTipData] = useState<WallboardData | null>(null);
  const [energaData, setEnergaData] = useState<WallboardData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [energaError, setEnergaError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Use refs to track if we have data to prevent flickering
  const hasTipData = useRef(false);
  const hasEnergaData = useRef(false);

  const fetchWallboardData = useCallback(async (isInitial = false) => {
    // Only show loading state on initial load, not on refreshes
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }

    // Don't clear errors immediately on refresh to prevent flickering
    if (isInitial) {
      setTipError(null);
      setEnergaError(null);
    }

    // Fetch TIP data
    try {
      const tipResponse = await fetch('http://localhost:3000/wallboard/tip?tables=false');
      if (!tipResponse.ok) throw new Error(`TIP API error: ${tipResponse.status}`);
      const tipResult = await tipResponse.json();
      setTipData(tipResult);
      hasTipData.current = true;
      // Clear error only on successful fetch
      setTipError(null);
    } catch (error) {
      // Only set error if we don't have existing data or it's initial load
      if (!hasTipData.current || isInitial) {
        setTipError(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Fetch ENERGA data
    try {
      const energaResponse = await fetch('http://localhost:3000/wallboard/energa?panels=false');
      if (!energaResponse.ok) throw new Error(`ENERGA API error: ${energaResponse.status}`);
      const energaResult = await energaResponse.json();
      setEnergaData(energaResult);
      hasEnergaData.current = true;
      // Clear error only on successful fetch
      setEnergaError(null);
    } catch (error) {
      // Only set error if we don't have existing data or it's initial load
      if (!hasEnergaData.current || isInitial) {
        setEnergaError(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    setIsInitialLoading(false);
    setIsRefreshing(false);
    setLastRefresh(new Date());
  }, []);

  const testAnimation = () => {
    console.log('Test animation button clicked');
    if (tipData) {
      // Simulate data change by incrementing values
      setTipData({
        ...tipData,
        kolejka: (tipData.kolejka || 0) + Math.floor(Math.random() * 5) + 1,
        zalogowani: (tipData.zalogowani || 0) + Math.floor(Math.random() * 3) + 1,
        gotowi: (tipData.gotowi || 0) + Math.floor(Math.random() * 2) + 1,
        przerwa: (tipData.przerwa || 0) + Math.floor(Math.random() * 2),
        rozmawiaja: (tipData.rozmawiaja || 0) + Math.floor(Math.random() * 3) + 1,
      });
    }
  };

  useEffect(() => {
    fetchWallboardData(true); // Initial load
    const interval = setInterval(() => fetchWallboardData(false), 5000); // Subsequent refreshes
    return () => clearInterval(interval);
  }, [fetchWallboardData]);

  const MetricCard = ({ label, value }: { label: string; value: number | string }) => {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const prevValueRef = useRef<number | string | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
      console.log(`MetricCard ${label}: prev=${prevValueRef.current}, new=${value}, isFirst=${isFirstRender.current}`);
      
      // Skip animation on first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        prevValueRef.current = value;
        return;
      }
      
      // Only animate if value actually changed
      if (prevValueRef.current !== null && prevValueRef.current !== value) {
        console.log(`Triggering animation for ${label}: ${prevValueRef.current} -> ${value}`);
        setShouldAnimate(true);
        const timer = setTimeout(() => {
          setShouldAnimate(false);
        }, 2000);
        
        // Update the previous value
        prevValueRef.current = value;
        
        return () => clearTimeout(timer);
      }
      
      // Update previous value even if no animation
      prevValueRef.current = value;
    }, [value, label]);

    return (
      <div className="relative">
        {/* Animated Border */}
        <div 
          className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 ${
            shouldAnimate ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981)',
            backgroundSize: '400% 400%',
            animation: shouldAnimate ? 'gradient-shift 1.5s ease-in-out' : 'none',
            padding: '2px',
          }}
        >
          <div className="w-full h-full bg-card rounded-xl"></div>
        </div>
        
        <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-card/50 backdrop-blur-sm h-20 w-full ${
          shouldAnimate ? 'border-2 border-blue-500/50' : 'border-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Custom Shine Beam Effect */}
          <div 
            className={`absolute inset-0 z-10 rounded-xl pointer-events-none transition-all duration-1000 ${
              shouldAnimate ? 'animate-shine' : ''
            }`}
            style={{
              background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.7) 50%, transparent 75%)',
              transform: shouldAnimate ? 'translateX(100%)' : 'translateX(-100%)',
            }}
          />
          
          {/* Glow effect */}
          <div 
            className={`absolute inset-0 z-5 rounded-xl pointer-events-none transition-all duration-500 ${
              shouldAnimate ? 'opacity-30' : 'opacity-0'
            }`}
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3), transparent 70%)',
              transform: shouldAnimate ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          
          <CardContent className="flex flex-col items-center justify-center p-2 text-center relative z-20 h-full">
            <CardTitle className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
            <div 
              className={`text-xl font-bold transition-all duration-300 ${
                shouldAnimate ? 'scale-110 text-blue-600' : 'scale-100'
              }`}
            >
              {value}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const CampaignRow = memo(({ campaign }: { campaign: CampaignData }) => (
    <TableRow>
      <TableCell className="font-medium">{campaign.kampanie}</TableCell>
      <TableCell>{campaign.zalogowani}</TableCell>
      <TableCell>{campaign.gotowi}</TableCell>
      <TableCell>{campaign.kolejka}</TableCell>
      <TableCell>{campaign.odebrane}</TableCell>
      <TableCell>
        <Badge 
          variant={campaign.odebranePercent > 80 ? 'default' : campaign.odebranePercent > 60 ? 'secondary' : 'destructive'}
        >
          {campaign.odebranePercent}%
        </Badge>
      </TableCell>
      <TableCell>{campaign.czasOczekiwania}</TableCell>
      <TableCell>{campaign.srednyCzasRozmowy}</TableCell>
      <TableCell>{campaign.polaczenia}</TableCell>
    </TableRow>
  ));

  return (
    <div className="min-h-screen bg-background">
      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="px-4 py-2">
            <div className="flex items-center space-x-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </div>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Panel Overview */}
        <section>
          <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
          {isInitialLoading && !tipData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tipError && !tipData ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="font-semibold text-destructive">Unable to load panel data</p>
                <p className="text-sm text-muted-foreground mt-2">{tipError}</p>
              </CardContent>
            </Card>
          ) : tipData && typeof tipData === 'object' ? (
            <>
              <div className="mb-4">
                <Button 
                  onClick={testAnimation}
                  variant="outline"
                  size="sm"
                >
                  Test Animation (Change Values)
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <MetricCard 
                  key="queue"
                  label="Queue" 
                  value={tipData.kolejka || 0} 
                />
                <MetricCard 
                  key="logged"
                  label="Logged In" 
                  value={tipData.zalogowani || 0} 
                />
                <MetricCard 
                  key="ready"
                  label="Ready" 
                  value={tipData.gotowi || 0} 
                />
                <MetricCard 
                  key="break"
                  label="Break" 
                  value={tipData.przerwa || 0} 
                />
                <MetricCard 
                  key="talking"
                  label="Talking" 
                  value={tipData.rozmawiaja || 0} 
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="font-semibold">No panel data available</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Campaign Table */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Campaign Data</h2>
          {isInitialLoading && !energaData ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : energaError && !energaData ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="font-semibold text-destructive">Unable to load campaign data</p>
                <p className="text-sm text-muted-foreground mt-2">{energaError}</p>
              </CardContent>
            </Card>
          ) : energaData && energaData.campaigns && energaData.campaigns.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Logged</TableHead>
                      <TableHead>Ready</TableHead>
                      <TableHead>Queue</TableHead>
                      <TableHead>Answered</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Avg Call</TableHead>
                      <TableHead>Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {energaData.campaigns.map((campaign, index) => (
                      <CampaignRow key={index} campaign={campaign} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="font-semibold">No campaign data available</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Footer */}
        <div className="text-center pt-8">
          <Card className="inline-block">
            <CardContent className="px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Last updated {lastRefresh.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}