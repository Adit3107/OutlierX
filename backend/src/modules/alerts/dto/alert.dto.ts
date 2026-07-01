import type { Prisma } from '@prisma/client';
import type { Alert, AlertDetail, ActivityLog, RuleResult } from '@anomaly/shared';
import { toDecisionDto } from '../../decision-engine/dto/decision.dto.js';

type AlertWithRelations = Prisma.AlertGetPayload<{
  include: {
    transaction: true;
    decision: true;
    assignedAnalyst: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        avatar: true;
      };
    };
  };
}>;

export function toAlertDto(alert: AlertWithRelations): Alert {
  return {
    id: alert.id,
    organizationId: alert.organizationId,
    userId: alert.userId,
    decisionId: alert.decisionId,
    transactionId: alert.transactionId,
    assignedAnalystId: alert.assignedAnalystId,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    riskScore: alert.riskScore,
    confidence: alert.confidence,
    triggeredRules: (alert.triggeredRules as RuleResult[] | null) ?? null,
    recommendation: alert.recommendation,
    status: alert.status,
    isRead: alert.isRead,
    resolvedAt: alert.resolvedAt,
    archivedAt: alert.archivedAt,
    deletedAt: alert.deletedAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
    assignedAnalyst: alert.assignedAnalyst,
    transaction: alert.transaction
      ? {
          id: alert.transaction.id,
          transactionId: alert.transaction.transactionId,
          merchant: alert.transaction.merchant,
          amount: Number(alert.transaction.amount),
          currency: alert.transaction.currency,
          country: alert.transaction.country,
          paymentMethod: alert.transaction.paymentMethod,
          timestamp: alert.transaction.timestamp,
        }
      : null,
    decision: alert.decision ? toDecisionDto(alert.decision) : null,
  };
}

export function toAlertDetailDto(alert: AlertWithRelations, activity: ActivityLog[]): AlertDetail {
  return {
    ...toAlertDto(alert),
    activity,
  };
}
