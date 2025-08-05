'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { WallboardData } from '@/types/wallboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TriangleAlert } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  label: string;
  value: number | string;
  animationsEnabled: boolean;
  indicator?: {
    show: boolean;
    tooltip: string;
  };
}

const MetricCard = memo(({ label, value, animationsEnabled, indicator }: MetricCardProps) => {
    const [animation, setAnimation] = useState({ active: false, direction: 'none' as 'none' | 'increment' | 'decrement' });
    const prevValueRef = useRef<number | null>(null);
    const isFirstRender = useRef(true);
  
    useEffect(() => {
      if (!animationsEnabled) {
        setAnimation({ active: false, direction: 'none' });
        return;
      }
  
      const current = Number(value);
      const prev = prevValueRef.current;
  
      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else if (prev !== null && prev !== current) {
        const newDirection = current > prev ? 'increment' : 'decrement';
        setAnimation({ active: true, direction: newDirection });
      }
  
      prevValueRef.current = current;
    }, [value, animationsEnabled]);
  
    const handleAnimationEnd = () => {
      setAnimation({ active: false, direction: 'none' });
    };
  
    const colorClass = {
      increment: 'text-green-500',
      decrement: 'text-red-500',
      none: ''
    }[animation.direction];
  
    const borderGradients = {
      increment: 'linear-gradient(45deg, #22c55e, #10b981, #86efac)',
      decrement: 'linear-gradient(45deg, #ef4444, #dc2626, #f87171)',
      none: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4)',
    };
  
    return (
      <div className="relative">
        <div 
          onAnimationEnd={handleAnimationEnd}
          className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-500 ${
            animation.active ? 'opacity-100 animate-gradient-shift' : 'opacity-0'
          }`}
          style={{
            backgroundImage: borderGradients[animation.direction],
            backgroundSize: '400% 400%',
            padding: '2px',
          }}
        >
          <div className="w-full h-full bg-card rounded-xl"></div>
        </div>
        
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-card backdrop-blur-sm h-20 w-full border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div 
            onAnimationEnd={handleAnimationEnd}
            className={`absolute inset-0 z-10 rounded-xl pointer-events-none opacity-0 -translate-x-full -skew-x-[15deg] ${
              animation.active ? 'animate-shine' : ''
            }`}
            style={{
              background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.9) 50%, transparent 75%)',
            }}
          />
          
          <div 
            className={`absolute inset-0 z-5 rounded-xl pointer-events-none transition-all duration-500 ${
              animation.active ? 'opacity-50' : 'opacity-0'
            }`}
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.5), transparent 70%)',
              transform: animation.active ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          
          <CardContent className="flex flex-col items-center justify-center p-2 text-center relative z-20 h-full">
            <CardTitle className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-2">
              {label}
              <div className={`transition-opacity duration-300 ${indicator?.show ? 'opacity-100' : 'opacity-0'}`}>
                {indicator?.show && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <TriangleAlert className="h-4 w-4 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{indicator.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardTitle>
            <div 
              className={`text-xl font-bold transition-all duration-300 ${
                animation.active ? `scale-110 ${colorClass}` : 'scale-100'
              }`}
            >
              {value}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  });
MetricCard.displayName = 'MetricCard';

interface MetricCardsProps {
  data: WallboardData | null;
  animationsEnabled: boolean;
  isInitialLoading: boolean;
  error: string | null;
}

const MetricCardSkeleton = () => (
    <Card className="h-20 w-full">
        <CardContent className="flex flex-col items-center justify-center p-2 text-center h-full space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-12" />
        </CardContent>
    </Card>
);


export const MetricCards = memo(({ data, animationsEnabled, isInitialLoading, error }: MetricCardsProps) => {
  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-semibold text-destructive">Nie można załadować danych panelu</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
        <Card>
            <CardContent className="p-12 text-center">
                <p className="font-semibold">Brak dostępnych danych panelu</p>
            </CardContent>
        </Card>
    );
  }

  const breakThreshold = data.zalogowani ? data.zalogowani * 0.1 : 0;
  const showBreakWarning = data.przerwa ? data.przerwa > breakThreshold : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard label="Kolejka" value={data.kolejka || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Zalogowani" value={data.zalogowani || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Gotowi" value={data.gotowi || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Rozmawiają" value={data.rozmawiaja || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Nieobsłużone" value={data.nieobsluzone || 0} animationsEnabled={animationsEnabled} />
      <MetricCard 
        label="Przerwa" 
        value={data.przerwa || 0} 
        indicator={{ show: showBreakWarning, tooltip: `Liczba osób na przerwie przekracza 10% zalogowanych (${Math.floor(breakThreshold)}).` }}
        animationsEnabled={animationsEnabled}
      />
    </div>
  );
});

MetricCards.displayName = 'MetricCards';
