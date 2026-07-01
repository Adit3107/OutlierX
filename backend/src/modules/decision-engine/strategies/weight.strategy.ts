import type { DecisionEngineConfig, DecisionSignal, WeightedSignal } from '../types/decision-engine.types.js';
import { roundScore } from '../utils/score.utils.js';

export class WeightStrategy {
  constructor(private config: DecisionEngineConfig) {}

  calculate(signals: DecisionSignal[]): { finalScore: number; breakdown: WeightedSignal[] } {
    const configured = this.config.signals.map((signalConfig) => {
      const signal = signals.find((item) => item.key === signalConfig.key);
      const score = roundScore(signal?.score ?? 0);
      const weightedScore = roundScore(score * signalConfig.weight);

      return {
        name: signalConfig.key,
        label: signal?.label ?? signalConfig.label,
        score,
        weight: signalConfig.weight,
        weightedScore,
        confidence: signal?.confidence,
      };
    });

    return {
      finalScore: roundScore(configured.reduce((sum, signal) => sum + signal.weightedScore, 0)),
      breakdown: configured,
    };
  }
}
