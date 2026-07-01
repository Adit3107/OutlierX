export class ScoreCalculator {
  clamp(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  riskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) {
      return 'CRITICAL';
    }
    if (score >= 50) {
      return 'HIGH';
    }
    if (score >= 25) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
