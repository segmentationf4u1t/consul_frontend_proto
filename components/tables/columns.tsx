"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CampaignData } from "@/types/wallboard"
import { CampaignPrediction } from "@/types/predictions"
import type { CampaignHistoricalSummary as Summary } from "@/types/historical"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle } from "lucide-react"

import { toZonedTime } from "date-fns-tz"

interface ExtendedCampaignData extends CampaignData {
  prediction?: CampaignPrediction | null;
}

// Type for table rows that can handle TOTAL row with nullable fields
export interface TableRowData {
  kampanie: string;
  zalogowani: number | null;
  gotowi: number | null;
  kolejka: number | null;
  odebrane: number;
  odebranePercent: number;
  czasOczekiwania: string;
  srednyCzasRozmowy: string;
  polaczenia: number;
  prediction?: CampaignPrediction | null;
  isTotal?: boolean;
}

interface ColumnsOptions {
  showPredictions: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
  summaries?: Map<string, Summary>;
}

export const columns = ({ showPredictions, isMobile = false, isTablet = false, summaries }: ColumnsOptions): ColumnDef<TableRowData>[] => {
  // Define all possible columns
  const allColumns: ColumnDef<TableRowData>[] = [
    {
      accessorKey: "kampanie",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-2 hover:bg-muted/50"
          >
            <span className={isMobile ? "text-xs" : ""}>Kampania</span>
            <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
          </Button>
        )
      },
      cell: ({ row }) => {
        const kampanie = row.getValue("kampanie") as string;
        const zalogowani = row.getValue("zalogowani") as number;
        const isTotal = row.original.isTotal;
        const summary = summaries?.get(kampanie);
        
        // Special styling for TOTAL row
        if (isTotal) {
          return (
            <div className={`flex items-center gap-2 font-bold text-foreground ${isMobile ? "text-xs" : ""}`}>
              {kampanie}
            </div>
          );
        }
        
        const now = new Date();
        const timeZone = 'Europe/Warsaw';
        const zonedNow = toZonedTime(now, timeZone);
        const dayOfWeek = zonedNow.getDay();
        const hour = zonedNow.getHours();

        const isWorkingHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 22;

        const isTipCampaign = kampanie === 'TIP_Ogolna_PL';
        const showWarning = isTipCampaign && zalogowani === 1 && isWorkingHours;

        const badge = (() => {
          if (!summary) return null
          const coverage = summary.coverage
          const days = summary.daysTracked
          const fresh = summary.newestUTC ? (Date.now() - new Date(summary.newestUTC).getTime()) / (1000 * 60) : Infinity
          const good = coverage.avgRowsPerDay >= 240 && fresh <= 30
          const warn = coverage.avgRowsPerDay >= 180 && fresh <= 120
          const label = fresh === Infinity ? 'brak' : fresh < 60 ? `${Math.round(fresh)}m` : `${Math.round(fresh/60)}h`
          const klass = good ? 'bg-green-500/15 text-green-600 border-green-600/30' : warn ? 'bg-yellow-500/15 text-yellow-700 border-yellow-600/30' : 'bg-destructive/10 text-destructive border-destructive/30'
          return (
            <span className={cn('px-1.5 py-0.5 rounded border text-[10px] leading-none', klass)} title={`Pokrycie ~${Math.round(coverage.avgRowsPerDay)} wierszy/dzień, świeżość ${label}`}>
              {label}
            </span>
          )
        })()

        return (
          <div className={`flex items-center gap-2 ${isMobile ? "text-xs" : ""}`}>
            {zalogowani === 0 && <div className="h-4 w-1 rounded-full bg-destructive animate-pulse" />}
            
            {showWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-yellow-600 animate-pulse`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">Uwaga na obsadę!</p>
                    <p>Jedyna osoba na kampanii TIP_Ogolna_PL jest aktywna jedynie na Mailach.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <span className="truncate">{kampanie}</span>
            {badge}
          </div>
        )
      },
      size: isMobile ? 150 : 200,
    },
    {
      accessorKey: "zalogowani",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Zalogowani</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const zalogowani = row.getValue("zalogowani") as number | null;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`flex items-center gap-2 ${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {zalogowani !== null ? zalogowani : ''}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
    {
      accessorKey: "gotowi",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Gotowi</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const gotowi = row.getValue("gotowi") as number | null;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {gotowi !== null ? gotowi : ''}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
    {
      accessorKey: "kolejka",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Kolejka</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const kolejka = row.getValue("kolejka") as number | null;
        const isTotal = row.original.isTotal;
        const kampanie = row.getValue("kampanie") as string;
        let icon: JSX.Element | null = null;
        if (!isTotal && typeof kolejka === 'number' && kolejka >= 10) {
          icon = <span title="Wysoka kolejka" className="ml-1 text-yellow-600">▲</span>
        }
        return (
          <div className={`flex items-center gap-1 ${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {kolejka !== null ? kolejka : ''}
            {icon}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
    {
      accessorKey: "odebrane",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Odebrane</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const odebrane = row.getValue("odebrane") as number;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {odebrane}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
    {
      accessorKey: "odebranePercent",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Odebrane %</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("odebranePercent"))
        const isTotal = row.original.isTotal;
        const kampanie = row.getValue("kampanie") as string;
        const warnIcon = !isTotal && amount < 70 ? (<span title="Spadek % odebranych" className="ml-1 text-destructive">▼</span>) : null
        
        // Color coding based on performance - using shadcn theme colors
        const getTextColor = (percent: number) => {
          if (percent >= 90) return "text-green-600 dark:text-green-400";
          if (percent >= 80) return "text-blue-600 dark:text-blue-400";
          if (percent >= 60) return "text-yellow-600 dark:text-yellow-400";
          return "text-destructive";
        };
  
        if (isTotal) {
          return (
            <div className={`font-bold text-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {`${amount}%`}
            </div>
          );
        }
        
        return (
          <div className={`flex items-center ${getTextColor(amount)} ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <span className="font-medium">{`${amount}%`}</span>
            {warnIcon}
          </div>
        );
      },
      size: isMobile ? 90 : 120,
    },
    {
      accessorKey: "czasOczekiwania",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Czas oczek.</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const czasOczekiwania = row.getValue("czasOczekiwania") as string;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {czasOczekiwania}
          </div>
        )
      },
      size: isMobile ? 90 : 140,
    },
    {
      accessorKey: "srednyCzasRozmowy",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Średni cz. rozm.</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const srednyCzasRozmowy = row.getValue("srednyCzasRozmowy") as string;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {srednyCzasRozmowy}
          </div>
        )
      },
      size: isMobile ? 100 : 150,
    },
    {
      accessorKey: "polaczenia",
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-2"
            >
              <span className={isMobile ? "text-xs" : ""}>Połączenia</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const polaczenia = row.getValue("polaczenia") as number;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold text-foreground' : 'text-foreground'} ${isMobile ? 'text-xs' : ''}`}>
            {polaczenia}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
  ];

  // Add prediction column if enabled
  if (showPredictions) {
    const predictionColumn: ColumnDef<TableRowData> = {
      accessorKey: "prediction",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-2"
        >
          <span className={isMobile ? "text-xs" : ""}>Prognoza</span>
          <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
        </Button>
      ),
      cell: ({ row }) => {
        const prediction = row.original.prediction;
        const polaczenia = row.original.polaczenia ?? 0;
        const isTotal = row.original.isTotal;

        // For TOTAL row, don't show predictions
        if (isTotal) {
          return <div className={`text-center font-bold text-foreground ${isMobile ? 'text-xs' : ''}`}></div>;
        }

        if (!prediction || prediction.predictedTotalCalls < 0) {
          return <div className={`text-center text-muted-foreground ${isMobile ? 'text-xs' : ''}`}>-</div>;
        }
        
        const progress = (polaczenia / prediction.predictedTotalCalls) * 100;
        const progressClamped = Math.min(progress, 100);
        const isValidProgress = !isNaN(progress) && isFinite(progress);

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <div className="flex items-center gap-2 min-h-[36px]">
                  <div className="flex flex-col flex-1 gap-1">
                    <div className={`flex justify-between items-center ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-muted-foreground">{polaczenia}</span>
                      <span className="font-semibold">{prediction.predictedTotalCalls}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          !isValidProgress ? 'bg-muted-foreground' :
                          progressClamped >= 90 ? 'bg-green-500' : 
                          progressClamped >= 70 ? 'bg-blue-500' : 
                          progressClamped >= 50 ? 'bg-yellow-500' : 'bg-destructive'
                        }`}
                        style={{ width: isValidProgress ? `${progressClamped}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <div className={`text-right font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground min-w-[35px]`}>
                    {isValidProgress ? `${progress.toFixed(0)}%` : '-'}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{`${polaczenia} / ${prediction.predictedTotalCalls}`}</p>
                <p>{`Progres: ${isValidProgress ? progress.toFixed(1) : 'N/A'}%`}</p>
                <p className="text-xs text-muted-foreground">Model: {prediction.modelUsed}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      size: isMobile ? 100 : 140,
    };
    allColumns.splice(5, 0, predictionColumn);
  }

  // Filter columns based on screen size
  if (isMobile) {
    // For mobile, show only the most essential columns
    const essentialColumns = [
      "kampanie",
      "zalogowani", 
      "kolejka",
      "odebranePercent",
      "polaczenia"
    ];
    
    if (showPredictions) {
      essentialColumns.splice(4, 0, "prediction");
    }
    
    return allColumns.filter(col => {
      const accessorKey = (col as any).accessorKey;
      return typeof accessorKey === 'string' && essentialColumns.includes(accessorKey);
    });
  } else if (isTablet) {
    // For tablet, hide some less critical columns
    const hiddenColumns = ["srednyCzasRozmowy"];
    return allColumns.filter(col => {
      const accessorKey = (col as any).accessorKey;
      return !accessorKey || !hiddenColumns.includes(accessorKey);
    });
  }

  // Desktop - show all columns
  return allColumns;
};
