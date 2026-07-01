import type { Decision as DecisionDto, DecisionExplanation } from '@anomaly/shared';
import type { Decision } from '@prisma/client';

export function toDecisionDto(decision?: Decision | null): DecisionDto | null {
  if (!decision) {
    return null;
  }

  return {
    id: decision.id,
    organizationId: decision.organizationId,
    transactionId: decision.transactionId,
    ruleExecutionId: decision.ruleExecutionId,
    mlPredictionId: decision.mlPredictionId,
    ruleScore: decision.ruleScore,
    mlScore: decision.mlScore,
    finalScore: decision.finalScore,
    confidence: decision.confidence,
    riskLevel: decision.riskLevel,
    decisionStrategy: decision.decisionStrategy,
    decisionVersion: decision.decisionVersion,
    explanation: decision.explanation as unknown as DecisionExplanation,
    recommendation: decision.recommendation,
    processedAt: decision.processedAt,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
  };
}
