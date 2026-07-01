import type { RiskLevel } from '@prisma/client';
import type { DecisionEngineConfig, WeightedSignal } from '../types/decision-engine.types.js';
import { roundScore } from '../utils/score.utils.js';

export class DecisionCalculator {
  constructor(private config: DecisionEngineConfig) {}

  classify(finalScore: number): RiskLevel {
    const score = roundScore(finalScore);
    const threshold = this.config.riskThresholds.find(
      (item) => score >= item.min && score <= item.max
    );
    return threshold?.level ?? 'CRITICAL';
  }

  summarizeWeights(signals: WeightedSignal[]) {
    return signals.map((signal) => ({
      ...signal,
      score: roundScore(signal.score),
      weightedScore: roundScore(signal.weightedScore),
    }));
  }
}
