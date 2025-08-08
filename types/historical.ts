export interface CampaignHistoricalSummary {
  campaign: string
  oldestUTC: string | null
  newestUTC: string | null
  totalRecords: number
  daysTracked: number
  peakDailyTotal: number | null
  peakDailyDateLocal: string | null
  recentDailyTotals: { dateLocal: string; total: number }[]
  avgDailyTotal: number | null
  medianDailyTotal: number | null
  weekdayAverages: { weekday: number; avgTotal: number }[]
  weekdayTotals: { weekday: number; total: number }[]
  coverage: { avgRowsPerDay: number; daysWithAtLeast: number; threshold: number }
}


