'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '@/lib/api-config'
import type { CampaignHistoricalSummary as Summary } from '@/types/historical'

export function useCampaignSummaries(campaigns?: string[]) {
  const [summaries, setSummaries] = useState<Map<string, Summary>>(new Map())
  const [loading, setLoading] = useState(false)
  const inflight = useRef<Set<string>>(new Set())

  const wanted = useMemo(() => Array.from(new Set(campaigns ?? [])), [campaigns])

  useEffect(() => {
    let cancelled = false
    const missing = wanted.filter((c) => !summaries.has(c) && !inflight.current.has(c))
    if (missing.length === 0) return
    setLoading(true)
    missing.forEach((c) => inflight.current.add(c))
    ;(async () => {
      try {
        const results = await Promise.allSettled(
          missing.map(async (c) => {
            const res = await fetch(`${API_BASE_URL}/historical/campaigns/summary/${encodeURIComponent(c)}`)
            if (!res.ok) throw new Error('Failed summary')
            const json = (await res.json()) as Summary
            return { campaign: c, summary: json }
          })
        )
        if (cancelled) return
        const next = new Map(summaries)
        for (const r of results) {
          if (r.status === 'fulfilled') {
            next.set(r.value.campaign, r.value.summary)
          }
        }
        setSummaries(next)
      } finally {
        missing.forEach((c) => inflight.current.delete(c))
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [wanted.join('|')])

  return { summaries, loading }
}


