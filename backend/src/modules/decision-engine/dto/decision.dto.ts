import type { Decision as DecisionDto, DecisionExplanation } from '@anomaly/shared';
import type { Decision } from '@prisma/client';

export function toDecisionDto(decision?: Decision | null): DecisionDto | null {
  if (!decision) {
    return null;
  }

  const explanationObj = decision.explanation as unknown as DecisionExplanation;

  return {
    id: decision.id,
    organizationId: decision.organizationId,
    transactionId: decision.transactionId,
    ruleExecutionId: explanationObj?.ruleBreakdown?.executionId ?? null,
    mlPredictionId: decision.mlPredictionId,
    rawScore: decision.rawScore ?? decision.finalScore,
    ruleScore: decision.ruleScore,
    mlScore: decision.mlScore,
    finalScore: decision.finalScore,
    category: decision.category ?? decision.riskLevel,
    decisionOutcome: decision.decisionOutcome ?? decision.recommendation,
    confidence: decision.confidence,
    riskLevel: decision.riskLevel as never,
    decisionStrategy: decision.decisionStrategy,
    decisionVersion: decision.decisionVersion,
    explanation: explanationObj,
    recommendation: decision.recommendation as never,
    ensembleBreakdown: (decision.ensembleBreakdown as Record<string, unknown>) ?? null,
    historicalAdjustment: decision.historicalAdjustment ?? null,
    processedAt: decision.processedAt,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
  };
}
