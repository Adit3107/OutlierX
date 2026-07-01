export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function getAnomalyScoreSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 0.3) return 'low';
  if (score < 0.6) return 'medium';
  if (score < 0.85) return 'high';
  return 'critical';
}

export function getAnomalySeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'medium':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'high':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'critical':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
