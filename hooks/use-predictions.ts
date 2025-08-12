'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignPrediction } from '@/types/predictions';
import { CampaignData } from '@/types/wallboard';

import { API_BASE_URL, withAuth } from '@/lib/api-config';

export const usePredictions = (campaigns: CampaignData[] | undefined) => {
  const [predictions, setPredictions] = useState<Map<string, CampaignPrediction>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrediction = useCallback(async (campaignName: string) => {
    try {
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
            const response = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(campaignName)}`, withAuth());
            if (!response.ok) throw new Error(`Prediction fetch failed with status: ${response.status}`);
            const data: CampaignPrediction = await response.json();
            newPredictions.set(campaignName, data);
            setPredictions(prev => {
              const next = new Map(prev);
              next.set(campaignName, data);
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
