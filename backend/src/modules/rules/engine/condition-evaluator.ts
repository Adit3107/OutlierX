import type { CompiledCondition, CompiledGroup, CompiledNode, RuleTransaction } from '../types/rule-engine.types.js';

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function valueAtPath(input: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, input);
}

function normalizeString(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeDate(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

function evaluationContext(transaction: RuleTransaction): Record<string, unknown> {
  const timestamp = new Date(transaction.timestamp);
  const validTimestamp = !Number.isNaN(timestamp.getTime());
  const day = validTimestamp ? timestamp.getUTCDay() : null;

  return {
    ...transaction,
    transactionHour: validTimestamp ? timestamp.getUTCHours() : null,
    transactionDay: day,
    isWeekend: day === 0 || day === 6,
  } satisfies Record<string, unknown>;
}

export class ConditionEvaluator {
  evaluate(node: CompiledNode, transaction: RuleTransaction): boolean {
    if (node.type === 'group') {
      return this.evaluateGroup(node, transaction);
    }
    return this.evaluateCondition(node, transaction);
  }

  private evaluateGroup(group: CompiledGroup, transaction: RuleTransaction): boolean {
    if (group.children.length === 0) {
      return false;
    }

    return group.operator === 'AND'
      ? group.children.every((child) => this.evaluate(child, transaction))
      : group.children.some((child) => this.evaluate(child, transaction));
  }

  private evaluateCondition(condition: CompiledCondition, transaction: RuleTransaction): boolean {
    const actual = valueAtPath(evaluationContext(transaction), condition.field);

    if (condition.operator === 'EXISTS') {
      return !isEmpty(actual);
    }
    if (condition.operator === 'MISSING') {
      return isEmpty(actual);
    }

    if (isEmpty(actual)) {
      return false;
    }

    if (condition.operator === 'IN' || condition.operator === 'NOT_IN') {
      const values = asArray(condition.value).map(normalizeString);
      const contains = values.includes(normalizeString(actual));
      return condition.operator === 'IN' ? contains : !contains;
    }

    if (condition.operator === 'CONTAINS' || condition.operator === 'NOT_CONTAINS') {
      const contains = normalizeString(actual).includes(normalizeString(condition.value));
      return condition.operator === 'CONTAINS' ? contains : !contains;
    }

    if (condition.operator === 'BETWEEN') {
      const range = asArray(condition.value);
      if (range.length < 2) {
        return false;
      }
      return condition.dataType === 'date'
        ? this.compareBetweenDates(actual, range[0], range[1])
        : this.compareBetweenNumbers(actual, range[0], range[1]);
    }

    if (condition.dataType === 'number') {
      return this.compareNumbers(actual, condition.operator, condition.value);
    }
    if (condition.dataType === 'date') {
      return this.compareDates(actual, condition.operator, condition.value);
    }
    if (condition.dataType === 'boolean') {
      return this.compareBooleans(actual, condition.operator, condition.value);
    }

    return this.compareStrings(actual, condition.operator, condition.value);
  }

  private compareNumbers(actualValue: unknown, operator: CompiledCondition['operator'], expectedValue: unknown) {
    const actual = normalizeNumber(actualValue);
    const expected = normalizeNumber(expectedValue);
    if (actual === null || expected === null) {
      return false;
    }

    switch (operator) {
      case 'EQ':
        return actual === expected;
      case 'NEQ':
        return actual !== expected;
      case 'GT':
        return actual > expected;
      case 'GTE':
        return actual >= expected;
      case 'LT':
        return actual < expected;
      case 'LTE':
        return actual <= expected;
      default:
        return false;
    }
  }

  private compareDates(actualValue: unknown, operator: CompiledCondition['operator'], expectedValue: unknown) {
    const actual = normalizeDate(actualValue);
    const expected = normalizeDate(expectedValue);
    if (actual === null || expected === null) {
      return false;
    }

    switch (operator) {
      case 'EQ':
        return actual === expected;
      case 'NEQ':
        return actual !== expected;
      case 'GT':
        return actual > expected;
      case 'GTE':
        return actual >= expected;
      case 'LT':
        return actual < expected;
      case 'LTE':
        return actual <= expected;
      default:
        return false;
    }
  }

  private compareBooleans(actualValue: unknown, operator: CompiledCondition['operator'], expectedValue: unknown) {
    const actual = Boolean(actualValue);
    const expected = Boolean(expectedValue);
    if (operator === 'EQ') {
      return actual === expected;
    }
    if (operator === 'NEQ') {
      return actual !== expected;
    }
    return false;
  }

  private compareStrings(actualValue: unknown, operator: CompiledCondition['operator'], expectedValue: unknown) {
    const actual = normalizeString(actualValue);
    const expected = normalizeString(expectedValue);

    switch (operator) {
      case 'EQ':
        return actual === expected;
      case 'NEQ':
        return actual !== expected;
      case 'GT':
        return actual > expected;
      case 'GTE':
        return actual >= expected;
      case 'LT':
        return actual < expected;
      case 'LTE':
        return actual <= expected;
      default:
        return false;
    }
  }

  private compareBetweenNumbers(actualValue: unknown, startValue: unknown, endValue: unknown) {
    const actual = normalizeNumber(actualValue);
    const start = normalizeNumber(startValue);
    const end = normalizeNumber(endValue);
    return actual !== null && start !== null && end !== null && actual >= start && actual <= end;
  }

  private compareBetweenDates(actualValue: unknown, startValue: unknown, endValue: unknown) {
    const actual = normalizeDate(actualValue);
    const start = normalizeDate(startValue);
    const end = normalizeDate(endValue);
    return actual !== null && start !== null && end !== null && actual >= start && actual <= end;
  }
}
