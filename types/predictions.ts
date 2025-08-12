export interface CampaignPrediction {
  campaign: string;
  predictedTotalCalls: number;
  currentCalls: number;
  modelUsed: string;
  lastUpdated: string;
  // Optional predictive intervals when available (e.g., Prophet)
  p80Low?: number;
  p80High?: number;
}

export interface OfficialPrediction {
  campaign: string;
  predictedTotalCalls: number;
  currentCalls: number;
  trendMultiplier: number;
  predictionType: 'official_0800' | 'official_1200' | string;
  timestamp: string; // ISO
}

export interface CampaignVarianceDay {
  day: string;
  predicted: number;
  actual: number;
  ape: number;
}

export interface CampaignPredictionVariance {
  campaign: string;
  days: CampaignVarianceDay[];
  mape: number | null;
}

export interface GlobalForecastHealth {
  mape: number | null;
  campaigns: { campaign: string; mape: number | null }[];
}
