import type { DecisionRecommendation } from '@prisma/client';
import type { DecisionEngineConfig } from '../types/decision-engine.types.js';
import { roundScore } from '../utils/score.utils.js';

export class RecommendationGenerator {
  constructor(private config: DecisionEngineConfig) {}

  recommend(finalScore: number): DecisionRecommendation {
    const score = roundScore(finalScore);
    const threshold = this.config.recommendationThresholds.find(
      (item) => score >= item.min && score <= item.max
    );
    return threshold?.recommendation ?? 'BLOCK_TRANSACTION';
  }

  reason(recommendation: DecisionRecommendation, finalScore: number): string {
    const score = roundScore(finalScore);
    const reasons: Record<DecisionRecommendation, string> = {
      APPROVE: `Approve because the combined risk score is ${score}, below the monitoring threshold.`,
      MONITOR: `Monitor because the combined risk score is ${score}, indicating elevated but manageable risk.`,
      MANUAL_REVIEW: `Review manually because the combined risk score is ${score}, requiring analyst verification.`,
      ESCALATE: `Escalate because the combined risk score is ${score}, indicating severe fraud risk.`,
      BLOCK_TRANSACTION: `Block transaction because the combined risk score is ${score}, exceeding the block threshold.`,
    };
    return reasons[recommendation];
  }
}
