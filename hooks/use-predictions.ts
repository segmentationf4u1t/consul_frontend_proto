'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignPrediction, OfficialPrediction } from '@/types/predictions';
import { CampaignData } from '@/types/wallboard';

import { API_BASE_URL, withAuth } from '@/lib/api-config';
import { fetchOfficialPrediction } from '@/lib/api-predictions';

function getWarsawHour(): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    hour: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  return Number.isFinite(h) ? h : 0;
}

export const usePredictions = (campaigns: CampaignData[] | undefined) => {
  const [predictions, setPredictions] = useState<Map<string, CampaignPrediction>>(new Map());
  const [official0800, setOfficial0800] = useState<Map<string, OfficialPrediction>>(new Map());
  const [official1200, setOfficial1200] = useState<Map<string, OfficialPrediction>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrediction = useCallback(async (campaignName: string) => {
    try {
      const hour = getWarsawHour();
      // Prefer official predictions after their generation times
      if (hour >= 12) {
        try {
          const off = await fetchOfficialPrediction(campaignName, 'official_1200');
          setOfficial1200(prev => new Map(prev).set(campaignName, off));
          const normalized: CampaignPrediction = {
            campaign: off.campaign,
            predictedTotalCalls: off.predictedTotalCalls,
            currentCalls: off.currentCalls,
            modelUsed: 'official_1200',
            lastUpdated: off.timestamp,
          };
          setPredictions(prev => new Map(prev).set(campaignName, normalized));
          return normalized;
        } catch {}
      }
      if (hour >= 8) {
        try {
          const off = await fetchOfficialPrediction(campaignName, 'official_0800');
          setOfficial0800(prev => new Map(prev).set(campaignName, off));
          const normalized: CampaignPrediction = {
            campaign: off.campaign,
            predictedTotalCalls: off.predictedTotalCalls,
            currentCalls: off.currentCalls,
            modelUsed: 'official_0800',
            lastUpdated: off.timestamp,
          };
          setPredictions(prev => new Map(prev).set(campaignName, normalized));
          return normalized;
        } catch {}
      }

      // Fallback to dynamic prediction endpoint
      const response = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(campaignName)}` , withAuth());
      if (!response.ok) throw new Error(`Prediction fetch failed with status: ${response.status}`);
      const data: CampaignPrediction = await response.json();
      setPredictions(prev => new Map(prev).set(campaignName, data));
      return data;
    } catch (error) {
      console.error(`Failed to fetch prediction for ${campaignName}:`, error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAllPredictions = async () => {
      if (!isMounted) return;

      setIsLoading(true);

      const campaignNames = campaigns.map(c => c.kampanie);

      try {
        const newPredictions = new Map<string, CampaignPrediction>();
        for (const campaignName of campaignNames) {
          if (!isMounted) break;
          try {
            const hour = getWarsawHour();
            let data: CampaignPrediction | null = null;
            if (hour >= 12) {
              try {
                const off = await fetchOfficialPrediction(campaignName, 'official_1200');
                setOfficial1200(prev => new Map(prev).set(campaignName, off));
                data = {
                  campaign: off.campaign,
                  predictedTotalCalls: off.predictedTotalCalls,
                  currentCalls: off.currentCalls,
                  modelUsed: 'official_1200',
                  lastUpdated: off.timestamp,
                };
              } catch {}
            }
            if (!data && hour >= 8) {
              try {
                const off = await fetchOfficialPrediction(campaignName, 'official_0800');
                setOfficial0800(prev => new Map(prev).set(campaignName, off));
                data = {
                  campaign: off.campaign,
                  predictedTotalCalls: off.predictedTotalCalls,
                  currentCalls: off.currentCalls,
                  modelUsed: 'official_0800',
                  lastUpdated: off.timestamp,
                };
              } catch {}
            }
            if (!data) {
              const response = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(campaignName)}`, withAuth());
              if (!response.ok) throw new Error(`Prediction fetch failed with status: ${response.status}`);
              data = await response.json();
            }
            newPredictions.set(campaignName, data!);
            setPredictions(prev => {
              const next = new Map(prev);
              next.set(campaignName, data!);
              return next;
            });
          } catch (e) {
            console.error(`Failed to fetch prediction for ${campaignName}:`, e);
          }
          // Small delay to avoid CPU/memory spikes on low-RAM devices
          await new Promise(res => setTimeout(res, 150));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllPredictions();

    const interval = setInterval(fetchAllPredictions, 480000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [campaigns]);

  const refreshPrediction = useCallback(async (campaignName: string) => {
    // simple targeted refresh via existing GET endpoint
    return fetchPrediction(campaignName);
  }, [fetchPrediction]);

  return { predictions, isLoading, refreshPrediction };
};
