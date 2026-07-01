export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

export function roundScore(value: number): number {
  return Math.round(clampScore(value) * 100) / 100;
}

export function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value > 1 ? clampScore(value) / 100 : Math.min(1, Math.max(0, value));
}

export function percent(value: number): number {
  return roundScore(normalizeConfidence(value) * 100);
}
