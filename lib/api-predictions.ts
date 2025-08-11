import { API_BASE_URL, withAuth } from '@/lib/api-config';
import type { CampaignPrediction } from '@/types/predictions';

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


