import { AlertStatus, Prisma } from '@prisma/client';
import type { Alert, AlertDetail, PaginatedResponse } from '@anomaly/shared';
import { ActivityService } from '../../../services/foundation.service.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors.js';
import { AlertFilters, AlertRepository } from '../repositories/alert.repository.js';
import { toAlertDetailDto, toAlertDto } from '../dto/alert.dto.js';

type DecisionForAlert = {
  id: string;
  organizationId: string;
  transactionId: string;
  finalScore: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: Prisma.AlertUncheckedCreateInput['recommendation'];
  explanation: Prisma.JsonValue;
  processedAt: Date;
};

export class AlertService {
  constructor(
    private alertRepository: AlertRepository,
    private activityService: ActivityService
  ) {}

  async listAlerts(
    organizationId: string,
    filters: AlertFilters
  ): Promise<PaginatedResponse<Alert>> {
    const [items, total] = await this.alertRepository.list(organizationId, filters);
    return {
      items: items.map(toAlertDto),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getAlert(organizationId: string, id: string): Promise<AlertDetail> {
    const alert = await this.alertRepository.findById(organizationId, id);
    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return toAlertDetailDto(alert, []);
  }

  async createFromDecision(decision: DecisionForAlert, userId?: string | null): Promise<Alert> {
    const existing = await this.alertRepository.findByDecision(decision.id);
    if (existing) {
      return toAlertDto(existing);
    }

    const explanation = decision.explanation as any;
    const triggeredRules = explanation?.ruleBreakdown?.triggeredRules ?? [];
    const title = `${this.toTitle(decision.riskLevel)} risk decision`;
    const created = await this.alertRepository.create({
      organizationId: decision.organizationId,
      userId: userId ?? null,
      decisionId: decision.id,
      transactionId: decision.transactionId,
      severity: decision.riskLevel,
      title,
      description: explanation?.summary ?? 'Decision Engine generated an alert from stored analysis.',
      riskScore: decision.finalScore,
      confidence: decision.confidence,
      triggeredRules: triggeredRules as Prisma.InputJsonValue,
      recommendation: decision.recommendation,
      createdAt: decision.processedAt,
    });

    await this.activityService.log({
      organizationId: decision.organizationId,
      userId,
      action: 'alert.created',
      entity: 'ALERT',
      entityId: created.id,
      metadata: {
        decisionId: decision.id,
        transactionId: decision.transactionId,
        severity: decision.riskLevel,
      },
    });

    return toAlertDto(created);
  }

  async updateAlert(
    organizationId: string,
    userId: string,
    id: string,
    payload: { isRead?: boolean; status?: AlertStatus; assignedAnalystId?: string | null }
  ): Promise<Alert> {
    const existing = await this.alertRepository.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundError('Alert not found');
    }

    const statusData = this.statusMutation(payload.status);
    const updated = await this.alertRepository.update(organizationId, id, {
      ...(payload.isRead !== undefined ? { isRead: payload.isRead } : {}),
      ...(payload.assignedAnalystId !== undefined ? { assignedAnalystId: payload.assignedAnalystId } : {}),
      ...statusData,
    });

    await this.activityService.log({
      organizationId,
      userId,
      action: this.actionForUpdate(payload.status),
      entity: 'ALERT',
      entityId: id,
      metadata: payload,
    });

    return toAlertDto(updated);
  }

  async bulkAction(
    organizationId: string,
    userId: string,
    payload: {
      ids: string[];
      action: 'MARK_READ' | 'MARK_UNREAD' | 'RESOLVE' | 'REOPEN' | 'ARCHIVE' | 'DELETE';
    }
  ) {
    if (payload.ids.length === 0) {
      throw new BadRequestError('At least one alert id is required');
    }

    const data = this.bulkMutation(payload.action);
    const result = await this.alertRepository.bulkUpdate(organizationId, payload.ids, data);
    await this.activityService.log({
      organizationId,
      userId,
      action: payload.action === 'DELETE' ? 'alert.deleted' : `alert.${payload.action.toLowerCase()}`,
      entity: 'ALERT',
      metadata: { count: result.count, ids: payload.ids },
    });

    return { action: payload.action, count: result.count };
  }

  private statusMutation(status?: AlertStatus): Prisma.AlertUpdateInput {
    if (!status) {
      return {};
    }

    if (status === 'RESOLVED') {
      return { status, resolvedAt: new Date(), archivedAt: null };
    }

    if (status === 'ARCHIVED') {
      return { status, archivedAt: new Date() };
    }

    return { status: 'OPEN', resolvedAt: null, archivedAt: null };
  }

  private bulkMutation(action: string): Prisma.AlertUpdateManyMutationInput {
    if (action === 'MARK_READ') {
      return { isRead: true };
    }
    if (action === 'MARK_UNREAD') {
      return { isRead: false };
    }
    if (action === 'RESOLVE') {
      return { status: 'RESOLVED', resolvedAt: new Date(), archivedAt: null };
    }
    if (action === 'REOPEN') {
      return { status: 'OPEN', resolvedAt: null, archivedAt: null };
    }
    if (action === 'ARCHIVE') {
      return { status: 'ARCHIVED', archivedAt: new Date() };
    }
    return { deletedAt: new Date() };
  }

  private actionForUpdate(status?: AlertStatus) {
    if (status === 'RESOLVED') {
      return 'alert.resolved';
    }
    if (status === 'ARCHIVED') {
      return 'alert.archived';
    }
    return 'alert.updated';
  }

  private toTitle(severity: string) {
    return `${severity.slice(0, 1)}${severity.slice(1).toLowerCase()}`;
  }
}
