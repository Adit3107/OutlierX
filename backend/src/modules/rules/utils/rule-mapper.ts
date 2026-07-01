import type { Prisma, RuleCondition, RuleGroup } from '@prisma/client';
import type { Rule, RuleConditionNode, RuleGroupNode, RuleResult } from '@anomaly/shared';
import type { CompiledGroup, CompiledRule } from '../types/rule-engine.types.js';

export type RuleRecord = Prisma.RuleGetPayload<{
  include: {
    creator: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    groups: true;
    conditions: true;
  };
}>;

function buildGroup(
  group: RuleGroup,
  groups: RuleGroup[],
  conditions: RuleCondition[]
): RuleGroupNode {
  const childGroups = groups
    .filter((item) => item.parentGroupId === group.id)
    .sort((left, right) => left.position - right.position)
    .map((item) => buildGroup(item, groups, conditions));

  const childConditions: RuleConditionNode[] = conditions
    .filter((item) => item.groupId === group.id)
    .sort((left, right) => left.position - right.position)
    .map((item) => ({
      type: 'condition',
      id: item.id,
      field: item.field,
      operator: item.operator,
      value: item.value,
      dataType: item.dataType as RuleConditionNode['dataType'],
      position: item.position,
    }));

  return {
    type: 'group',
    id: group.id,
    operator: group.operator,
    position: group.position,
    children: [...childGroups, ...childConditions].sort(
      (left, right) => (left.position ?? 0) - (right.position ?? 0)
    ),
  };
}

export function toConditionTree(rule: Pick<RuleRecord, 'groups' | 'conditions'>): RuleGroupNode {
  const root = rule.groups.find((group) => !group.parentGroupId) ?? rule.groups[0];
  if (!root) {
    return { type: 'group', operator: 'AND', children: [] };
  }
  return buildGroup(root, rule.groups, rule.conditions);
}

export function toRuleDto(rule: RuleRecord): Rule {
  return {
    id: rule.id,
    organizationId: rule.organizationId,
    name: rule.name,
    description: rule.description,
    category: rule.category,
    severity: rule.severity,
    enabled: rule.enabled,
    priority: rule.priority,
    weight: rule.weight,
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    conditionTree: toConditionTree(rule),
    createdByUser: rule.creator,
  };
}

export function toCompiledRule(rule: RuleRecord): CompiledRule {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    category: rule.category,
    severity: rule.severity,
    enabled: rule.enabled,
    priority: rule.priority,
    weight: rule.weight,
    conditionTree: toConditionTree(rule) as CompiledGroup,
  };
}

export function toRuleResultDto(input: {
  id?: string;
  ruleId: string;
  ruleName: string;
  category: RuleResult['category'];
  severity: RuleResult['severity'];
  matched: boolean;
  score: number;
  explanation: string;
}): RuleResult {
  return input;
}
