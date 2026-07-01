import type { RuleConditionNode, RuleGroupNode } from '@anomaly/shared';
import type { AlertSeverity, RuleCategory } from '@prisma/client';

export interface DefaultRuleDefinition {
  name: string;
  description: string;
  category: RuleCategory;
  severity: AlertSeverity;
  enabled: boolean;
  priority: number;
  weight: number;
  conditionTree: RuleGroupNode;
}

function condition(
  field: string,
  operator: RuleConditionNode['operator'],
  value: unknown,
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array',
  position = 0
): RuleConditionNode {
  return { type: 'condition' as const, field, operator, value, dataType, position };
}

function group(children: RuleGroupNode['children'], operator: 'AND' | 'OR' = 'AND'): RuleGroupNode {
  return { type: 'group', operator, children };
}

export const DEFAULT_RULES: DefaultRuleDefinition[] = [
  {
    name: 'Large Transaction',
    description: 'Flags transactions above the standard large-value threshold.',
    category: 'AMOUNT',
    severity: 'HIGH',
    enabled: true,
    priority: 10,
    weight: 40,
    conditionTree: group([condition('amount', 'GT', 50000, 'number')]),
  },
  {
    name: 'Very Large Transaction',
    description: 'Flags exceptionally large transactions that require immediate review.',
    category: 'AMOUNT',
    severity: 'CRITICAL',
    enabled: true,
    priority: 20,
    weight: 70,
    conditionTree: group([condition('amount', 'GT', 250000, 'number')]),
  },
  {
    name: 'Foreign Country',
    description: 'Flags transactions from configured high-risk countries.',
    category: 'LOCATION',
    severity: 'HIGH',
    enabled: true,
    priority: 30,
    weight: 20,
    conditionTree: group([condition('country', 'IN', ['RU', 'IR', 'KP', 'SY'], 'array')]),
  },
  {
    name: 'Rapid Transactions',
    description: 'Placeholder velocity rule using imported metadata transaction count.',
    category: 'CUSTOM',
    severity: 'MEDIUM',
    enabled: true,
    priority: 40,
    weight: 15,
    conditionTree: group([condition('metadata.recentTransactionCount', 'GT', 5, 'number')]),
  },
  {
    name: 'Repeated Merchant',
    description: 'Flags repeated merchant activity when upstream metadata provides a count.',
    category: 'MERCHANT',
    severity: 'MEDIUM',
    enabled: true,
    priority: 50,
    weight: 15,
    conditionTree: group([condition('metadata.merchantTransactionCount', 'GT', 3, 'number')]),
  },
  {
    name: 'High Risk Merchant',
    description: 'Flags merchants whose names match configured suspicious terms.',
    category: 'MERCHANT',
    severity: 'HIGH',
    enabled: true,
    priority: 60,
    weight: 20,
    conditionTree: group([
      condition('merchant', 'CONTAINS', 'crypto', 'string', 0),
      condition('merchant', 'CONTAINS', 'casino', 'string', 1),
    ], 'OR'),
  },
  {
    name: 'Weekend Activity',
    description: 'Flags transactions occurring on Saturday or Sunday.',
    category: 'TIME',
    severity: 'LOW',
    enabled: true,
    priority: 70,
    weight: 10,
    conditionTree: group([condition('isWeekend', 'EQ', true, 'boolean')]),
  },
  {
    name: 'Night Activity',
    description: 'Flags transactions outside normal daytime operating hours.',
    category: 'TIME',
    severity: 'MEDIUM',
    enabled: true,
    priority: 80,
    weight: 10,
    conditionTree: group([
      condition('transactionHour', 'LT', 6, 'number', 0),
      condition('transactionHour', 'GT', 22, 'number', 1),
    ], 'OR'),
  },
  {
    name: 'Missing Reference Number',
    description: 'Flags transactions without a reference number.',
    category: 'ACCOUNT',
    severity: 'MEDIUM',
    enabled: true,
    priority: 90,
    weight: 15,
    conditionTree: group([condition('referenceNumber', 'MISSING', null, 'string')]),
  },
  {
    name: 'Suspicious Currency',
    description: 'Flags transactions in configured suspicious currencies.',
    category: 'CUSTOM',
    severity: 'MEDIUM',
    enabled: true,
    priority: 100,
    weight: 15,
    conditionTree: group([condition('currency', 'IN', ['RUB', 'XMR'], 'array')]),
  },
  {
    name: 'Duplicate Transactions',
    description: 'Flags potential duplicates when duplicate metadata is present.',
    category: 'CUSTOM',
    severity: 'HIGH',
    enabled: true,
    priority: 110,
    weight: 25,
    conditionTree: group([condition('metadata.duplicateCandidate', 'EQ', true, 'boolean')]),
  },
  {
    name: 'Large Cash Withdrawal',
    description: 'Flags high-value cash withdrawals.',
    category: 'AMOUNT',
    severity: 'HIGH',
    enabled: true,
    priority: 120,
    weight: 35,
    conditionTree: group([
      condition('amount', 'GT', 10000, 'number', 0),
      condition('paymentMethod', 'CONTAINS', 'cash', 'string', 1),
    ]),
  },
  {
    name: 'International Transfer',
    description: 'Flags wire transfers involving international location data.',
    category: 'LOCATION',
    severity: 'HIGH',
    enabled: true,
    priority: 130,
    weight: 25,
    conditionTree: group([
      condition('paymentMethod', 'CONTAINS', 'wire', 'string', 0),
      condition('country', 'EXISTS', null, 'string', 1),
    ]),
  },
  {
    name: 'Blacklisted Merchant',
    description: 'Placeholder blacklist rule matching configured merchant terms.',
    category: 'MERCHANT',
    severity: 'CRITICAL',
    enabled: true,
    priority: 140,
    weight: 50,
    conditionTree: group([condition('merchant', 'IN', ['Blacklisted Merchant'], 'array')]),
  },
  {
    name: 'Velocity Rule',
    description: 'Flags velocity signals when upstream transaction metadata provides a score.',
    category: 'CUSTOM',
    severity: 'HIGH',
    enabled: true,
    priority: 150,
    weight: 30,
    conditionTree: group([condition('metadata.velocityScore', 'GTE', 80, 'number')]),
  },
];
