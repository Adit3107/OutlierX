import { Prisma, PrismaClient } from '@prisma/client';
import {
  AdminDashboardPayload,
  NotificationPreferences,
  SettingsPayload,
  SystemHealthPayload,
} from '@anomaly/shared';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { ActivityService, OrganizationService } from './foundation.service.js';
import { ActivityRepository, OrganizationRepository } from '../repositories/foundation.repository.js';
import { BadRequestError } from '../utils/errors.js';

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  email: true,
  browser: true,
  criticalAlerts: true,
  highAlerts: true,
  weeklySummary: true,
  marketing: false,
};

function normalizeNotifications(value: Prisma.JsonValue | null | undefined): NotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_NOTIFICATIONS;
  }

  return {
    ...DEFAULT_NOTIFICATIONS,
    ...(value as Partial<NotificationPreferences>),
  };
}

export class ProfileService {
  constructor(
    private db: PrismaClient = prisma,
    private activityService = new ActivityService(new ActivityRepository())
  ) {}

  async get(userId: string, organizationId: string, membershipId: string) {
    const [user, organization, membership, recentActivity] = await Promise.all([
      this.db.user.findUniqueOrThrow({ where: { id: userId } }),
      this.db.organization.findUniqueOrThrow({ where: { id: organizationId } }),
      this.db.membership.findUniqueOrThrow({
        where: { id: membershipId },
        include: { user: true },
      }),
      this.db.activityLog.findMany({
        where: { organizationId, userId },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    return {
      user,
      organization,
      membership,
      recentActivity,
      preferences: {
        theme: user.theme,
        language: user.language,
        timezone: user.timezone,
        notifications: normalizeNotifications(user.notificationPreferences),
      },
    };
  }

  async update(
    userId: string,
    organizationId: string,
    payload: {
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
      theme?: string;
      language?: string;
      timezone?: string;
      notificationPreferences?: Partial<NotificationPreferences>;
    }
  ) {
    const existing = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    const notificationPreferences = payload.notificationPreferences
      ? {
          ...normalizeNotifications(existing.notificationPreferences),
          ...payload.notificationPreferences,
        }
      : undefined;

    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        avatar: payload.avatar,
        theme: payload.theme,
        language: payload.language,
        timezone: payload.timezone,
        notificationPreferences: notificationPreferences as Prisma.InputJsonValue | undefined,
      },
    });

    await this.activityService.log({
      organizationId,
      userId,
      action: 'profile.updated',
      entity: 'USER',
      entityId: userId,
      metadata: { fields: Object.keys(payload) },
    });

    return user;
  }
}

export class SettingsService {
  constructor(
    private db: PrismaClient = prisma,
    private organizationService = new OrganizationService(
      new OrganizationRepository(),
      new ActivityService(new ActivityRepository())
    ),
    private profileService = new ProfileService(db)
  ) {}

  async get(userId: string, organizationId: string): Promise<SettingsPayload> {
    const [organization, user, usage] = await Promise.all([
      this.db.organization.findUniqueOrThrow({ where: { id: organizationId } }),
      this.db.user.findUniqueOrThrow({ where: { id: userId } }),
      this.organizationService.usage(organizationId),
    ]);

    return {
      organization,
      user,
      usage,
      notifications: normalizeNotifications(user.notificationPreferences),
    };
  }

  async update(userId: string, organizationId: string, payload: any) {
    if (payload.organization) {
      await this.organizationService.update(organizationId, userId, payload.organization);
    }

    const profilePatch = {
      theme: payload.theme,
      language: payload.language,
      timezone: payload.timezone,
      notificationPreferences: payload.notificationPreferences,
    };

    if (Object.values(profilePatch).some((value) => value !== undefined)) {
      await this.profileService.update(userId, organizationId, profilePatch);
    }

    return this.get(userId, organizationId);
  }
}

export class SystemHealthService {
  constructor(private db: PrismaClient = prisma) {}

  async get(): Promise<SystemHealthPayload> {
    let databaseStatus: SystemHealthPayload['databaseStatus'] = 'CONNECTED';
    let mlServiceStatus: SystemHealthPayload['mlServiceStatus'] = 'DOWN';
    let modelVersion = 'unknown';

    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = 'DISCONNECTED';
    }

    try {
      const response = await fetch(`${config.mlService.url.replace(/\/$/, '')}/version`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const body = (await response.json()) as { version?: string };
        mlServiceStatus = 'UP';
        modelVersion = body.version ?? modelVersion;
      }
    } catch {
      mlServiceStatus = 'DOWN';
    }

    return {
      backendStatus: 'UP',
      mlServiceStatus,
      databaseStatus,
      storageStatus: config.storage.provider ? 'READY' : 'DEGRADED',
      apiVersion: '1.0.0-beta',
      modelVersion,
      environment: config.server.env,
      timestamp: new Date(),
    };
  }
}

export class AdminService {
  constructor(
    private db: PrismaClient = prisma,
    private healthService = new SystemHealthService(db)
  ) {}

  async dashboard(): Promise<AdminDashboardPayload> {
    const [
      organizations,
      users,
      uploads,
      transactions,
      alerts,
      apiKeys,
      recentOrganizations,
      recentUsers,
      recentUploads,
      recentAlerts,
      recentActivity,
      health,
    ] = await Promise.all([
      this.db.organization.count(),
      this.db.user.count(),
      this.db.upload.count(),
      this.db.transaction.count(),
      this.db.alert.count({ where: { deletedAt: null } }),
      this.db.apiKey.count(),
      this.db.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
      this.db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
      this.db.upload.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
      this.db.alert.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 8 }),
      this.db.activityLog.findMany({
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.healthService.get(),
    ]);

    return {
      totals: { organizations, users, uploads, transactions, alerts, apiKeys },
      recentOrganizations,
      recentUsers,
      recentUploads,
      recentAlerts,
      recentActivity,
      health,
    } as AdminDashboardPayload;
  }
}

export class OpenApiService {
  getDocument(baseUrl: string) {
    if (!baseUrl) {
      throw new BadRequestError('Base URL is required');
    }

    const secured = [{ bearerAuth: [] }];
    const path = (summary: string, method = 'get', security = secured) => ({
      [method]: {
        summary,
        security,
        responses: {
          '200': { description: 'Success' },
          '201': { description: 'Created' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    });

    return {
      openapi: '3.0.3',
      info: {
        title: 'OutlierX API',
        version: '1.0.0-beta',
        description: 'Versioned API for OutlierX enterprise anomaly operations.',
      },
      servers: [{ url: baseUrl }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Clerk JWT' },
        },
      },
      paths: {
        '/health': path('Public backend health', 'get', []),
        '/status': path('Public backend runtime status', 'get', []),
        '/version': path('Public backend API version', 'get', []),
        '/auth/me': path('Current authenticated context'),
        '/profile': { ...path('Get current profile'), ...path('Update current profile', 'patch') },
        '/settings': { ...path('Get current settings'), ...path('Update current settings', 'patch') },
        '/admin/dashboard': path('Admin global dashboard'),
        '/system/health': path('Enterprise system health'),
        '/organization': { ...path('Get organization'), ...path('Update organization', 'patch'), ...path('Delete organization', 'delete') },
        '/organization/usage': path('Get organization usage'),
        '/organization/transfer-ownership': path('Transfer ownership', 'post'),
        '/members': { ...path('List members'), ...path('Create member', 'post') },
        '/members/{id}': { ...path('Update member', 'patch'), ...path('Remove member', 'delete') },
        '/team': { ...path('List team'), ...path('Invite team member', 'post') },
        '/team/invite': path('Invite team member', 'post'),
        '/team/{id}': { ...path('Update team member', 'patch'), ...path('Remove team member', 'delete') },
        '/team/{id}/resend-invitation': path('Resend invitation placeholder', 'post'),
        '/api-keys': { ...path('List API keys'), ...path('Create API key', 'post') },
        '/api-keys/{id}': { ...path('Update, rotate, or revoke API key', 'patch'), ...path('Revoke API key', 'delete') },
        '/activity': path('List activity logs'),
        '/dashboard/summary': path('Dashboard summary'),
        '/dashboard/charts': path('Dashboard charts'),
        '/dashboard/activity': path('Dashboard activity'),
        '/analytics': path('Analytics payload'),
        '/alerts': path('List alerts'),
        '/alerts/{id}': { ...path('Get alert'), ...path('Update alert', 'patch') },
        '/alerts/bulk': path('Bulk alert action', 'post'),
        '/uploads': { ...path('List uploads'), ...path('Upload CSV', 'post') },
        '/uploads/{id}': { ...path('Get upload'), ...path('Delete upload', 'delete') },
        '/uploads/{id}/transactions': path('List transactions by upload'),
        '/transactions': { ...path('List transactions'), ...path('Bulk delete transactions', 'delete') },
        '/transactions/export': path('Export transactions'),
        '/transactions/{id}': { ...path('Get transaction'), ...path('Delete transaction', 'delete') },
        '/transactions/{id}/decision': path('Get transaction decision'),
        '/transactions/{id}/ml-prediction': path('Request ML prediction', 'post'),
        '/decisions': path('List decisions'),
        '/decisions/recalculate': path('Recalculate decisions', 'post'),
        '/decisions/test': path('Test decision engine', 'post'),
        '/decisions/{id}': path('Get decision'),
        '/rules': { ...path('List rules'), ...path('Create rule', 'post') },
        '/rules/{id}': { ...path('Get rule'), ...path('Update rule', 'patch'), ...path('Delete rule', 'delete') },
        '/rules/test': path('Test rules', 'post'),
        '/rules/evaluate': path('Evaluate rules', 'post'),
        '/rules/history': path('Rule execution history'),
      },
    };
  }
}
