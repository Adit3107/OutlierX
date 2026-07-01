import type { RuleExecutionSource } from '@prisma/client';
import { RuleEvaluator } from '../engine/rule-evaluator.js';
import type {
  CompiledRule,
  RuleEvaluationSummary,
  RuleTransaction,
} from '../types/rule-engine.types.js';

export class RuleEngineService {
  constructor(private evaluator = new RuleEvaluator()) {}

  evaluate(
    transaction: RuleTransaction,
    rules: CompiledRule[],
    source: RuleExecutionSource
  ): RuleEvaluationSummary {
    return this.evaluator.evaluate(transaction, rules, source);
  }
}
