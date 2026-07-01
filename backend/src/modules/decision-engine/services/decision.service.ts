import { Prisma } from '@prisma/client';
import type {
  Decision,
  DecisionRecalculateResult,
  DecisionTransactionSummary,
  PaginatedResponse,
  RuleResult,
} from '@anomaly/shared';
import { ActivityService } from '../../../services/foundation.service.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors.js';
import { decisionEngineConfig } from '../constants/decision-config.js';
import { ConfidenceCalculator } from '../calculators/confidence.calculator.js';
import { DecisionCalculator } from '../calculators/decision.calculator.js';
import { RecommendationGenerator } from '../calculators/recommendation.generator.js';
import { toDecisionDto } from '../dto/decision.dto.js';
import { ExplanationGenerator } from '../explanations/explanation.generator.js';
import { DecisionFilters, DecisionRepository } from '../repositories/decision.repository.js';
import { AlertService } from '../../alerts/services/alert.service.js';
import { WeightStrategy } from '../strategies/weight.strategy.js';
import type {
  DecisionCalculationInput,
  DecisionCalculationResult,
  DecisionPreviewInput,
  MlDecisionInput,
  RuleDecisionInput,
} from '../types/decision-engine.types.js';
import { normalizeConfidence, roundScore } from '../utils/score.utils.js';

export class DecisionService {
  constructor(
    private decisionRepository: DecisionRepository,
    private activityService: ActivityService,
    private weightStrategy = new WeightStrategy(decisionEngineConfig),
    private decisionCalculator = new DecisionCalculator(decisionEngineConfig),
    private confidenceCalculator = new ConfidenceCalculator(),
    private explanationGenerator = new ExplanationGenerator(decisionEngineConfig),
    private recommendationGenerator = new RecommendationGenerator(decisionEngineConfig),
    private alertService?: AlertService
  ) {}

  async listDecisions(
    organizationId: string,
    filters: DecisionFilters
  ): Promise<PaginatedResponse<Decision>> {
    const [items, total] = await this.decisionRepository.list(organizationId, filters);
    return {
      items: items.map((item) => toDecisionDto(item)!),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getDecision(organizationId: string, id: string): Promise<Decision> {
    const decision = await this.decisionRepository.findById(organizationId, id);
    if (!decision) {
      throw new NotFoundError('Decision not found');
    }
    return toDecisionDto(decision)!;
  }

  async getTransactionDecision(
    organizationId: string,
    transactionId: string
  ): Promise<DecisionTransactionSummary> {
    const transaction = await this.decisionRepository.findTransaction(organizationId, transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    const history = await this.decisionRepository.historyByTransaction(organizationId, transactionId);
    return {
      latest: toDecisionDto(history[0] ?? null),
      history: history.map((decision) => toDecisionDto(decision)!),
    };
  }

  async recalculate(
    organizationId: string,
    userId: string | null,
    transactionIds: string[],
    source: 'GENERATED' | 'RECALCULATED' = 'RECALCULATED'
  ): Promise<DecisionRecalculateResult[]> {
    const results: DecisionRecalculateResult[] = [];

    for (const transactionId of transactionIds) {
      try {
        const transaction = await this.decisionRepository.findTransaction(organizationId, transactionId);
        if (!transaction) {
          throw new NotFoundError('Transaction not found');
        }

        const inputs = await this.decisionRepository.findLatestInputs(organizationId, transactionId);
        if (!inputs.ruleExecution) {
          throw new BadRequestError('Rule Engine result is required before a decision can be generated');
        }
        if (!inputs.mlPrediction) {
          throw new BadRequestError('Machine Learning result is required before a decision can be generated');
        }

        const rule = this.toRuleInput(inputs.ruleExecution);
        const ml = this.toMlInput(inputs.mlPrediction);
        const calculated = this.calculate({ transactionId, rule, ml });
        const created = await this.decisionRepository.create({
          organizationId,
          transactionId,
          ruleExecutionId: rule.executionId,
          mlPredictionId: ml.predictionId,
          ruleScore: calculated.ruleScore,
          mlScore: calculated.mlScore,
          finalScore: calculated.finalScore,
          confidence: calculated.confidence,
          riskLevel: calculated.riskLevel,
          decisionStrategy: calculated.decisionStrategy,
          decisionVersion: calculated.decisionVersion,
          explanation: calculated.explanation as Prisma.InputJsonValue,
          recommendation: calculated.recommendation,
          processedAt: new Date(),
        });

        await this.logDecisionEvents({
          organizationId,
          userId,
          transactionId,
          decisionId: created.id,
          source,
          previousDecision: inputs.previousDecision,
          decision: created,
        });

        if (this.alertService) {
          await this.alertService.createFromDecision(created, userId);
        }

        results.push({
          transactionId,
          status: 'CREATED',
          decision: toDecisionDto(created)!,
        });
      } catch (error) {
        results.push({
          transactionId,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Decision generation failed',
        });
      }
    }

    return results;
  }

  test(input: DecisionPreviewInput): DecisionCalculationResult {
    return this.calculate({
      transactionId: 'test',
      rule: input.rule,
      ml: input.ml,
    });
  }

  private calculate(input: DecisionCalculationInput): DecisionCalculationResult {
    const startedAt = Date.now();
    const ruleScore = roundScore(input.rule.score);
    const mlScore = roundScore(input.ml.score);
    const weighted = this.weightStrategy.calculate([
      {
        key: 'rule',
        label: 'Rule Engine',
        score: ruleScore,
        weight: 0.6,
        confidence: input.rule.confidence,
      },
      {
        key: 'ml',
        label: 'Machine Learning',
        score: mlScore,
        weight: 0.4,
        confidence: input.ml.confidence,
      },
    ]);
    const riskLevel = this.decisionCalculator.classify(weighted.finalScore);
    const confidence = this.confidenceCalculator.calculate({
      ruleScore,
      ruleConfidence: input.rule.confidence,
      mlScore,
      mlConfidence: input.ml.confidence,
    });
    const recommendation = this.recommendationGenerator.recommend(weighted.finalScore);
    const recommendationReason = this.recommendationGenerator.reason(
      recommendation,
      weighted.finalScore
    );
    const processingTime = Date.now() - startedAt;
    const weights = this.decisionCalculator.summarizeWeights(weighted.breakdown);

    return {
      ruleScore,
      mlScore,
      finalScore: weighted.finalScore,
      confidence: confidence.confidence,
      riskLevel,
      recommendation,
      decisionStrategy: decisionEngineConfig.decisionStrategy,
      decisionVersion: decisionEngineConfig.decisionVersion,
      explanation: this.explanationGenerator.generate({
        rule: input.rule,
        ml: input.ml,
        finalScore: weighted.finalScore,
        confidence: confidence.confidence,
        consistency: confidence.consistency,
        riskLevel,
        recommendation,
        recommendationReason,
        weights,
        processingTime,
      }),
    };
  }

  private toRuleInput(
    execution: Awaited<ReturnType<DecisionRepository['findLatestInputs']>>['ruleExecution']
  ): RuleDecisionInput {
    if (!execution) {
      throw new BadRequestError('Rule Engine result is required before a decision can be generated');
    }

    const triggeredRules: RuleResult[] = execution.results
      .filter((result) => result.matched)
      .map((result) => ({
        id: result.id,
        ruleId: result.ruleId,
        ruleName: result.rule.name,
        category: result.rule.category,
        severity: result.rule.severity,
        matched: result.matched,
        score: result.score,
        explanation: result.explanation,
      }));

    return {
      executionId: execution.id,
      score: execution.finalScore,
      riskLevel: execution.riskLevel,
      confidence: this.deriveRuleConfidence(execution.finalScore, triggeredRules.length),
      triggeredRules,
      executionTimeMs: execution.executionTimeMs,
      createdAt: execution.createdAt,
    };
  }

  private toMlInput(
    prediction: Awaited<ReturnType<DecisionRepository['findLatestInputs']>>['mlPrediction']
  ): MlDecisionInput {
    if (!prediction) {
      throw new BadRequestError('Machine Learning result is required before a decision can be generated');
    }

    return {
      predictionId: prediction.id,
      score: prediction.mlScore,
      prediction: prediction.mlPrediction,
      confidence: normalizeConfidence(prediction.confidence),
      modelVersion: prediction.modelVersion,
      processingTime: prediction.processingTime,
      processedAt: prediction.processedAt,
    };
  }

  private deriveRuleConfidence(score: number, triggeredCount: number) {
    return normalizeConfidence(0.5 + Math.min(triggeredCount, 5) * 0.06 + roundScore(score) / 500);
  }

  private async logDecisionEvents(input: {
    organizationId: string;
    userId: string | null;
    transactionId: string;
    decisionId: string;
    source: 'GENERATED' | 'RECALCULATED';
    previousDecision?: {
      riskLevel: string;
      recommendation: string;
      id: string;
    } | null;
    decision: {
      riskLevel: string;
      recommendation: string;
      finalScore: number;
      confidence: number;
    };
  }) {
    await this.activityService.log({
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.source === 'GENERATED' ? 'decision.generated' : 'decision.recalculated',
      entity: 'TRANSACTION',
      entityId: input.transactionId,
      metadata: {
        decisionId: input.decisionId,
        finalScore: input.decision.finalScore,
        confidence: input.decision.confidence,
      },
    });

    if (input.previousDecision && input.previousDecision.riskLevel !== input.decision.riskLevel) {
      await this.activityService.log({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'decision.risk_level_updated',
        entity: 'TRANSACTION',
        entityId: input.transactionId,
        metadata: {
          previousDecisionId: input.previousDecision.id,
          decisionId: input.decisionId,
          from: input.previousDecision.riskLevel,
          to: input.decision.riskLevel,
        },
      });
    }

    if (
      input.previousDecision &&
      input.previousDecision.recommendation !== input.decision.recommendation
    ) {
      await this.activityService.log({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'decision.recommendation_changed',
        entity: 'TRANSACTION',
        entityId: input.transactionId,
        metadata: {
          previousDecisionId: input.previousDecision.id,
          decisionId: input.decisionId,
          from: input.previousDecision.recommendation,
          to: input.decision.recommendation,
        },
      });
    }
  }
}
