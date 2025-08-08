"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL, withAuth } from '@/lib/api-config'
import type { CampaignHistoricalSummary as Summary } from '@/types/historical'

interface UseCampaignSummariesOptions {
  refreshMs?: number
}

export function useCampaignSummaries(campaigns?: string[], options?: UseCampaignSummariesOptions) {
  const [summaries, setSummaries] = useState<Map<string, Summary>>(new Map())
  const [loading, setLoading] = useState(false)
  const inflight = useRef<Set<string>>(new Set())

  const refreshIntervalMs = options?.refreshMs ?? 60_000
  const wanted = useMemo(() => Array.from(new Set(campaigns ?? [])), [campaigns])

  const fetchSummaries = useCallback(async (names: string[]) => {
    const toFetch = names.filter((c) => !inflight.current.has(c))
    if (toFetch.length === 0) return
    toFetch.forEach((c) => inflight.current.add(c))
    try {
      const results = await Promise.allSettled(
        toFetch.map(async (c) => {
          const res = await fetch(`${API_BASE_URL}/historical/campaigns/summary/${encodeURIComponent(c)}`, withAuth())
          if (!res.ok) throw new Error('Failed summary')
          const json = (await res.json()) as Summary
          return { campaign: c, summary: json }
        })
      )
      setSummaries((prev) => {
        const next = new Map(prev)
        for (const r of results) {
          if (r.status === 'fulfilled') {
            next.set(r.value.campaign, r.value.summary)
          }
        }
        return next
      })
    } finally {
      toFetch.forEach((c) => inflight.current.delete(c))
    }
  }, [])

  // Initial fetch for missing campaigns
  useEffect(() => {
    let cancelled = false
    const missing = wanted.filter((c) => !summaries.has(c) && !inflight.current.has(c))
    if (missing.length === 0) return
    setLoading(true)
    ;(async () => {
      try {
        await fetchSummaries(missing)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted.join('|')])

  // Periodic refresh for all wanted campaigns
  useEffect(() => {
    if (wanted.length === 0) return
    const id = setInterval(() => {
      fetchSummaries(wanted)
    }, refreshIntervalMs)
    return () => clearInterval(id)
  }, [fetchSummaries, refreshIntervalMs, wanted.join('|')])

  const refetch = useCallback(() => fetchSummaries(wanted), [fetchSummaries, wanted])

  return { summaries, loading, refetch }
}


