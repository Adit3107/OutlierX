import type {
  AlertSeverity,
  ConditionOperator,
  LogicalOperator,
  RuleCategory,
  RuleExecutionSource,
} from '@prisma/client';

export type RuleDataType = 'string' | 'number' | 'date' | 'boolean' | 'array';

export interface RuleTransaction {
  id?: string;
  transactionId?: string;
  timestamp: Date | string;
  amount: number;
  currency: string;
  merchant: string;
  merchantCategory?: string | null;
  accountNumber?: string | null;
  country?: string | null;
  city?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  customerId?: string | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CompiledCondition {
  type: 'condition';
  id?: string;
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  dataType: RuleDataType;
  position: number;
}

export interface CompiledGroup {
  type: 'group';
  id?: string;
  operator: LogicalOperator;
  position: number;
  children: CompiledNode[];
}

export type CompiledNode = CompiledCondition | CompiledGroup;

export interface CompiledRule {
  id: string;
  name: string;
  description?: string | null;
  category: RuleCategory;
  severity: AlertSeverity;
  enabled: boolean;
  priority: number;
  weight: number;
  conditionTree: CompiledGroup;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: AlertSeverity;
  matched: boolean;
  score: number;
  explanation: string;
}

export interface RuleEvaluationSummary {
  finalScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredRules: RuleEvaluationResult[];
  results: RuleEvaluationResult[];
  executionTimeMs: number;
  source: RuleExecutionSource;
}
