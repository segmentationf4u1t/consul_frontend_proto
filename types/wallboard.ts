export interface CampaignData {
  kampanie: string;
  zalogowani: number;
  gotowi: number;
  kolejka: number;
  odebrane: number;
  odebranePercent: number;
  czasOczekiwania: string;
  srednyCzasRozmowy: string;
  polaczenia: number;
}

export interface WallboardData {
  // Panel data
  kolejka?: number;
  zalogowani?: number;
  gotowi?: number;
  przerwa?: number;
  niedostepni?: number;
  rozmawiaja?: number;
  
  // Campaign table data
  campaigns?: CampaignData[];
  
  // Metadata
  timestamp?: string;
  source?: string;
}

export interface WallboardResponse {
  tip?: WallboardData;
  energa?: WallboardData;
  errors?: string[];
}