import assert from 'node:assert/strict';
import test from 'node:test';
import { RuleEvaluator } from './rule-evaluator.js';
import type { CompiledRule } from '../types/rule-engine.types.js';

function rule(input: Partial<CompiledRule>): CompiledRule {
  return {
    id: input.id ?? 'rule-1',
    name: input.name ?? 'Test Rule',
    description: input.description ?? null,
    category: input.category ?? 'AMOUNT',
    severity: input.severity ?? 'HIGH',
    enabled: input.enabled ?? true,
    priority: input.priority ?? 1,
    weight: input.weight ?? 40,
    conditionTree: input.conditionTree ?? {
      type: 'group',
      operator: 'AND',
      position: 0,
      children: [
        {
          type: 'condition',
          field: 'amount',
          operator: 'GT',
          value: 50000,
          dataType: 'number',
          position: 0,
        },
      ],
    },
  };
}

test('evaluates numeric rules and assigns deterministic risk levels', () => {
  const evaluator = new RuleEvaluator();
  const result = evaluator.evaluate(
    {
      timestamp: '2026-07-02T12:00:00.000Z',
      amount: 75000,
      currency: 'USD',
      merchant: 'Acme',
    },
    [rule({ weight: 40 })],
    'PLAYGROUND'
  );

  assert.equal(result.finalScore, 40);
  assert.equal(result.riskLevel, 'MEDIUM');
  assert.equal(result.triggeredRules.length, 1);
  assert.match(result.triggeredRules[0].explanation, /amount/i);
});

test('supports nested AND and OR condition groups', () => {
  const evaluator = new RuleEvaluator();
  const result = evaluator.evaluate(
    {
      timestamp: '2026-07-02T23:00:00.000Z',
      amount: 12000,
      currency: 'USD',
      merchant: 'Cash Depot',
      paymentMethod: 'Cash',
    },
    [
      rule({
        category: 'AMOUNT',
        weight: 35,
        conditionTree: {
          type: 'group',
          operator: 'AND',
          position: 0,
          children: [
            {
              type: 'condition',
              field: 'amount',
              operator: 'GT',
              value: 10000,
              dataType: 'number',
              position: 0,
            },
            {
              type: 'group',
              operator: 'OR',
              position: 1,
              children: [
                {
                  type: 'condition',
                  field: 'paymentMethod',
                  operator: 'CONTAINS',
                  value: 'cash',
                  dataType: 'string',
                  position: 0,
                },
                {
                  type: 'condition',
                  field: 'merchant',
                  operator: 'CONTAINS',
                  value: 'atm',
                  dataType: 'string',
                  position: 1,
                },
              ],
            },
          ],
        },
      }),
    ],
    'PLAYGROUND'
  );

  assert.equal(result.finalScore, 35);
  assert.equal(result.triggeredRules.length, 1);
});

test('supports missing, list, between, and score clamping', () => {
  const evaluator = new RuleEvaluator();
  const result = evaluator.evaluate(
    {
      timestamp: '2026-07-04T02:00:00.000Z',
      amount: 500,
      currency: 'USD',
      merchant: 'Crypto Desk',
      country: 'RU',
      referenceNumber: '',
    },
    [
      rule({
        id: 'missing',
        name: 'Missing Reference',
        category: 'ACCOUNT',
        weight: 30,
        conditionTree: {
          type: 'group',
          operator: 'AND',
          position: 0,
          children: [{ type: 'condition', field: 'referenceNumber', operator: 'MISSING', value: null, dataType: 'string', position: 0 }],
        },
      }),
      rule({
        id: 'country',
        name: 'Country List',
        category: 'LOCATION',
        weight: 50,
        conditionTree: {
          type: 'group',
          operator: 'AND',
          position: 0,
          children: [{ type: 'condition', field: 'country', operator: 'IN', value: ['RU'], dataType: 'array', position: 0 }],
        },
      }),
      rule({
        id: 'night',
        name: 'Night',
        category: 'TIME',
        weight: 50,
        conditionTree: {
          type: 'group',
          operator: 'AND',
          position: 0,
          children: [{ type: 'condition', field: 'transactionHour', operator: 'BETWEEN', value: [0, 5], dataType: 'number', position: 0 }],
        },
      }),
    ],
    'PLAYGROUND'
  );

  assert.equal(result.finalScore, 100);
  assert.equal(result.riskLevel, 'CRITICAL');
  assert.equal(result.triggeredRules.length, 3);
});
