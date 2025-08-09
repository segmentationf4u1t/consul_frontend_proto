'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { WallboardData, CampaignData } from '@/types/wallboard'
import { cn } from '@/lib/utils'

interface SlaKpiPanelProps {
  data: WallboardData | null
  className?: string
}

function timeStringToSeconds(timeStr: string | undefined): number {
  if (!timeStr || timeStr === '0' || timeStr === '-') return 0
  const parts = timeStr.split(':').map(p => parseInt(p, 10) || 0)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] ?? 0
}

function secondsToClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'
  const s = Math.round(seconds)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export const SlaKpiPanel = memo(({ data, className }: SlaKpiPanelProps) => {
  const KPIs = useMemo(() => {
    const campaigns: CampaignData[] = data?.campaigns ?? []
    const totalPolaczenia = campaigns.reduce((sum, c) => sum + (c.polaczenia || 0), 0)
    const totalOdebrane = campaigns.reduce((sum, c) => sum + (c.odebrane || 0), 0)

    // Weighted ASA by total calls offered (polaczenia)
    const totalWaitWeightedSeconds = campaigns.reduce(
      (sum, c) => sum + timeStringToSeconds(c.czasOczekiwania) * (c.polaczenia || 0),
      0
    )
    const asaSeconds = totalPolaczenia > 0 ? totalWaitWeightedSeconds / totalPolaczenia : 0
    const answerRate = totalPolaczenia > 0 ? (totalOdebrane / totalPolaczenia) * 100 : 0
    const abandonRate = 100 - answerRate

    // Simple SL 80/30 proxy: pass if ASA <= 30s and answer rate >= 80%
    const slTargetSeconds = 30
    const slTargetAnswerPct = 80
    const slPass = asaSeconds <= slTargetSeconds && answerRate >= slTargetAnswerPct

    return {
      asaSeconds,
      answerRate,
      abandonRate,
      slPass,
      slTargetSeconds,
      slTargetAnswerPct
    }
  }, [data])

  const kpiClass = (good: boolean, warn?: boolean) =>
    cn(
      'rounded-lg border p-3 min-w-0',
      good ? 'border-green-600/40 bg-green-500/5' : warn ? 'border-yellow-600/40 bg-yellow-500/5' : 'border-destructive/40 bg-destructive/5'
    )

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 text-xs', className)}>
      <Card className={kpiClass(KPIs.asaSeconds <= KPIs.slTargetSeconds, KPIs.asaSeconds <= KPIs.slTargetSeconds + 10)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Czas oczekiwania</div>
          <div className="text-sm font-semibold">{secondsToClock(KPIs.asaSeconds)}</div>
          <div className="text-[10px] text-muted-foreground">cel ≤ {secondsToClock(KPIs.slTargetSeconds)}</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.slPass, !KPIs.slPass && KPIs.answerRate >= KPIs.slTargetAnswerPct - 5)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">SL 80/30</div>
          <div className="text-sm font-semibold">{KPIs.slPass ? 'OK' : 'Ryzyko'}</div>
          <div className="text-[10px] text-muted-foreground">Czas oczekiwania ≤ {KPIs.slTargetSeconds}s & odebrane ≥ {KPIs.slTargetAnswerPct}%</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.answerRate >= KPIs.slTargetAnswerPct, KPIs.answerRate >= KPIs.slTargetAnswerPct - 5)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Odebrane połączenia %</div>
          <div className="text-sm font-semibold">{KPIs.answerRate.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">cel ≥ {KPIs.slTargetAnswerPct}%</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.abandonRate <= 5, KPIs.abandonRate <= 10)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Zignorowane połączenia %</div>
          <div className="text-sm font-semibold">{Math.max(0, KPIs.abandonRate).toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">Cel ≤ 5%</div>
        </CardContent>
      </Card>
    </div>
  )
})

SlaKpiPanel.displayName = 'SlaKpiPanel'


