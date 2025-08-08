'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { GlobalForecastHealth } from '@/types/predictions'
import { API_BASE_URL, withAuth } from '@/lib/api-config'
import { cn } from '@/lib/utils'

function valueClass(mape: number | null | undefined): string {
  if (mape === null || mape === undefined) return 'text-muted-foreground'
  if (mape <= 10) return 'text-green-600 dark:text-green-400'
  if (mape <= 20) return 'text-blue-600 dark:text-blue-400'
  if (mape <= 35) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-destructive'
}

export function ForecastHealth({ className }: { className?: string }) {
  const [data, setData] = useState<GlobalForecastHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE_URL}/predictions/variance`, withAuth())
        if (!res.ok) throw new Error('Failed to load forecast health')
        const json = (await res.json()) as GlobalForecastHealth
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const mape = data?.mape ?? null

  // Compact badge-like card aligned with design system
  return (
    <Card className={className}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">Jakość prognoz (MAPE)</div>
          <div className={cn('text-sm font-semibold', valueClass(mape))}>
            {loading ? '…' : mape === null ? 'brak' : `${mape.toFixed(1)}%`}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">niżej = lepiej</div>
      </CardContent>
    </Card>
  )
}


