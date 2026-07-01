import type { CompiledCondition, CompiledNode, CompiledRule } from '../types/rule-engine.types.js';

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatValue).join(', ');
  }
  if (value === null || value === undefined || value === '') {
    return 'a configured value';
  }
  return String(value);
}

function operatorText(operator: CompiledCondition['operator']): string {
  const labels: Record<CompiledCondition['operator'], string> = {
    EQ: 'equaled',
    NEQ: 'did not equal',
    GT: 'exceeded',
    GTE: 'met or exceeded',
    LT: 'was below',
    LTE: 'was at or below',
    CONTAINS: 'contained',
    NOT_CONTAINS: 'did not contain',
    IN: 'matched one of',
    NOT_IN: 'did not match any of',
    EXISTS: 'was present',
    MISSING: 'was missing',
    BETWEEN: 'was between',
  };
  return labels[operator];
}

function collectConditions(node: CompiledNode): CompiledCondition[] {
  if (node.type === 'condition') {
    return [node];
  }
  return node.children.flatMap(collectConditions);
}

export class ExplanationGenerator {
  generate(rule: CompiledRule): string {
    const condition = collectConditions(rule.conditionTree)[0];
    if (!condition) {
      return `${rule.name} matched because its configured condition group evaluated successfully.`;
    }

    if (rule.category === 'AMOUNT') {
      return `Transaction amount ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }
    if (rule.category === 'LOCATION') {
      return `Transaction location ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }
    if (rule.category === 'MERCHANT') {
      return `Merchant ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }
    if (rule.category === 'TIME') {
      return `Transaction time ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }
    if (rule.category === 'ACCOUNT') {
      return `Account or reference field ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }
    if (rule.category === 'DEVICE') {
      return `Device field ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
    }

    return `Custom field ${condition.field} ${operatorText(condition.operator)} ${formatValue(condition.value)}.`;
  }
}
