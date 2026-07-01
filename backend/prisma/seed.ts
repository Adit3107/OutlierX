import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Database seeding initiated...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      industry: 'Financial Services',
      website: 'https://example.com',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'TRIAL',
      maxUsers: 25,
    },
    update: {
      name: 'Demo Organization',
      industry: 'Financial Services',
      website: 'https://example.com',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'TRIAL',
      maxUsers: 25,
    },
  });

  const user = await prisma.user.upsert({
    where: { clerkUserId: 'user_demo_seed' },
    create: {
      clerkUserId: 'user_demo_seed',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      status: 'ACTIVE',
      currentOrganizationId: organization.id,
    },
    update: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      status: 'ACTIVE',
      currentOrganizationId: organization.id,
    },
  });

  const membership = await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
    update: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const dummyHash = crypto.createHash('sha256').update('ak_demo_seed_key').digest('hex');
  await prisma.apiKey.upsert({
    where: { keyHash: dummyHash },
    create: {
      organizationId: organization.id,
      createdById: user.id,
      name: 'Demo API Key',
      keyHash: dummyHash,
      status: 'ACTIVE',
    },
    update: {
      organizationId: organization.id,
      createdById: user.id,
      name: 'Demo API Key',
      status: 'ACTIVE',
    },
  });

  await prisma.alert.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      organizationId: organization.id,
      userId: user.id,
      severity: 'MEDIUM',
      title: 'Demo alert',
      description: 'Seeded alert for foundation verification.',
      isRead: false,
    },
    update: {
      organizationId: organization.id,
      userId: user.id,
      severity: 'MEDIUM',
      title: 'Demo alert',
      description: 'Seeded alert for foundation verification.',
      isRead: false,
    },
  });

  await prisma.activityLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      organizationId: organization.id,
      userId: user.id,
      action: 'seed.organization.created',
      entity: 'ORGANIZATION',
      entityId: organization.id,
      metadata: { source: 'seed' },
    },
    update: {
      organizationId: organization.id,
      userId: user.id,
      action: 'seed.organization.created',
      entity: 'ORGANIZATION',
      entityId: organization.id,
      metadata: { source: 'seed' },
    },
  });

  await prisma.activityLog.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      organizationId: organization.id,
      userId: user.id,
      action: 'seed.membership.created',
      entity: 'MEMBERSHIP',
      entityId: membership.id,
      metadata: { source: 'seed', role: membership.role },
    },
    update: {
      organizationId: organization.id,
      userId: user.id,
      action: 'seed.membership.created',
      entity: 'MEMBERSHIP',
      entityId: membership.id,
      metadata: { source: 'seed', role: membership.role },
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
