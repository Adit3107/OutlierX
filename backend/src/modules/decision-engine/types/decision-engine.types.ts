import type { DecisionRecommendation, RiskLevel } from '@prisma/client';
import type { RuleResult } from '@anomaly/shared';

export interface DecisionSignalConfig {
  key: string;
  label: string;
  weight: number;
}

export interface RiskThreshold {
  level: RiskLevel;
  min: number;
  max: number;
}

export interface RecommendationThreshold {
  recommendation: DecisionRecommendation;
  min: number;
  max: number;
}

export interface DecisionEngineConfig {
  decisionVersion: string;
  decisionStrategy: string;
  signals: DecisionSignalConfig[];
  riskThresholds: RiskThreshold[];
  recommendationThresholds: RecommendationThreshold[];
}

export interface DecisionSignal {
  key: string;
  label: string;
  score: number;
  weight: number;
  confidence?: number;
}

export interface WeightedSignal {
  name: string;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  confidence?: number;
}

export interface RuleDecisionInput {
  executionId?: string | null;
  score: number;
  riskLevel?: RiskLevel | null;
  confidence: number;
  triggeredRules: RuleResult[];
  executionTimeMs?: number | null;
  createdAt?: Date | null;
}

export interface MlDecisionInput {
  predictionId?: string | null;
  score: number;
  prediction: string;
  confidence: number;
  modelVersion?: string | null;
  processingTime?: number | null;
  processedAt?: Date | null;
}

export interface DecisionCalculationInput {
  transactionId: string;
  rule: RuleDecisionInput;
  ml: MlDecisionInput;
}

export interface DecisionCalculationResult {
  ruleScore: number;
  mlScore: number;
  finalScore: number;
  confidence: number;
  riskLevel: RiskLevel;
  recommendation: DecisionRecommendation;
  explanation: Record<string, unknown>;
  decisionStrategy: string;
  decisionVersion: string;
}

export interface DecisionPreviewInput {
  rule: RuleDecisionInput;
  ml: MlDecisionInput;
}
