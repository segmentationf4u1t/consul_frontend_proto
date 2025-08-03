"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CampaignData } from "@/types/wallboard"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle } from "lucide-react"

import { toZonedTime } from "date-fns-tz"

export const columns: ColumnDef<CampaignData>[] = [
  {
    accessorKey: "kampanie",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kampania
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const kampanie = row.getValue("kampanie") as string;
      const zalogowani = row.getValue("zalogowani") as number;
      
      const now = new Date();
      const timeZone = 'Europe/Warsaw';
      const zonedNow = toZonedTime(now, timeZone);
      const dayOfWeek = zonedNow.getDay();
      const hour = zonedNow.getHours();

      const isWorkingHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 7 && hour < 22;

      const isTipCampaign = kampanie === 'TIP_Ogolna_PL';
      const showWarning = isTipCampaign && zalogowani === 1 && isWorkingHours;

      return (
        <div className="flex items-center gap-2">
          {zalogowani === 0 && <div className="h-4 w-1 rounded-full bg-red-500 animate-pulse-slow" />}
          
          {showWarning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent className="bg-background border-primary">
                  <p className="font-bold">Uwaga na obsadę!</p>
                  <p>Jedyna osoba na kampanii TIP_Ogolna_PL jest aktywna jedynie na Mailach.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {kampanie}
        </div>
      )
    },
  },
  {
    accessorKey: "zalogowani",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Zalogowani
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      const zalogowani = parseFloat(row.getValue("zalogowani"))
 
      return (
        <div className="flex items-center gap-2">
          {zalogowani}
        </div>
      )
    },
  },
  {
    accessorKey: "gotowi",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Gotowi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "kolejka",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Kolejka
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "odebrane",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Odebrane
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "odebranePercent",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Odebrane %
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("odebranePercent"))
      const variant = amount > 80 ? "default" : amount > 60 ? "secondary" : "destructive"

      return <Badge variant={variant}>{`${amount}%`}</Badge>
    }
  },
  {
    accessorKey: "czasOczekiwania",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Czas oczekiwania
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "srednyCzasRozmowy",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Średni czas rozmów
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "polaczenia",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Połączenia
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
]
