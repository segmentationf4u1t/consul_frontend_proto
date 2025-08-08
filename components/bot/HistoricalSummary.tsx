'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL, withAuth } from '@/lib/api-config'
import { cn } from '@/lib/utils'
import type { CampaignHistoricalSummary as Summary } from '@/types/historical'

// Type moved to '@/types/historical'

interface HistoricalSummaryProps {
  campaign: string
  className?: string
  onSummaryLoaded?: (summary: Summary) => void
  density?: 'normal' | 'compact'
}

export default function HistoricalSummary({ campaign, className, onSummaryLoaded, density = 'normal' }: HistoricalSummaryProps) {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const compact = density === 'compact'

  useEffect(() => {
    let cancelled = false
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/historical/campaigns/summary/${encodeURIComponent(campaign)}`, withAuth())
        if (!res.ok) throw new Error('Failed to load summary')
        const json = (await res.json()) as Summary
        if (!cancelled) {
          setData(json)
          if (onSummaryLoaded) onSummaryLoaded(json)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSummary()
    const id = setInterval(fetchSummary, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [campaign])

  const period = useMemo(() => {
    if (!data?.oldestUTC || !data?.newestUTC) return '—'
    const a = new Date(data.oldestUTC)
    const b = new Date(data.newestUTC)
    const days = Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
    return `${days} dni`
  }, [data])

  const weekdayNames = ['Nd','Pn','Wt','Śr','Cz','Pt','So']

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className={cn('flex items-center gap-2 text-muted-foreground min-w-0', compact ? 'text-[10px]' : 'text-xs')}>
            <Badge variant="outline" className={cn('px-2 py-0.5', compact ? 'text-[10px]' : 'text-[11px]')}>Historia</Badge>
            <span className="font-mono truncate">{campaign}</span>
          </div>
          <div className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>{loading ? '…' : `${period}`}</div>
        </div>

        {error && (
          <div className="text-[12px] text-destructive">{error}</div>
        )}

        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Metric label="Najstarszy" value={data?.oldestUTC ? new Date(data.oldestUTC).toLocaleString('pl-PL') : '—'} mono />
            <Metric label="Najnowszy" value={data?.newestUTC ? new Date(data.newestUTC).toLocaleString('pl-PL') : '—'} mono />
            <Metric label="Rekordy" value={fmt(data?.totalRecords)} mono />
            <Metric label="Liczba dni" value={fmt(data?.daysTracked)} mono />
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
          <div className="rounded-md border p-3 overflow-hidden">
            <div className={cn('text-muted-foreground mb-1', compact ? 'text-[10px]' : 'text-[11px]')}>Szczyt dzienny</div>
            <div className={cn('flex items-center justify-between gap-2 min-w-0', compact ? 'text-xs' : 'text-sm')}>
              <span className="font-semibold flex-shrink-0">{fmtExact(data?.peakDailyTotal)}</span>
              <span className="text-muted-foreground truncate text-xs">{data?.peakDailyDateLocal ?? ''}</span>
            </div>
            <div className={cn('mt-3 grid grid-cols-2 gap-2', compact ? 'text-[10px]' : 'text-xs')}>
              <Metric label="Średnia/dzień" value={fmtFloat(data?.avgDailyTotal)} small={compact} />
              <Metric label="Mediana/dzień" value={fmtFloat(data?.medianDailyTotal)} small={compact} />
            </div>
          </div>

          <div className="rounded-md border p-3 overflow-hidden">
            <div className={cn('text-muted-foreground mb-1', compact ? 'text-[10px]' : 'text-[11px]')}>Suma wg dni tygodnia</div>
            <div className={cn('grid grid-cols-3 gap-1 min-w-0', compact ? 'text-[10px]' : 'text-[11px]')}>
              {(data?.weekdayTotals?.length ? data.weekdayTotals : data?.weekdayAverages?.map(a => ({ weekday: a.weekday, total: a.avgTotal })) ?? [])
                .map((w: { weekday: number; total: number }) => (
                <div key={w.weekday} className="flex items-center justify-between bg-muted/40 rounded px-1.5 py-0.5 min-w-0 gap-1">
                  <span className="text-muted-foreground truncate">{weekdayNames[w.weekday]}</span>
                  <span className={cn('font-mono flex-shrink-0', compact ? 'text-[10px]' : 'text-[11px]')}>{fmt(w.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3 overflow-hidden">
            <div className={cn('text-muted-foreground mb-1', compact ? 'text-[10px]' : 'text-[11px]')}>Pokrycie danych</div>
            <div className={cn('space-y-1 min-w-0', compact ? 'text-[10px]' : 'text-xs')}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-muted-foreground truncate">Śr. wierszy/dzień</span>
                <span className="font-mono flex-shrink-0">{Math.round(data?.coverage.avgRowsPerDay ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-muted-foreground truncate">Dni ≥ {data?.coverage.threshold}</span>
                <span className="font-mono flex-shrink-0">{data?.coverage.daysWithAtLeast ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>Ostatnie sumy dzienne</div>
            <Sparkline values={data?.recentDailyTotals?.map(d => d.total) ?? []} />
          </div>
          <div className="flex flex-wrap gap-1 min-w-0">
            {data?.recentDailyTotals?.map((d) => (
              <div key={d.dateLocal} className={cn('px-1.5 py-0.5 rounded bg-muted/50', compact ? 'text-[10px]' : 'text-[11px]')}>
                <span className="font-mono">{d.dateLocal}</span>
                <span className="mx-1">•</span>
                <span className="font-mono">{d.total}</span>
              </div>
            )) || <span className="text-[12px] text-muted-foreground">—</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln'
  if (n >= 1_000) return Math.round(n / 1_000) + ' tys'
  return String(n)
}

function fmtExact(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pl-PL').format(n)
}

function fmtFloat(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n)
}

function Metric({ label, value, mono, small }: { label: string; value: string | number; mono?: boolean; small?: boolean }) {
  return (
    <div className="space-y-1">
      <div className={cn('text-muted-foreground', small ? 'text-[10px]' : 'text-[11px]')}>{label}</div>
      <div className={cn(mono ? 'font-mono' : '', small ? 'text-xs' : 'text-sm')}>{value}</div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length === 0) return null
  const width = 120
  const height = 28
  const padding = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (width - padding * 2) / Math.max(1, values.length - 1)
  const points = values
    .map((v, i) => {
      const x = padding + i * step
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} aria-hidden className="text-muted-foreground/60">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  )
}


