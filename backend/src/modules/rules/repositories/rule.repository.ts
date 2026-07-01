import { AlertSeverity, Prisma, PrismaClient, RuleCategory, RuleExecutionSource } from '@prisma/client';
import type { RuleGroupNode } from '@anomaly/shared';
import { prisma } from '../../../lib/prisma.js';
import type { DefaultRuleDefinition } from '../constants/default-rules.js';
import type { RuleEvaluationSummary } from '../types/rule-engine.types.js';
import { toConditionTree, type RuleRecord } from '../utils/rule-mapper.js';

export interface RuleFilters {
  page: number;
  limit: number;
  search?: string;
  category?: RuleCategory;
  severity?: AlertSeverity;
  enabled?: boolean;
  sortBy: 'name' | 'category' | 'severity' | 'priority' | 'weight' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export interface RuleHistoryFilters {
  page: number;
  limit: number;
  ruleId?: string;
  transactionId?: string;
  matched?: boolean;
}

const includeRuleTree = {
  creator: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  groups: true,
  conditions: true,
} satisfies Prisma.RuleInclude;

export class RuleRepository {
  constructor(private db: PrismaClient = prisma) {}

  list(organizationId: string, filters: RuleFilters) {
    const where: Prisma.RuleWhereInput = {
      organizationId,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.enabled !== undefined ? { enabled: filters.enabled } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.db.$transaction([
      this.db.rule.findMany({
        where,
        include: includeRuleTree,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.rule.count({ where }),
    ]);
  }

  findById(organizationId: string, id: string) {
    return this.db.rule.findFirst({
      where: { id, organizationId },
      include: includeRuleTree,
    });
  }

  findEnabled(organizationId: string, ruleIds?: string[]) {
    return this.db.rule.findMany({
      where: {
        organizationId,
        enabled: true,
        ...(ruleIds && ruleIds.length > 0 ? { id: { in: ruleIds } } : {}),
      },
      include: includeRuleTree,
      orderBy: { priority: 'asc' },
    });
  }

  async create(
    organizationId: string,
    createdBy: string | null,
    data: {
      name: string;
      description?: string | null;
      category: RuleCategory;
      severity: AlertSeverity;
      enabled: boolean;
      priority: number;
      weight: number;
      conditionTree: RuleGroupNode;
    }
  ): Promise<RuleRecord> {
    return this.db.$transaction(async (tx) => {
      const rule = await tx.rule.create({
        data: {
          organizationId,
          createdBy,
          name: data.name,
          description: data.description,
          category: data.category,
          severity: data.severity,
          enabled: data.enabled,
          priority: data.priority,
          weight: data.weight,
        },
      });

      await this.createGroup(tx, rule.id, data.conditionTree, null, data.conditionTree.position ?? 0);
      return tx.rule.findUniqueOrThrow({ where: { id: rule.id }, include: includeRuleTree });
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: Partial<{
      name: string;
      description?: string | null;
      category: RuleCategory;
      severity: AlertSeverity;
      enabled: boolean;
      priority: number;
      weight: number;
      conditionTree: RuleGroupNode;
    }>
  ): Promise<RuleRecord | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return null;
    }

    return this.db.$transaction(async (tx) => {
      await tx.rule.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          severity: data.severity,
          enabled: data.enabled,
          priority: data.priority,
          weight: data.weight,
        },
      });

      if (data.conditionTree) {
        await tx.ruleCondition.deleteMany({ where: { ruleId: id } });
        await tx.ruleGroup.deleteMany({ where: { ruleId: id } });
        await this.createGroup(tx, id, data.conditionTree, null, data.conditionTree.position ?? 0);
      }

      return tx.rule.findUniqueOrThrow({ where: { id }, include: includeRuleTree });
    });
  }

  async delete(organizationId: string, id: string) {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return null;
    }
    return this.db.rule.delete({ where: { id } });
  }

  async setEnabled(organizationId: string, id: string, enabled: boolean) {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return null;
    }
    return this.db.rule.update({
      where: { id },
      data: { enabled },
      include: includeRuleTree,
    });
  }

  async duplicate(organizationId: string, createdBy: string, id: string): Promise<RuleRecord | null> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      return null;
    }

    return this.create(organizationId, createdBy, {
      name: `${existing.name} Copy`,
      description: existing.description,
      category: existing.category,
      severity: existing.severity,
      enabled: false,
      priority: existing.priority + 1,
      weight: existing.weight,
      conditionTree: existing.groups.length > 0
        ? toConditionTree(existing)
        : { type: 'group', operator: 'AND', children: [] },
    });
  }

  reorder(organizationId: string, items: Array<{ id: string; priority: number }>) {
    return this.db.$transaction(
      items.map((item) =>
        this.db.rule.updateMany({
          where: { id: item.id, organizationId },
          data: { priority: item.priority },
        })
      )
    );
  }

  findTransactions(organizationId: string, ids: string[]) {
    return this.db.transaction.findMany({
      where: { organizationId, id: { in: ids } },
    });
  }

  recordExecution(input: {
    organizationId: string;
    transactionId?: string | null;
    source: RuleExecutionSource;
    summary: RuleEvaluationSummary;
  }) {
    return this.db.ruleExecution.create({
      data: {
        organizationId: input.organizationId,
        transactionId: input.transactionId,
        source: input.source,
        finalScore: input.summary.finalScore,
        riskLevel: input.summary.riskLevel,
        executionTimeMs: input.summary.executionTimeMs,
        triggeredCount: input.summary.triggeredRules.length,
        results: {
          create: input.summary.results.map((result) => ({
            ruleId: result.ruleId,
            matched: result.matched,
            score: result.score,
            explanation: result.explanation,
          })),
        },
      },
      include: {
        results: {
          include: {
            rule: true,
          },
        },
      },
    });
  }

  history(organizationId: string, filters: RuleHistoryFilters) {
    const where: Prisma.RuleExecutionWhereInput = {
      organizationId,
      ...(filters.transactionId ? { transactionId: filters.transactionId } : {}),
      ...(filters.ruleId || filters.matched !== undefined
        ? {
            results: {
              some: {
                ...(filters.ruleId ? { ruleId: filters.ruleId } : {}),
                ...(filters.matched !== undefined ? { matched: filters.matched } : {}),
              },
            },
          }
        : {}),
    };

    return this.db.$transaction([
      this.db.ruleExecution.findMany({
        where,
        include: {
          transaction: {
            select: {
              id: true,
              transactionId: true,
              merchant: true,
              amount: true,
              currency: true,
            },
          },
          results: {
            include: {
              rule: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.db.ruleExecution.count({ where }),
    ]);
  }

  async provisionDefaults(organizationId: string, createdBy: string | null, defaults: DefaultRuleDefinition[]) {
    for (const definition of defaults) {
      const existing = await this.db.rule.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: definition.name,
          },
        },
      });
      if (!existing) {
        await this.create(organizationId, createdBy, definition);
      }
    }
  }

  private async createGroup(
    tx: Prisma.TransactionClient,
    ruleId: string,
    group: RuleGroupNode,
    parentGroupId: string | null,
    position: number
  ) {
    const created = await tx.ruleGroup.create({
      data: {
        ruleId,
        parentGroupId,
        operator: group.operator,
        position,
      },
    });

    for (const [index, child] of group.children.entries()) {
      const childPosition = child.position ?? index;
      if (child.type === 'group') {
        await this.createGroup(tx, ruleId, child, created.id, childPosition);
      } else {
        await tx.ruleCondition.create({
          data: {
            ruleId,
            groupId: created.id,
            field: child.field,
            operator: child.operator,
            value:
              child.value === undefined ? Prisma.JsonNull : (child.value as Prisma.InputJsonValue),
            dataType: child.dataType,
            position: childPosition,
          },
        });
      }
    }
  }
}
