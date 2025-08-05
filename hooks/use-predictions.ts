'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignPrediction } from '@/types/predictions';
import { CampaignData } from '@/types/wallboard';

import { API_BASE_URL } from '@/lib/api-config';

export const usePredictions = (campaigns: CampaignData[] | undefined) => {
  // TEMPORARILY DISABLED - Return empty state without API calls
  const [predictions] = useState<Map<string, CampaignPrediction>>(new Map());
  const [isLoading] = useState(false);

  /* TEMPORARILY DISABLED - All prediction fetching functionality
  const fetchPrediction = useCallback(async (campaignName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(campaignName)}`);
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

    let isMounted = true; // Prevent state updates if component unmounted

    const fetchAllPredictions = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      
      // Create campaign names array to avoid dependency on fetchPrediction
      const campaignNames = campaigns.map(c => c.kampanie);
      
      try {
        const promises = campaignNames.map(async (campaignName) => {
          const response = await fetch(`${API_BASE_URL}/predictions/campaigns/${encodeURIComponent(campaignName)}`);
          if (!response.ok) {
            throw new Error(`Prediction fetch failed with status: ${response.status}`);
          }
          const data: CampaignPrediction = await response.json();
          return { campaignName, data };
        });

        const results = await Promise.all(promises);
        
        if (isMounted) {
          const newPredictions = new Map<string, CampaignPrediction>();
          results.forEach(({ campaignName, data }) => {
            newPredictions.set(campaignName, data);
          });
          setPredictions(newPredictions);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllPredictions();

    const interval = setInterval(fetchAllPredictions, 60000); // Refresh every 60 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [campaigns]); // Removed fetchPrediction from dependencies
  */

  return { predictions, isLoading };
};
