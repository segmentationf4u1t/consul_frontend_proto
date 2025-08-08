export async function revalidatePredictions(campaign: string) {
    const bearer = process.env.NEXT_PUBLIC_API_BEARER_TOKEN
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate/predictions/${encodeURIComponent(campaign)}`, {
      method: 'POST',
      headers: bearer ? { 'Authorization': `Bearer ${bearer}` } : undefined
    });
    if (!res.ok) throw new Error('Failed to revalidate predictions');
    return res.json();
  }
  
  export async function revalidateHistorical(scope?: 'panels' | 'campaigns') {
    const bearer = process.env.NEXT_PUBLIC_API_BEARER_TOKEN
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate/historical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(bearer ? { 'Authorization': `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(scope ? { scope } : {})
    });
    if (!res.ok) throw new Error('Failed to revalidate historical');
    return res.json();
  }