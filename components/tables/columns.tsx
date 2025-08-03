"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CampaignData } from "@/types/wallboard"
import { CampaignPrediction } from "@/types/predictions"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle } from "lucide-react"

import { toZonedTime } from "date-fns-tz"

interface ExtendedCampaignData extends CampaignData {
  prediction?: CampaignPrediction;
}

interface ColumnsOptions {
  showPredictions: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const columns = ({ showPredictions, isMobile = false, isTablet = false }: ColumnsOptions): ColumnDef<ExtendedCampaignData>[] => {
  // Define all possible columns
  const allColumns: ColumnDef<ExtendedCampaignData>[] = [
    {
      accessorKey: "kampanie",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-2"
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
        
        // Special styling for TOTAL row
        if (isTotal) {
          return (
            <div className={`flex items-center gap-2 font-bold text-primary bg-muted/50 px-2 py-1 rounded ${isMobile ? "text-xs" : ""}`}>
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

        return (
          <div className={`flex items-center gap-2 ${isMobile ? "text-xs" : ""}`}>
            {zalogowani === 0 && <div className="h-4 w-1 rounded-full bg-red-500 animate-pulse-slow" />}
            
            {showWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-yellow-500 animate-pulse`} />
                  </TooltipTrigger>
                  <TooltipContent className="bg-background border-primary">
                    <p className="font-bold">Uwaga na obsadę!</p>
                    <p>Jedyna osoba na kampanii TIP_Ogolna_PL jest aktywna jedynie na Mailach.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <span className="truncate">{kampanie}</span>
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
        const zalogowani = parseFloat(row.getValue("zalogowani"))
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`flex items-center gap-2 ${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
            {zalogowani}
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
        const gotowi = row.getValue("gotowi") as number;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
            {gotowi}
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
        const kolejka = row.getValue("kolejka") as number;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
            {kolejka}
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
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
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
        const variant = amount > 80 ? "default" : amount > 60 ? "secondary" : "destructive"
  
        if (isTotal) {
          return <Badge variant="outline" className={`font-bold ${isMobile ? 'text-xs px-1' : ''}`}>{`${amount}%`}</Badge>
        }
        
        return <Badge variant={variant} className={isMobile ? 'text-xs px-1' : ''}>{`${amount}%`}</Badge>
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
              <span className={isMobile ? "text-xs" : ""}>Czas oczekiwania</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const czasOczekiwania = row.getValue("czasOczekiwania") as string;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
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
              <span className={isMobile ? "text-xs" : ""}>Średni czas rozmów</span>
              <ArrowUpDown className={`ml-2 ${isMobile ? "h-3 w-3" : "h-4 w-4"}`} />
            </Button>
          )
        },
      cell: ({ row }) => {
        const srednyCzasRozmowy = row.getValue("srednyCzasRozmowy") as string;
        const isTotal = row.original.isTotal;
   
        return (
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
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
          <div className={`${isTotal ? 'font-bold' : ''} ${isMobile ? 'text-xs' : ''}`}>
            {polaczenia}
          </div>
        )
      },
      size: isMobile ? 80 : 100,
    },
  ];

  // Add prediction column if enabled
  if (showPredictions) {
    const predictionColumn: ColumnDef<ExtendedCampaignData> = {
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
          return <div className={`text-center font-bold ${isMobile ? 'text-xs' : ''}`}>-</div>;
        }

        if (!prediction || prediction.predictedTotalCalls < 0) {
          return <div className={`text-center ${isMobile ? 'text-xs' : ''}`}>-</div>;
        }
        
        const progress = (polaczenia / prediction.predictedTotalCalls) * 100;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                  <div className="w-full px-1">
                      <div className={`flex justify-between mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span>{polaczenia}</span>
                          <span className="font-bold">{prediction.predictedTotalCalls}</span>
                      </div>
                      <Progress value={progress} className={`w-full ${isMobile ? 'h-1' : 'h-2'}`} />
                  </div>
              </TooltipTrigger>
              <TooltipContent className="bg-background border-primary">
                <p>{`Progres: ${progress.toFixed(1)}%`}</p>
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
    
    return allColumns.filter(col => 
      typeof col.accessorKey === 'string' && essentialColumns.includes(col.accessorKey)
    );
  } else if (isTablet) {
    // For tablet, hide some less critical columns
    const hiddenColumns = ["srednyCzasRozmowy"];
    return allColumns.filter(col => 
      !col.accessorKey || !hiddenColumns.includes(col.accessorKey as string)
    );
  }

  // Desktop - show all columns
  return allColumns;
};
