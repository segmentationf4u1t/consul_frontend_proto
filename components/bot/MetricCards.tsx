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
  // NEW: optional shake intensity 0..1
  shakeIntensity?: number;
}

const MetricCard = memo(({ label, value, animationsEnabled, indicator, shakeIntensity = 0 }: MetricCardProps) => {
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
  
    const sweepGradient = {
      increment: 'linear-gradient(110deg, transparent 25%, rgba(34,197,94,0.35) 50%, transparent 75%)',
      decrement: 'linear-gradient(110deg, transparent 25%, rgba(239,68,68,0.35) 50%, transparent 75%)',
      none: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)',
    };
  
    // Derived shake configuration based on shakeIntensity
    const clampedIntensity = Math.max(0, Math.min(1, shakeIntensity));
    const shakeAmplitude = 0.8 + clampedIntensity * 2.2; // px movement
    const shakeRotate = 0.2 + clampedIntensity * 1.2; // deg
    const shakeDurationMs = 900 - clampedIntensity * 600; // faster with intensity
  
    // Wrapper shake config (shakes whole panel: border + card + overlays + rain + content)
    // Disable shake entirely when animationsEnabled is false
    const wrapperShakeStyle =
      animationsEnabled && clampedIntensity > 0
        ? {
            animation: `metric-shake ${Math.max(150, shakeDurationMs)}ms ease-in-out infinite`,
            ['--shake-amplitude' as any]: `${shakeAmplitude}px`,
            ['--shake-rotate' as any]: `${shakeRotate}deg`,
            transformOrigin: 'center',
          }
        : undefined;

  return (
    <div className="relative" style={wrapperShakeStyle}>
      {/* Outer animated border flash */}
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
        <div className="w-full h-full bg-card rounded-xl" />
      </div>

      {/* Card (holds overlays, rain, and content) */}
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-card backdrop-blur-sm h-20 w-full border-0">
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Direction-colored shine sweep */}
        <div
          onAnimationEnd={handleAnimationEnd}
          className={`absolute inset-0 z-10 rounded-xl pointer-events-none opacity-0 -translate-x-full -skew-x-[15deg] ${
            animation.active ? 'animate-shine' : ''
          }`}
          style={{
            background: sweepGradient[animation.direction],
          }}
        />

        {/* Inner shadow from edges to center (green/red) */}
        <div
          className={`absolute inset-0 z-[9] rounded-xl pointer-events-none transition-opacity duration-300 ${
            animation.active ? 'opacity-70' : 'opacity-0'
          }`}
          style={{
            boxShadow:
              animation.direction === 'increment'
                ? 'inset 0 0 18px 4px rgba(34, 197, 94, 0.45), inset 0 0 6px 2px rgba(34, 197, 94, 0.35)'
                : animation.direction === 'decrement'
                ? 'inset 0 0 18px 4px rgba(239, 68, 68, 0.45), inset 0 0 6px 2px rgba(239, 68, 68, 0.35)'
                : 'inset 0 0 14px 3px rgba(147, 197, 253, 0.25)',
          }}
        />

               {/* Eyes rain layer (behind content, clipped to card) — only for Kolejka and only when intensity > 0 */}
{label === 'Kolejka' && animationsEnabled && clampedIntensity > 0 && (
          <div
          className={`absolute inset-0 z-[5] overflow-hidden pointer-events-none transition-opacity duration-300 ${
            clampedIntensity > 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
            {(() => {
              // Density scales with intensity
              const spriteCount =
                clampedIntensity > 0.75 ? 10 : clampedIntensity > 0.4 ? 8 : 6;

              return Array.from({ length: spriteCount }).map((_, i) => {
                // Deterministic per-sprite seed for stable layout across renders
                const seed = (label.length * 13 + i * 17) % 100;
                const left = 5 + ((seed * 0.85) % 90); // 5%..95%
                const delay = (seed % 8) * 0.8; // faster stagger
                // Faster duration so sprites reach and pass the bottom, scales with intensity
                const duration = Math.max(
                  1.6,
                  3.6 - clampedIntensity * 1.8 + (seed % 4) * 0.2
                );
                const baseScale = 0.45 + ((seed % 7) / 10); // 0.45..1.15
                const scale = baseScale * (0.9 + clampedIntensity * 0.25);
                const opacity =
                  0.18 + ((seed % 5) * 0.05) + clampedIntensity * 0.08;

                return (
                  <div
                    key={`eyes-${i}`}
                    className="absolute top-[-8%]"
                    style={{
                      left: `${left}%`,
                      animation: `eyes-fall ${duration}s linear ${delay}s infinite`,
                      opacity,
                      filter: 'brightness(1.05)',
                    }}
                  >
                    <img
                      src="/eyes.gif"
                      alt=""
                      className="select-none"
                      draggable={false}
                      style={{
                        width: `${Math.round(28 * scale)}px`,
                        height: `${Math.round(28 * scale)}px`,
                        objectFit: 'contain',
                        imageRendering: 'auto',
                      }}
                    />
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Content */}
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

  const loggedIn = Number(data.zalogowani) || 0;
  const baseThreshold = Math.floor(loggedIn * 0.1);
  const allowedBreak = loggedIn >= 10 ? baseThreshold : (loggedIn > 0 ? 1 : 0);
  const currentBreak = Number(data.przerwa) || 0;
  const showBreakWarning = currentBreak > allowedBreak;

  const queue = data.kolejka || 0;
  const queueIntensity = queue > 7 ? Math.min(1, (queue - 7) / 8) : 0; // 7→0, 15+→1

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard label="Kolejka" value={queue} animationsEnabled={animationsEnabled} shakeIntensity={queueIntensity} />
      <MetricCard label="Zalogowani" value={data.zalogowani || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Gotowi" value={data.gotowi || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Rozmawiają" value={data.rozmawiaja || 0} animationsEnabled={animationsEnabled} />
      <MetricCard label="Nieobsłużone" value={data.nieobsluzone || 0} animationsEnabled={animationsEnabled} />
      <MetricCard 
        label="Przerwa" 
        value={currentBreak} 
        indicator={{ show: showBreakWarning, tooltip: `Liczba osób na przerwie przekracza dopuszczalny limit (${allowedBreak}).` }}
        animationsEnabled={animationsEnabled}
      />
    </div>
  );
});

MetricCards.displayName = 'MetricCards';

const Style = () => (
  <style jsx global>{`
    @keyframes metric-shake {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      10% { transform: translate3d(var(--shake-amplitude), 0, 0) rotate(var(--shake-rotate)); }
      20% { transform: translate3d(0, var(--shake-amplitude), 0) rotate(calc(var(--shake-rotate) * -0.7)); }
      30% { transform: translate3d(calc(var(--shake-amplitude) * -0.8), 0, 0) rotate(calc(var(--shake-rotate) * 0.9)); }
      40% { transform: translate3d(0, calc(var(--shake-amplitude) * -0.8), 0) rotate(calc(var(--shake-rotate) * -0.8)); }
      50% { transform: translate3d(calc(var(--shake-amplitude) * 0.6), 0, 0) rotate(calc(var(--shake-rotate) * 0.6)); }
      60% { transform: translate3d(0, calc(var(--shake-amplitude) * 0.5), 0) rotate(calc(var(--shake-rotate) * -0.5)); }
      70% { transform: translate3d(calc(var(--shake-amplitude) * -0.4), 0, 0) rotate(calc(var(--shake-rotate) * 0.4)); }
      80% { transform: translate3d(0, calc(var(--shake-amplitude) * -0.3), 0) rotate(calc(var(--shake-rotate) * -0.3)); }
      90% { transform: translate3d(calc(var(--shake-amplitude) * 0.2), 0, 0) rotate(calc(var(--shake-rotate) * 0.2)); }
      100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    }
   @keyframes eyes-fall {
  0% {
    transform: translateY(-10%); /* start slightly above top */
    opacity: var(--eyes-opacity, 0.28);
  }
  88% {
    transform: translateY(110%); /* near bottom */
    opacity: var(--eyes-opacity, 0.28);
  }
  100% {
    transform: translateY(150%); /* well below card to guarantee exit */
    opacity: 0;
  }
}
  `}</style>
);

export { Style as MetricCardsShakeStyle };
