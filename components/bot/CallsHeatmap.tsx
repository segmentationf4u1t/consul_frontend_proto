'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { API_BASE_URL, withAuth } from '@/lib/api-config'
import { cn } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'
import { pl } from 'date-fns/locale'

type CallsPoint = { id: number; timestamp: string; totalCalls: number }
type CallsPage = { items: CallsPoint[]; nextCursor: { ts: string; id: number } | null }

const TIME_ZONE = 'Europe/Warsaw'

interface CallsHeatmapProps {
  className?: string
  days?: number // how many most recent days to show
}

/**
 * Heatmap of total calls per hour × day.
 * Aggregates data from /historical/calls into hourly buckets per day in local timezone.
 */
export function CallsHeatmap({ className, days = 14 }: CallsHeatmapProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<Array<{ ts: number; timestamp: string; totalCalls: number }>>([])
  const firstLoadDoneRef = useRef(false)
  const [isDark, setIsDark] = useState(false)
  // Simple white → red scale (reverted per request)

  const cutoffMs = useMemo(() => {
    const now = Date.now()
    return now - days * 24 * 3600_000
  }, [days])

  const fetchAll = async () => {
    try {
      setError(null)
      if (!firstLoadDoneRef.current) setLoading(true)
      else setRefreshing(true)

      const PAGE_SIZE = 1000
      const MAX_PAGES = 400
      const fromISO = new Date(cutoffMs).toISOString()

      let url = `${API_BASE_URL}/historical/calls?limit=${PAGE_SIZE}&from=${encodeURIComponent(fromISO)}`
      let nextCursor: CallsPage['nextCursor'] | null = null
      let acc: Array<{ ts: number; timestamp: string; totalCalls: number }> = []
      let pageCount = 0

      do {
        const res = await fetch(url, withAuth())
        if (!res.ok) throw new Error(`Failed to fetch (status ${res.status})`)
        const page: CallsPage = await res.json()

        const mapped = page.items
          .map((r) => {
            const ts = new Date(r.timestamp).getTime()
            if (!Number.isFinite(ts)) return null
            return { ts, timestamp: r.timestamp, totalCalls: Number(r.totalCalls ?? 0) }
          })
          .filter((x): x is { ts: number; timestamp: string; totalCalls: number } => !!x)

        acc = acc.concat(mapped)

        nextCursor = page.nextCursor
        if (nextCursor) {
          const nextTsMs = new Date(nextCursor.ts).getTime()
          if (!Number.isFinite(nextTsMs) || nextTsMs <= cutoffMs) nextCursor = null
        }
        if (nextCursor) {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            from: fromISO,
            cursorTs: nextCursor.ts,
            cursorId: String(nextCursor.id),
          })
          url = `${API_BASE_URL}/historical/calls?${params.toString()}`
        }

        pageCount += 1
        if (pageCount >= MAX_PAGES) nextCursor = null
      } while (nextCursor)

      const sorted = acc.sort((a, b) => a.ts - b.ts)
      setPoints(sorted)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load heatmap')
    } finally {
      setLoading(false)
      setRefreshing(false)
      firstLoadDoneRef.current = true
    }
  }

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 60_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  // Track dark mode (supports class-based themes and system preference)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark')
      setIsDark(hasDarkClass || mql.matches)
    }
    update()
    mql.addEventListener('change', update)
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      mql.removeEventListener('change', update)
      obs.disconnect()
    }
  }, [])

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rgbToCss = (r: number, g: number, b: number) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`

  // Aggregate into day × hour buckets in local timezone
  type BucketAgg = { sum: number; count: number; max: number }
  const { rows, dayLabels, globalMin, globalMax } = useMemo(() => {
    const dayToHourAgg = new Map<string, Map<number, BucketAgg>>()
    for (const p of points) {
      const d = new Date(p.ts)
      const dateKey = formatInTimeZone(d, TIME_ZONE, 'yyyy-MM-dd')
      const hour = Number(formatInTimeZone(d, TIME_ZONE, 'H'))
      let hoursMap = dayToHourAgg.get(dateKey)
      if (!hoursMap) {
        hoursMap = new Map()
        dayToHourAgg.set(dateKey, hoursMap)
      }
      const agg = hoursMap.get(hour) ?? { sum: 0, count: 0, max: 0 }
      agg.sum += p.totalCalls
      agg.count += 1
      if (p.totalCalls > agg.max) agg.max = p.totalCalls
      hoursMap.set(hour, agg)
    }

    // Build rows for last N days only
    const dates = Array.from(dayToHourAgg.keys()).sort((a, b) => (a < b ? 1 : -1))
    const limitedDates = dates.slice(0, days)
    const labels = limitedDates
    const matrix: number[][] = []
    let gMin = Number.POSITIVE_INFINITY
    let gMax = 0
    const positives: number[] = []
    for (const dateKey of limitedDates) {
      const hoursMap = dayToHourAgg.get(dateKey)!
      const row: number[] = []
      for (let h = 0; h < 24; h++) {
        const agg = hoursMap.get(h)
        const val = agg ? Math.round(agg.sum / Math.max(1, agg.count)) : -1 // -1 indicates missing
        row.push(val)
        if (val >= 0) {
          if (val < gMin) gMin = val
          if (val > gMax) gMax = val
          // positives removed in simplified scale
        }
      }
      matrix.push(row)
    }
    if (!Number.isFinite(gMin)) gMin = 0
    return { rows: matrix, dayLabels: labels, globalMin: gMin, globalMax: gMax }
  }, [points, days])

  const colorFor = (value: number) => {
    if (value < 0) return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    if (globalMax === globalMin) return '#ef4444'
    const t = (value - globalMin) / Math.max(1e-6, globalMax - globalMin)
    const from: [number, number, number] = [255, 255, 255] // white
    const to: [number, number, number] = [239, 68, 68] // tailwind red-500
    const r = lerp(from[0], to[0], clamp01(t))
    const g = lerp(from[1], to[1], clamp01(t))
    const b = lerp(from[2], to[2], clamp01(t))
    return rgbToCss(r, g, b)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  if (loading && !firstLoadDoneRef.current) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Heatmap połączeń</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-destructive font-medium">Błąd ładowania</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchAll}>
              Spróbuj ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Heatmap połączeń</CardTitle>
            <Badge variant="secondary" className="text-xs">{days} dni</Badge>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && <Badge variant="secondary" className="text-xs">Aktualizuję…</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Brak danych</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header hours */}
              <div className="grid" style={{ gridTemplateColumns: `120px repeat(24, minmax(18px, 1fr))` }}>
                <div />
                {hours.map(h => (
                  <div key={`h-${h}`} className="text-[11px] text-muted-foreground text-center py-1">{h}</div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-1">
                {rows.map((row, idx) => (
                  <div key={dayLabels[idx]} className="grid items-center" style={{ gridTemplateColumns: `120px repeat(24, minmax(18px, 1fr))` }}>
                    <div className="text-xs text-muted-foreground pr-2 truncate">
                      {formatInTimeZone(new Date(dayLabels[idx] + 'T00:00:00'), TIME_ZONE, 'EEE, dd.MM', { locale: pl })}
                    </div>
                    {row.map((val, h) => (
                      <div
                        key={`${dayLabels[idx]}-${h}`}
                        className={cn('h-5 rounded-sm border border-transparent hover:brightness-110 transition', val < 0 ? 'opacity-50' : '')}
                        style={{ backgroundColor: colorFor(val) }}
                        title={`${dayLabels[idx]} ${String(h).padStart(2, '0')}:00 — ${val < 0 ? '—' : val}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Min</span>
                <div className="h-2 w-40 rounded" style={{ background: `linear-gradient(90deg, #ffffff, #ef4444)` }} />
                <span>Max</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CallsHeatmap


