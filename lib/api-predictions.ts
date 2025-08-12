import { API_BASE_URL, withAuth } from '@/lib/api-config';
import type { CampaignPrediction, OfficialPrediction } from '@/types/predictions';

export async function generatePrediction(campaign: string): Promise<CampaignPrediction> {
  const res = await fetch(
    `${API_BASE_URL}/predictions/generate/${encodeURIComponent(campaign)}`,
    withAuth({ method: 'POST' })
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Generate prediction failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchOfficialPrediction(campaign: string, type: 'official_0800' | 'official_1200' = 'official_0800'): Promise<OfficialPrediction> {
  const res = await fetch(
    `${API_BASE_URL}/predictions/official/${encodeURIComponent(campaign)}?type=${type}`,
    withAuth()
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Official prediction fetch failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}


