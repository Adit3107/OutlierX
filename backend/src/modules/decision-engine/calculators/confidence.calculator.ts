import { normalizeConfidence, percent, roundScore } from '../utils/score.utils.js';

export class ConfidenceCalculator {
  calculate(input: { ruleScore: number; ruleConfidence: number; mlScore: number; mlConfidence: number }) {
    const ruleConfidence = normalizeConfidence(input.ruleConfidence);
    const mlConfidence = normalizeConfidence(input.mlConfidence);
    const scoreDistance = Math.abs(input.ruleScore - input.mlScore);
    const consistency = Math.max(0, 1 - scoreDistance / 100);
    const combined = ruleConfidence * 0.4 + mlConfidence * 0.4 + consistency * 0.2;

    return {
      confidence: percent(combined),
      consistency: roundScore(consistency * 100),
    };
  }
}
