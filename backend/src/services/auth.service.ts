import { AuthContext } from '@anomaly/shared';
import { User } from '@clerk/backend';
import { getPermissionsForRole } from '../config/permissions.js';
import { ConflictError, InternalServerError, UnauthorizedError } from '../utils/errors.js';
import { AuthRepository } from '../repositories/auth.repository.js';

export interface ClerkProfile {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'personal-organization';
}

export function mapClerkUserToProfile(clerkUser: User, clerkUserId: string): ClerkProfile {
  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId
  );
  const email = primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new UnauthorizedError('Authenticated Clerk user has no email address');
  }

  return {
    clerkUserId,
    email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    avatar: clerkUser.imageUrl,
  };
}

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async syncAuthenticatedUser(profile: ClerkProfile): Promise<AuthContext> {
    const existingEmailUser = await this.authRepository.findUserByEmail(profile.email);
    if (existingEmailUser && existingEmailUser.clerkUserId !== profile.clerkUserId) {
      throw new ConflictError('Email address is already associated with another account');
    }

    const user = await this.authRepository.upsertUser(profile);
    let hydratedUser = await this.authRepository.findUserByClerkId(profile.clerkUserId);

    if (!hydratedUser) {
      throw new InternalServerError('Unable to load synchronized user');
    }

    const activeMemberships = hydratedUser.memberships.filter(
      (membership) => membership.status === 'ACTIVE'
    );

    let organization = hydratedUser.currentOrganization;
    let membership = organization
      ? activeMemberships.find((item) => item.organizationId === organization?.id)
      : activeMemberships[0];

    if (!membership) {
      organization = await this.createPersonalOrganization(profile);
      membership = await this.authRepository.upsertOwnerMembership(user.id, organization.id);
      await this.authRepository.updateCurrentOrganization(user.id, organization.id);
      hydratedUser = await this.authRepository.findUserByClerkId(profile.clerkUserId);
    } else if (!hydratedUser.currentOrganizationId) {
      await this.authRepository.updateCurrentOrganization(user.id, membership.organizationId);
      organization = membership.organization;
      hydratedUser = await this.authRepository.findUserByClerkId(profile.clerkUserId);
    } else {
      organization = membership.organization;
    }

    if (!organization || !membership || !hydratedUser) {
      throw new InternalServerError('Unable to resolve authenticated organization context');
    }

    const role = membership.role;

    return {
      user: hydratedUser,
      organization,
      membership,
      role,
      permissions: getPermissionsForRole(role),
    };
  }

  private async createPersonalOrganization(profile: ClerkProfile) {
    const displayName =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      profile.email.split('@')[0] ||
      'Personal';
    const baseSlug = slugify(displayName);

    for (let index = 0; index < 25; index += 1) {
      const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
      const existing = await this.authRepository.findOrganizationBySlug(slug);
      if (!existing) {
        return this.authRepository.createOrganization({
          name: `${displayName}'s Organization`,
          slug,
        });
      }
    }

    return this.authRepository.createOrganization({
      name: `${displayName}'s Organization`,
      slug: `${baseSlug}-${Date.now()}`,
    });
  }
}
