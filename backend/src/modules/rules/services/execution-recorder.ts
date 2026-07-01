import type { RuleExecutionSource } from '@prisma/client';
import { RuleRepository } from '../repositories/rule.repository.js';
import type { RuleEvaluationSummary } from '../types/rule-engine.types.js';

export class ExecutionRecorder {
  constructor(private ruleRepository: RuleRepository) {}

  record(input: {
    organizationId: string;
    transactionId?: string | null;
    source: RuleExecutionSource;
    summary: RuleEvaluationSummary;
  }) {
    return this.ruleRepository.recordExecution(input);
  }
}
