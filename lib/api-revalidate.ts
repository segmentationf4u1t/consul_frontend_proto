export async function revalidatePredictions(campaign: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate/predictions/${encodeURIComponent(campaign)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to revalidate predictions');
    return res.json();
  }
  
  export async function revalidateHistorical(scope?: 'panels' | 'campaigns') {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate/historical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scope ? { scope } : {})
    });
    if (!res.ok) throw new Error('Failed to revalidate historical');
    return res.json();
  }