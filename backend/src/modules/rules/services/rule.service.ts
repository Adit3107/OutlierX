import type { AlertSeverity, RuleCategory, RuleExecutionSource, Transaction } from '@prisma/client';
import type {
  PaginatedResponse,
  Rule,
  RuleEvaluationResponse,
  RuleExecution,
  RuleGroupNode,
} from '@anomaly/shared';
import { DEFAULT_RULES } from '../constants/default-rules.js';
import { RuleRepository, RuleFilters, RuleHistoryFilters } from '../repositories/rule.repository.js';
import { toCompiledRule, toRuleDto } from '../utils/rule-mapper.js';
import { RuleEngineService } from './rule-engine.service.js';
import { ExecutionRecorder } from './execution-recorder.js';
import { ActivityService } from '../../../services/foundation.service.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../../utils/errors.js';
import type { RuleTransaction } from '../types/rule-engine.types.js';

function toRuleTransaction(transaction: Transaction | (RuleTransaction & { id?: string })): RuleTransaction {
  return {
    id: transaction.id,
    transactionId: transaction.transactionId,
    timestamp: transaction.timestamp,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    merchant: transaction.merchant,
    merchantCategory: transaction.merchantCategory,
    accountNumber: transaction.accountNumber,
    country: transaction.country,
    city: transaction.city,
    paymentMethod: transaction.paymentMethod,
    description: transaction.description,
    referenceNumber: transaction.referenceNumber,
    customerId: transaction.customerId,
    status: transaction.status,
    metadata: (transaction.metadata as Record<string, unknown> | null) ?? null,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function isUniqueConstraint(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
  );
}

function toExecutionDto(
  execution: Awaited<ReturnType<RuleRepository['history']>>[0][number]
): RuleExecution {
  return {
    id: execution.id,
    organizationId: execution.organizationId,
    transactionId: execution.transactionId,
    source: execution.source,
    finalScore: execution.finalScore,
    riskLevel: execution.riskLevel,
    executionTimeMs: execution.executionTimeMs,
    triggeredCount: execution.triggeredCount,
    createdAt: execution.createdAt,
    transaction: execution.transaction
      ? {
          ...execution.transaction,
          amount: Number(execution.transaction.amount),
        }
      : null,
    results: execution.results.map((result) => ({
      id: result.id,
      ruleId: result.ruleId,
      ruleName: result.rule.name,
      category: result.rule.category,
      severity: result.rule.severity,
      matched: result.matched,
      score: result.score,
      explanation: result.explanation,
    })),
  };
}

export class RuleService {
  constructor(
    private ruleRepository: RuleRepository,
    private engineService: RuleEngineService,
    private executionRecorder: ExecutionRecorder,
    private activityService: ActivityService
  ) {}

  async listRules(organizationId: string, filters: RuleFilters): Promise<PaginatedResponse<Rule>> {
    const [items, total] = await this.ruleRepository.list(organizationId, filters);
    return {
      items: items.map(toRuleDto),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getRule(organizationId: string, id: string): Promise<Rule> {
    const rule = await this.ruleRepository.findById(organizationId, id);
    if (!rule) {
      throw new NotFoundError('Rule not found');
    }
    return toRuleDto(rule);
  }

  async createRule(
    organizationId: string,
    userId: string,
    input: {
      name: string;
      description?: string | null;
      category: RuleCategory;
      severity: AlertSeverity;
      enabled: boolean;
      priority: number;
      weight: number;
      conditionTree: RuleGroupNode;
    }
  ): Promise<Rule> {
    try {
      const rule = await this.ruleRepository.create(organizationId, userId, input);
      await this.activityService.log({
        organizationId,
        userId,
        action: 'rule.created',
        entity: 'RULE',
        entityId: rule.id,
        metadata: { name: rule.name },
      });
      return toRuleDto(rule);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictError('A rule with this name already exists');
      }
      throw error;
    }
  }

  async updateRule(
    organizationId: string,
    userId: string,
    id: string,
    input: Partial<{
      name: string;
      description?: string | null;
      category: RuleCategory;
      severity: AlertSeverity;
      enabled: boolean;
      priority: number;
      weight: number;
      conditionTree: RuleGroupNode;
    }>
  ): Promise<Rule> {
    try {
      const rule = await this.ruleRepository.update(organizationId, id, input);
      if (!rule) {
        throw new NotFoundError('Rule not found');
      }
      await this.activityService.log({
        organizationId,
        userId,
        action: 'rule.updated',
        entity: 'RULE',
        entityId: rule.id,
        metadata: { name: rule.name },
      });
      return toRuleDto(rule);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new ConflictError('A rule with this name already exists');
      }
      throw error;
    }
  }

  async deleteRule(organizationId: string, userId: string, id: string) {
    const deleted = await this.ruleRepository.delete(organizationId, id);
    if (!deleted) {
      throw new NotFoundError('Rule not found');
    }
    await this.activityService.log({
      organizationId,
      userId,
      action: 'rule.deleted',
      entity: 'RULE',
      entityId: deleted.id,
      metadata: { name: deleted.name },
    });
    return { id: deleted.id };
  }

  async setEnabled(organizationId: string, userId: string, id: string, enabled: boolean): Promise<Rule> {
    const rule = await this.ruleRepository.setEnabled(organizationId, id, enabled);
    if (!rule) {
      throw new NotFoundError('Rule not found');
    }
    await this.activityService.log({
      organizationId,
      userId,
      action: enabled ? 'rule.enabled' : 'rule.disabled',
      entity: 'RULE',
      entityId: rule.id,
      metadata: { name: rule.name },
    });
    return toRuleDto(rule);
  }

  async duplicateRule(organizationId: string, userId: string, id: string): Promise<Rule> {
    const rule = await this.ruleRepository.duplicate(organizationId, userId, id);
    if (!rule) {
      throw new NotFoundError('Rule not found');
    }
    await this.activityService.log({
      organizationId,
      userId,
      action: 'rule.duplicated',
      entity: 'RULE',
      entityId: rule.id,
      metadata: { name: rule.name, sourceRuleId: id },
    });
    return toRuleDto(rule);
  }

  async reorderRules(organizationId: string, userId: string, items: Array<{ id: string; priority: number }>) {
    await this.ruleRepository.reorder(organizationId, items);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'rule.reordered',
      entity: 'RULE',
      metadata: { count: items.length },
    });
    return { count: items.length };
  }

  async testRules(
    organizationId: string,
    transaction: RuleTransaction,
    ruleIds?: string[]
  ): Promise<RuleEvaluationResponse> {
    const rules = (await this.ruleRepository.findEnabled(organizationId, ruleIds)).map(toCompiledRule);
    const summary = this.engineService.evaluate(transaction, rules, 'PLAYGROUND');
    return {
      finalScore: summary.finalScore,
      riskLevel: summary.riskLevel,
      triggeredRules: summary.triggeredRules,
      results: summary.results,
      executionTimeMs: summary.executionTimeMs,
    };
  }

  async evaluateStored(
    organizationId: string,
    userId: string,
    transactionIds: string[],
    source: RuleExecutionSource,
    ruleIds?: string[]
  ) {
    if (source === 'PLAYGROUND') {
      throw new BadRequestError('Stored transactions cannot be evaluated with PLAYGROUND source');
    }

    const transactions = await this.ruleRepository.findTransactions(organizationId, transactionIds);
    if (transactions.length !== transactionIds.length) {
      throw new NotFoundError('One or more transactions were not found');
    }

    const results = await this.evaluateTransactions(organizationId, transactions, source, ruleIds);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'rule.executed',
      entity: 'RULE',
      metadata: { source, count: results.length },
    });
    return results;
  }

  async evaluateTransactions(
    organizationId: string,
    transactions: Transaction[],
    source: RuleExecutionSource = 'UPLOAD',
    ruleIds?: string[]
  ): Promise<RuleEvaluationResponse[]> {
    const rules = (await this.ruleRepository.findEnabled(organizationId, ruleIds)).map(toCompiledRule);
    if (rules.length === 0) {
      return [];
    }

    const responses: RuleEvaluationResponse[] = [];
    for (const transaction of transactions) {
      const summary = this.engineService.evaluate(toRuleTransaction(transaction), rules, source);
      const execution = await this.executionRecorder.record({
        organizationId,
        transactionId: transaction.id,
        source,
        summary,
      });
      responses.push({
        executionId: execution.id,
        finalScore: summary.finalScore,
        riskLevel: summary.riskLevel,
        triggeredRules: summary.triggeredRules,
        results: summary.results,
        executionTimeMs: summary.executionTimeMs,
      });
    }
    return responses;
  }

  async history(
    organizationId: string,
    filters: RuleHistoryFilters
  ): Promise<PaginatedResponse<RuleExecution>> {
    const [items, total] = await this.ruleRepository.history(organizationId, filters);
    return {
      items: items.map(toExecutionDto),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  provisionDefaultRules(organizationId: string, createdBy: string | null = null) {
    return this.ruleRepository.provisionDefaults(organizationId, createdBy, DEFAULT_RULES);
  }
}
