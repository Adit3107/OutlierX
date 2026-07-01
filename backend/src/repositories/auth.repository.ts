import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export type AuthUserWithContext = Prisma.UserGetPayload<{
  include: {
    currentOrganization: true;
    memberships: {
      include: {
        organization: true;
      };
      orderBy: {
        joinedAt: 'asc';
      };
    };
  };
}>;

export class AuthRepository {
  constructor(private db: PrismaClient = prisma) {}

  findUserByClerkId(clerkUserId: string): Promise<AuthUserWithContext | null> {
    return this.db.user.findUnique({
      where: { clerkUserId },
      include: {
        currentOrganization: true,
        memberships: {
          include: { organization: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  }

  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  upsertUser(data: {
    clerkUserId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  }) {
    return this.db.user.upsert({
      where: { clerkUserId: data.clerkUserId },
      create: {
        clerkUserId: data.clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
      },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
      },
    });
  }

  createOrganization(data: { name: string; slug: string }) {
    return this.db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    });
  }

  findOrganizationBySlug(slug: string) {
    return this.db.organization.findUnique({
      where: { slug },
    });
  }

  upsertOwnerMembership(userId: string, organizationId: string) {
    return this.db.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      create: {
        organizationId,
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
      update: {
        role: 'OWNER',
        status: 'ACTIVE',
      },
      include: {
        organization: true,
      },
    });
  }

  updateCurrentOrganization(userId: string, organizationId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { currentOrganizationId: organizationId },
    });
  }

  findMembership(userId: string, organizationId: string) {
    return this.db.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: true,
        user: true,
      },
    });
  }
}
