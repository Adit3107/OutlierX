import type { RuleExecutionSource } from '@prisma/client';
import { ConditionEvaluator } from './condition-evaluator.js';
import { ExplanationGenerator } from './explanation-generator.js';
import { ScoreCalculator } from './score-calculator.js';
import type {
  CompiledRule,
  RuleEvaluationResult,
  RuleEvaluationSummary,
  RuleTransaction,
} from '../types/rule-engine.types.js';

export class RuleEvaluator {
  constructor(
    private conditionEvaluator = new ConditionEvaluator(),
    private scoreCalculator = new ScoreCalculator(),
    private explanationGenerator = new ExplanationGenerator()
  ) {}

  evaluate(
    transaction: RuleTransaction,
    rules: CompiledRule[],
    source: RuleExecutionSource
  ): RuleEvaluationSummary {
    const startedAt = Date.now();
    const results: RuleEvaluationResult[] = rules
      .filter((rule) => rule.enabled)
      .sort((left, right) => left.priority - right.priority)
      .map((rule) => {
        const matched = this.conditionEvaluator.evaluate(rule.conditionTree, transaction);
        const score = matched ? rule.weight : 0;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          matched,
          score,
          explanation: matched ? this.explanationGenerator.generate(rule) : `${rule.name} did not match this transaction.`,
        };
      });

    const triggeredRules = results.filter((result) => result.matched);
    const finalScore = this.scoreCalculator.clamp(
      triggeredRules.reduce((total, result) => total + result.score, 0)
    );

    return {
      finalScore,
      riskLevel: this.scoreCalculator.riskLevel(finalScore),
      triggeredRules,
      results,
      executionTimeMs: Math.max(0, Date.now() - startedAt),
      source,
    };
  }
}
