import {
  RuleCreateSchema,
  RuleEvaluateSchema,
  RuleHistoryQuerySchema,
  RuleQuerySchema,
  RuleReorderSchema,
  RuleTestSchema,
  RuleUpdateSchema,
} from '@anomaly/shared';

export const ruleCreateValidator = RuleCreateSchema;
export const ruleUpdateValidator = RuleUpdateSchema;
export const ruleQueryValidator = RuleQuerySchema;
export const ruleHistoryQueryValidator = RuleHistoryQuerySchema;
export const ruleReorderValidator = RuleReorderSchema;
export const ruleTestValidator = RuleTestSchema;
export const ruleEvaluateValidator = RuleEvaluateSchema;
