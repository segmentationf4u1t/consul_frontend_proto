'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignPrediction } from '@/types/predictions';
import { CampaignData } from '@/types/wallboard';

export const usePredictions = (campaigns: CampaignData[] | undefined) => {
  const [predictions, setPredictions] = useState<Map<string, CampaignPrediction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrediction = useCallback(async (campaignName: string) => {
    try {
      const response = await fetch(`http://0.0.0.0:3001/predictions/campaigns/${encodeURIComponent(campaignName)}`);
      if (!response.ok) {
        throw new Error(`Prediction fetch failed with status: ${response.status}`);
      }
      const data: CampaignPrediction = await response.json();
      setPredictions(prev => new Map(prev).set(campaignName, data));
    } catch (error) {
      console.error(`Failed to fetch prediction for ${campaignName}:`, error);
    }
  }, []);

  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchAllPredictions = async () => {
      setIsLoading(true);
      await Promise.all(campaigns.map(c => fetchPrediction(c.kampanie)));
      setIsLoading(false);
    };

    fetchAllPredictions();

    const interval = setInterval(fetchAllPredictions, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [campaigns, fetchPrediction]);

  return { predictions, isLoading };
};
