export interface CampaignPrediction {
  campaign: string;
  predictedTotalCalls: number;
  currentCalls: number;
  modelUsed: string;
  lastUpdated: string;
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
