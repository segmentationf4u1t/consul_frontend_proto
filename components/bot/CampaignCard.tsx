'use client';

import { CampaignData } from '@/types/wallboard';
import { CampaignPrediction } from '@/types/predictions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';

interface ExtendedCampaignData extends CampaignData {
  prediction?: CampaignPrediction;
  isTotal?: boolean;
}

interface CampaignCardProps {
  campaign: ExtendedCampaignData;
  showPredictions: boolean;
}

export const CampaignCard = ({ campaign, showPredictions }: CampaignCardProps) => {
  const {
    kampanie,
    zalogowani,
    gotowi,
    kolejka,
    odebrane,
    odebranePercent,
    czasOczekiwania,
    srednyCzasRozmowy,
    polaczenia,
    prediction,
    isTotal
  } = campaign;

  // Warning logic for TIP campaign
  const now = new Date();
  const timeZone = 'Europe/Warsaw';
  const zonedNow = toZonedTime(now, timeZone);
  const dayOfWeek = zonedNow.getDay();
  const hour = zonedNow.getHours();
  const isWorkingHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 22;
  const isTipCampaign = kampanie === 'TIP_Ogolna_PL';
  const showWarning = isTipCampaign && zalogowani === 1 && isWorkingHours;

  // Badge variant for percentage
  const variant = odebranePercent > 80 ? "default" : odebranePercent > 60 ? "secondary" : "destructive";

  return (
    <Card className={`${isTotal ? 'border-primary bg-muted/20' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header with campaign name and warnings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {zalogowani === 0 && !isTotal && (
              <div className="h-3 w-1 rounded-full bg-red-500 animate-pulse-slow" />
            )}
            {showWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-background border-primary">
                    <p className="font-bold">Uwaga na obsadę!</p>
                    <p>Jedyna osoba na kampanii TIP_Ogolna_PL jest aktywna jedynie na Mailach.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <h3 className={`font-semibold text-sm truncate ${isTotal ? 'text-primary' : ''}`}>
              {kampanie}
            </h3>
          </div>
          {isTotal ? (
            <Badge variant="outline" className="font-bold text-xs">TOTAL</Badge>
          ) : (
            <Badge variant={variant} className="text-xs">{`${odebranePercent}%`}</Badge>
          )}
        </div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Zalogowani</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{zalogowani}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Gotowi</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{gotowi}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Kolejka</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{kolejka}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Połączenia</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{polaczenia}</div>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
          <div className="space-y-1">
            <div className="text-muted-foreground">Odebrane</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{odebrane}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Czas oczekiwania</div>
            <div className={`font-medium ${isTotal ? 'font-bold' : ''}`}>{czasOczekiwania}</div>
          </div>
        </div>

        {/* Prediction section */}
        {showPredictions && prediction && !isTotal && prediction.predictedTotalCalls >= 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-muted-foreground text-xs">Prognoza</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Aktualnie: {polaczenia}</span>
                <span className="font-bold">Cel: {prediction.predictedTotalCalls}</span>
              </div>
              <Progress 
                value={(polaczenia / prediction.predictedTotalCalls) * 100} 
                className="w-full h-1"
              />
              <div className="text-center text-xs text-muted-foreground">
                {((polaczenia / prediction.predictedTotalCalls) * 100).toFixed(1)}% ukończone
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};