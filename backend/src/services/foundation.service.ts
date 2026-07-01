import crypto from 'crypto';
import {
  ActivityEntity,
  ApiKeyStatus,
  MembershipStatus,
  PaginatedResponse,
  Role,
} from '@anomaly/shared';
import { Prisma } from '@prisma/client';
import {
  ActivityRepository,
  ApiKeyRepository,
  MemberRepository,
  OrganizationRepository,
} from '../repositories/foundation.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export class ActivityService {
  constructor(private activityRepository: ActivityRepository) {}

  async log(data: {
    organizationId: string;
    userId?: string | null;
    action: string;
    entity: ActivityEntity;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return this.activityRepository.create({
      organizationId: data.organizationId,
      userId: data.userId ?? null,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId ?? null,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    });
  }

  async list(organizationId: string, pagination: { page: number; limit: number }) {
    const [items, total] = await this.activityRepository.list(organizationId, pagination);
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    } satisfies PaginatedResponse<(typeof items)[number]>;
  }
}

export class OrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private activityService: ActivityService
  ) {}

  async update(
    organizationId: string,
    userId: string,
    payload: {
      name?: string;
      slug?: string;
      logo?: string | null;
      industry?: string | null;
      website?: string | null;
    }
  ) {
    if (payload.slug) {
      const existing = await this.organizationRepository.findBySlug(payload.slug);
      if (existing && existing.id !== organizationId) {
        throw new ConflictError('Organization slug is already in use');
      }
    }

    const organization = await this.organizationRepository.update(organizationId, payload);
    await this.activityService.log({
      organizationId,
      userId,
      action: 'organization.updated',
      entity: 'ORGANIZATION',
      entityId: organization.id,
      metadata: payload,
    });

    return organization;
  }
}

export class MemberService {
  constructor(
    private memberRepository: MemberRepository,
    private activityService: ActivityService
  ) {}

  list(organizationId: string) {
    return this.memberRepository.list(organizationId);
  }

  async create(
    organizationId: string,
    actorUserId: string,
    payload: { email: string; role: Role }
  ) {
    if (payload.role === 'OWNER') {
      throw new BadRequestError('Owners must be promoted through member update');
    }

    const user = await this.memberRepository.findUserByEmail(payload.email);
    if (!user) {
      throw new NotFoundError('User must sign in before they can be added as a member');
    }

    const existing = await this.memberRepository.findByUser(organizationId, user.id);
    if (existing) {
      throw new ConflictError('User is already a member of this organization');
    }

    const membership = await this.memberRepository.create({
      organizationId,
      userId: user.id,
      role: payload.role,
    });

    await this.activityService.log({
      organizationId,
      userId: actorUserId,
      action: 'member.created',
      entity: 'MEMBERSHIP',
      entityId: membership.id,
      metadata: { memberUserId: user.id, role: payload.role },
    });

    return membership;
  }

  async update(
    organizationId: string,
    actorUserId: string,
    membershipId: string,
    payload: { role?: Role; status?: MembershipStatus }
  ) {
    const membership = await this.memberRepository.findById(membershipId, organizationId);
    if (!membership) {
      throw new NotFoundError('Membership not found');
    }

    if (membership.role === 'OWNER' && payload.role && payload.role !== 'OWNER') {
      await this.ensureAnotherOwner(organizationId, membership.userId);
    }

    const updated = await this.memberRepository.update(membershipId, payload);
    await this.activityService.log({
      organizationId,
      userId: actorUserId,
      action: 'member.updated',
      entity: 'MEMBERSHIP',
      entityId: updated.id,
      metadata: payload,
    });

    return updated;
  }

  async delete(organizationId: string, actorUserId: string, membershipId: string) {
    const membership = await this.memberRepository.findById(membershipId, organizationId);
    if (!membership) {
      throw new NotFoundError('Membership not found');
    }

    if (membership.userId === actorUserId && membership.role === 'OWNER') {
      throw new ForbiddenError('Owners cannot remove their own owner membership');
    }

    if (membership.role === 'OWNER') {
      await this.ensureAnotherOwner(organizationId, membership.userId);
    }

    await this.memberRepository.delete(membershipId);
    await this.activityService.log({
      organizationId,
      userId: actorUserId,
      action: 'member.deleted',
      entity: 'MEMBERSHIP',
      entityId: membershipId,
      metadata: { memberUserId: membership.userId },
    });

    return { id: membershipId };
  }

  private async ensureAnotherOwner(organizationId: string, excludedUserId: string) {
    const owners = (await this.memberRepository.list(organizationId)).filter(
      (membership) =>
        membership.role === 'OWNER' &&
        membership.status === 'ACTIVE' &&
        membership.userId !== excludedUserId
    );

    if (owners.length === 0) {
      throw new ForbiddenError('Organization must keep at least one active owner');
    }
  }
}

export class ApiKeyService {
  constructor(
    private apiKeyRepository: ApiKeyRepository,
    private activityService: ActivityService
  ) {}

  async list(organizationId: string, status?: ApiKeyStatus) {
    const keys = await this.apiKeyRepository.list(organizationId, status);
    return keys.map((key) => ({
      ...key,
      keyHash: undefined,
      keyPreview: `${key.id.slice(0, 8)}...`,
    }));
  }

  async create(
    organizationId: string,
    userId: string,
    payload: { name: string; expiresAt?: string }
  ) {
    const rawKey = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : undefined;

    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestError('API key expiration must be in the future');
    }

    const apiKey = await this.apiKeyRepository.create({
      organizationId,
      createdById: userId,
      name: payload.name,
      keyHash,
      expiresAt,
    });

    await this.activityService.log({
      organizationId,
      userId,
      action: 'api_key.created',
      entity: 'API_KEY',
      entityId: apiKey.id,
      metadata: { name: payload.name },
    });

    return {
      ...apiKey,
      keyHash: undefined,
      key: rawKey,
      keyPreview: `${rawKey.slice(0, 10)}...`,
    };
  }

  async delete(organizationId: string, userId: string, apiKeyId: string) {
    const apiKey = await this.apiKeyRepository.findById(apiKeyId, organizationId);
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    const revoked = await this.apiKeyRepository.updateStatus(apiKey.id, 'REVOKED');
    await this.activityService.log({
      organizationId,
      userId,
      action: 'api_key.revoked',
      entity: 'API_KEY',
      entityId: apiKey.id,
      metadata: { name: apiKey.name },
    });

    return {
      ...revoked,
      keyHash: undefined,
    };
  }
}
