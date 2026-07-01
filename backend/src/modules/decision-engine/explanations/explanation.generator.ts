import type { DecisionRecommendation, RiskLevel } from '@prisma/client';
import type {
  DecisionEngineConfig,
  MlDecisionInput,
  RuleDecisionInput,
  WeightedSignal,
} from '../types/decision-engine.types.js';
import { roundScore } from '../utils/score.utils.js';

export class ExplanationGenerator {
  constructor(private config: DecisionEngineConfig) {}

  generate(input: {
    rule: RuleDecisionInput;
    ml: MlDecisionInput;
    finalScore: number;
    confidence: number;
    consistency: number;
    riskLevel: RiskLevel;
    recommendation: DecisionRecommendation;
    recommendationReason: string;
    weights: WeightedSignal[];
    processingTime: number;
  }) {
    const reasons = this.reasons(input);
    const finalScore = roundScore(input.finalScore);

    return {
      summary: `${input.riskLevel} risk decision generated with final score ${finalScore} and ${roundScore(input.confidence)}% confidence.`,
      reasons,
      recommendationReason: input.recommendationReason,
      ruleBreakdown: {
        executionId: input.rule.executionId ?? null,
        score: roundScore(input.rule.score),
        riskLevel: input.rule.riskLevel ?? null,
        triggeredRules: input.rule.triggeredRules,
        executionTimeMs: input.rule.executionTimeMs ?? null,
      },
      mlBreakdown: {
        predictionId: input.ml.predictionId ?? null,
        prediction: input.ml.prediction,
        score: roundScore(input.ml.score),
        confidence: input.ml.confidence,
        modelVersion: input.ml.modelVersion ?? null,
        processingTime: input.ml.processingTime ?? null,
      },
      weights: input.weights,
      thresholds: {
        risk: Object.fromEntries(
          this.config.riskThresholds.map((item) => [item.level, { min: item.min, max: item.max }])
        ) as Record<RiskLevel, { min: number; max: number }>,
        recommendations: Object.fromEntries(
          this.config.recommendationThresholds.map((item) => [
            item.recommendation,
            { min: item.min, max: item.max },
          ])
        ) as Record<DecisionRecommendation, { min: number; max: number }>,
      },
      consistency: input.consistency,
      timeline: [
        {
          label: 'Rule Evaluation',
          status: 'COMPLETED',
          timestamp: input.rule.createdAt ?? null,
          description: `${input.rule.triggeredRules.length} rule${input.rule.triggeredRules.length === 1 ? '' : 's'} triggered with score ${roundScore(input.rule.score)}.`,
        },
        {
          label: 'ML Inference',
          status: 'COMPLETED',
          timestamp: input.ml.processedAt ?? null,
          description: `Model ${input.ml.modelVersion ?? 'unknown'} returned ${input.ml.prediction} with score ${roundScore(input.ml.score)}.`,
        },
        {
          label: 'Decision Generated',
          status: 'COMPLETED',
          timestamp: new Date(),
          description: `${this.config.decisionStrategy} combined weighted signals into a ${input.riskLevel} decision.`,
        },
      ],
      processingTime: input.processingTime,
    };
  }

  private reasons(input: {
    rule: RuleDecisionInput;
    ml: MlDecisionInput;
    finalScore: number;
    confidence: number;
    consistency: number;
    riskLevel: RiskLevel;
  }) {
    const reasons: string[] = [];

    for (const rule of input.rule.triggeredRules.filter((item) => item.matched).slice(0, 4)) {
      reasons.push(rule.explanation);
    }

    if (input.ml.score >= 70) {
      reasons.push(`Machine Learning model detected statistical anomaly ${input.ml.prediction} with score ${roundScore(input.ml.score)}.`);
    } else {
      reasons.push(`Machine Learning model returned ${input.ml.prediction} with score ${roundScore(input.ml.score)}.`);
    }

    if (input.consistency >= 80) {
      reasons.push('Rule Engine and Machine Learning signals are strongly consistent.');
    } else if (input.consistency < 50) {
      reasons.push('Rule Engine and Machine Learning signals disagree, reducing decision certainty.');
    }

    if (input.confidence >= 85) {
      reasons.push('Combined confidence is very high.');
    }

    if (reasons.length === 0) {
      reasons.push(`${input.riskLevel} risk was assigned from the weighted Rule Engine and Machine Learning scores.`);
    }

    return reasons;
  }
}
