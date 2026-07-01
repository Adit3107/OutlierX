import { z } from 'zod';
import type { DecisionEngineConfig } from '../types/decision-engine.types.js';

const configSchema = z.object({
  decisionVersion: z.string().min(1),
  decisionStrategy: z.string().min(1),
  signals: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    weight: z.number().positive(),
  })).min(1).refine(
    (signals) => Math.abs(signals.reduce((sum, signal) => sum + signal.weight, 0) - 1) < 0.0001,
    'Signal weights must total 1'
  ),
  riskThresholds: z.array(z.object({
    level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  })).length(4),
  recommendationThresholds: z.array(z.object({
    recommendation: z.enum(['APPROVE', 'MONITOR', 'MANUAL_REVIEW', 'BLOCK_TRANSACTION', 'ESCALATE']),
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  })).length(5),
});

export const decisionEngineConfig: DecisionEngineConfig = configSchema.parse({
  decisionVersion: '2026.07.02',
  decisionStrategy: 'weighted-rule-ml-v1',
  signals: [
    { key: 'rule', label: 'Rule Engine', weight: 0.6 },
    { key: 'ml', label: 'Machine Learning', weight: 0.4 },
  ],
  riskThresholds: [
    { level: 'LOW', min: 0, max: 39.99 },
    { level: 'MEDIUM', min: 40, max: 69.99 },
    { level: 'HIGH', min: 70, max: 89.99 },
    { level: 'CRITICAL', min: 90, max: 100 },
  ],
  recommendationThresholds: [
    { recommendation: 'APPROVE', min: 0, max: 39.99 },
    { recommendation: 'MONITOR', min: 40, max: 69.99 },
    { recommendation: 'MANUAL_REVIEW', min: 70, max: 84.99 },
    { recommendation: 'ESCALATE', min: 85, max: 94.99 },
    { recommendation: 'BLOCK_TRANSACTION', min: 95, max: 100 },
  ],
});
