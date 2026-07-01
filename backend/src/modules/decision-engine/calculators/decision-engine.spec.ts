import assert from 'node:assert/strict';
import test from 'node:test';
import { decisionEngineConfig } from '../constants/decision-config.js';
import { ConfidenceCalculator } from './confidence.calculator.js';
import { DecisionCalculator } from './decision.calculator.js';
import { RecommendationGenerator } from './recommendation.generator.js';
import { ExplanationGenerator } from '../explanations/explanation.generator.js';
import { WeightStrategy } from '../strategies/weight.strategy.js';

test('combines weighted rule and ML scores', () => {
  const strategy = new WeightStrategy(decisionEngineConfig);
  const result = strategy.calculate([
    { key: 'rule', label: 'Rule Engine', score: 80, weight: 0.6 },
    { key: 'ml', label: 'Machine Learning', score: 50, weight: 0.4 },
  ]);

  assert.equal(result.finalScore, 68);
  assert.equal(result.breakdown[0].weightedScore, 48);
  assert.equal(result.breakdown[1].weightedScore, 20);
});

test('classifies risk at configured threshold boundaries', () => {
  const calculator = new DecisionCalculator(decisionEngineConfig);

  assert.equal(calculator.classify(39.99), 'LOW');
  assert.equal(calculator.classify(40), 'MEDIUM');
  assert.equal(calculator.classify(70), 'HIGH');
  assert.equal(calculator.classify(90), 'CRITICAL');
});

test('combines confidence with consistency penalty', () => {
  const calculator = new ConfidenceCalculator();
  const aligned = calculator.calculate({
    ruleScore: 85,
    ruleConfidence: 0.9,
    mlScore: 82,
    mlConfidence: 0.88,
  });
  const conflicting = calculator.calculate({
    ruleScore: 95,
    ruleConfidence: 0.9,
    mlScore: 10,
    mlConfidence: 0.9,
  });

  assert.ok(aligned.confidence > conflicting.confidence);
  assert.ok(aligned.consistency > conflicting.consistency);
});

test('selects recommendation thresholds', () => {
  const generator = new RecommendationGenerator(decisionEngineConfig);

  assert.equal(generator.recommend(20), 'APPROVE');
  assert.equal(generator.recommend(55), 'MONITOR');
  assert.equal(generator.recommend(75), 'MANUAL_REVIEW');
  assert.equal(generator.recommend(90), 'ESCALATE');
  assert.equal(generator.recommend(98), 'BLOCK_TRANSACTION');
});

test('generates specific explanations from rule and ML signals', () => {
  const generator = new ExplanationGenerator(decisionEngineConfig);
  const explanation = generator.generate({
    rule: {
      executionId: 'rule-exec',
      score: 80,
      riskLevel: 'HIGH',
      confidence: 0.9,
      executionTimeMs: 12,
      createdAt: new Date('2026-07-02T00:00:00.000Z'),
      triggeredRules: [
        {
          ruleId: 'rule-1',
          ruleName: 'Large Amount',
          category: 'AMOUNT',
          severity: 'HIGH',
          matched: true,
          score: 80,
          explanation: 'Transaction exceeded configured amount threshold.',
        },
      ],
    },
    ml: {
      predictionId: 'ml-1',
      score: 92,
      prediction: 'ANOMALY',
      confidence: 0.95,
      modelVersion: 'test',
      processingTime: 5,
      processedAt: new Date('2026-07-02T00:00:01.000Z'),
    },
    finalScore: 84.8,
    confidence: 91,
    consistency: 88,
    riskLevel: 'HIGH',
    recommendation: 'MANUAL_REVIEW',
    recommendationReason: 'Review manually because the combined risk score is 84.8.',
    weights: [],
    processingTime: 1,
  });

  assert.match(explanation.summary, /HIGH risk/);
  assert.ok(explanation.reasons.some((reason) => reason.includes('amount threshold')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('statistical anomaly')));
  assert.ok(explanation.reasons.some((reason) => reason.includes('very high')));
});
