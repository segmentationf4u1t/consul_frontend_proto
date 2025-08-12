'use client'

import { useEffect, useState, useMemo } from 'react'
import { API_BASE_URL, withAuth } from '@/lib/api-config'
import type { CampaignPredictionVariance } from '@/types/predictions'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

function MiniOverlay({ days }: { days: { day: string; predicted: number; actual: number }[] }) {
  if (!days || days.length === 0) return null
  const width = 200
  const height = 60
  const padding = 6
  const xs = days.map((_, i) => i)
  const minVal = Math.min(...days.flatMap(d => [d.predicted, d.actual]))
  const maxVal = Math.max(...days.flatMap(d => [d.predicted, d.actual]))
  const range = maxVal - minVal || 1
  const step = (width - padding * 2) / Math.max(1, days.length - 1)
  const mapY = (v: number) => height - padding - ((v - minVal) / range) * (height - padding * 2)
  const predPoints = xs.map((i) => `${padding + i * step},${mapY(days[i].predicted)}`).join(' ')
  const actPoints = xs.map((i) => `${padding + i * step},${mapY(days[i].actual)}`).join(' ')
  return (
    <svg width={width} height={height} aria-hidden className="text-muted-foreground/70">
      <polyline fill="none" stroke="currentColor" strokeWidth="1" points={predPoints} />
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={actPoints} />
    </svg>
  )
}

export function CampaignVarianceMini({ campaign }: { campaign: string }) {
  const [data, setData] = useState<CampaignPredictionVariance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/predictions/variance/${encodeURIComponent(campaign)}`, withAuth())
        if (!res.ok) throw new Error('Failed to load variance')
        const json = (await res.json()) as CampaignPredictionVariance
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [campaign])

  const mape = data?.mape ?? null
  const days = useMemo(() => (data?.days ?? []).slice().reverse(), [data])

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Prognoza vs Rzeczywiste</span>
        <div className="flex items-center gap-1">
          <span className="font-mono">{loading ? '…' : mape === null ? 'brak' : `${mape.toFixed(1)}%`}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label="Co oznacza ten procent?" className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" align="end" className="max-w-xs">
                <div className="space-y-1">
                  <p className="text-xs"><span className="font-semibold">Procent</span>: to MAPE (średni bezwzględny błąd procentowy) między prognozą a rzeczywistą liczbą połączeń dla ostatnich dni. 0% oznacza idealne dopasowanie; np. 10% to średnio o 10% odchylenia.</p>
                  <p className="text-xs"><span className="font-semibold">Mini‑overlay</span>: dwie linie dla kolejnych dni (najnowszy po prawej) — szara: prognoza, kolor: rzeczywiste. Oś Y jest automatycznie przeskalowana do zakresu wartości w tym oknie.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <MiniOverlay days={days} />
    </div>
  )
}


