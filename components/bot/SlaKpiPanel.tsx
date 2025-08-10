'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { WallboardData, CampaignData } from '@/types/wallboard'
import { cn } from '@/lib/utils'

interface SlaKpiPanelProps {
  data: WallboardData | null
  className?: string
}

// Targets and thresholds
const SL_TARGET_SECONDS = 30
const SL_TARGET_ANSWER_PCT = 80
const ASA_WARN_DELTA = 10
const ANSWER_WARN_DELTA = 5
const ABANDON_GOOD_PCT = 5
const ABANDON_WARN_PCT = 10

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

    let totalPolaczenia = 0
    let totalOdebrane = 0
    let totalWaitWeightedSeconds = 0

    for (const c of campaigns) {
      const calls = c.polaczenia || 0
      const answered = c.odebrane || 0
      totalPolaczenia += calls
      totalOdebrane += answered
      if (calls > 0) totalWaitWeightedSeconds += timeStringToSeconds(c.czasOczekiwania) * calls
    }

    const asaSeconds = totalPolaczenia > 0 ? totalWaitWeightedSeconds / totalPolaczenia : 0
    const answerRate = totalPolaczenia > 0 ? (totalOdebrane / totalPolaczenia) * 100 : 0
    const abandonRate = Math.max(0, 100 - answerRate)

    const isAverageWaitWithinTarget = asaSeconds <= SL_TARGET_SECONDS
    const isAnswerRateWithinTarget = answerRate >= SL_TARGET_ANSWER_PCT
    const slPass = isAverageWaitWithinTarget && isAnswerRateWithinTarget

    const slStatusText = slPass
      ? 'OK'
      : !isAverageWaitWithinTarget && isAnswerRateWithinTarget
        ? 'Czas oczekiwania do poprawy'
        : isAverageWaitWithinTarget && !isAnswerRateWithinTarget
          ? 'Odebrane do poprawy'
          : 'Czas oczekiwania i odebrane do poprawy'

    return {
      asaSeconds,
      answerRate,
      abandonRate,
      slPass,
      slStatusText,
      slTargetSeconds: SL_TARGET_SECONDS,
      slTargetAnswerPct: SL_TARGET_ANSWER_PCT
    }
  }, [data])

  const kpiClass = (good: boolean, warn?: boolean) =>
    cn(
      'rounded-lg border p-3 min-w-0',
      good ? 'border-green-600/40 bg-green-500/5' : warn ? 'border-yellow-600/40 bg-yellow-500/5' : 'border-destructive/40 bg-destructive/5'
    )

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3 text-xs', className)}>
      <Card className={kpiClass(KPIs.asaSeconds <= KPIs.slTargetSeconds, KPIs.asaSeconds <= KPIs.slTargetSeconds + ASA_WARN_DELTA)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Czas oczekiwania</div>
          <div className="text-sm font-semibold">{secondsToClock(KPIs.asaSeconds)}</div>
          <div className="text-[10px] text-muted-foreground">cel ≤ {secondsToClock(KPIs.slTargetSeconds)}</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.slPass, !KPIs.slPass && KPIs.answerRate >= KPIs.slTargetAnswerPct - 5)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">SL 80/30</div>
          <div className="text-sm font-semibold">{KPIs.slStatusText}</div>
          <div className="text-[10px] text-muted-foreground">Czas oczekiwania ≤ {KPIs.slTargetSeconds}s & odebrane ≥ {KPIs.slTargetAnswerPct}%</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.answerRate >= KPIs.slTargetAnswerPct, KPIs.answerRate >= KPIs.slTargetAnswerPct - ANSWER_WARN_DELTA)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Odebrane połączenia %</div>
          <div className="text-sm font-semibold">{KPIs.answerRate.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">cel ≥ {KPIs.slTargetAnswerPct}%</div>
        </CardContent>
      </Card>
      <Card className={kpiClass(KPIs.abandonRate <= ABANDON_GOOD_PCT, KPIs.abandonRate <= ABANDON_WARN_PCT)}>
        <CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Zignorowane połączenia %</div>
          <div className="text-sm font-semibold">{KPIs.abandonRate.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground">Cel ≤ {ABANDON_GOOD_PCT}%</div>
        </CardContent>
      </Card>
    </div>
  )
})

SlaKpiPanel.displayName = 'SlaKpiPanel'


