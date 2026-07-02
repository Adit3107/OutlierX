import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { DEFAULT_RULES } from '../src/modules/rules/constants/default-rules.js';

const prisma = new PrismaClient();

async function createRuleGroup(ruleId: string, group: any, parentGroupId: string | null, position: number) {
  const created = await prisma.ruleGroup.create({
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
      await createRuleGroup(ruleId, child, created.id, childPosition);
    } else {
      await prisma.ruleCondition.create({
        data: {
          ruleId,
          groupId: created.id,
          field: child.field,
          operator: child.operator,
          value: child.value,
          dataType: child.dataType,
          position: childPosition,
        },
      });
    }
  }
}

async function seedDefaultRules(organizationId: string, userId: string) {
  for (const definition of DEFAULT_RULES) {
    const existing = await prisma.rule.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: definition.name,
        },
      },
    });

    if (!existing) {
      const rule = await prisma.rule.create({
        data: {
          organizationId,
          createdBy: userId,
          name: definition.name,
          description: definition.description,
          category: definition.category,
          severity: definition.severity,
          enabled: definition.enabled,
          priority: definition.priority,
          weight: definition.weight,
        },
      });
      await createRuleGroup(rule.id, definition.conditionTree, null, 0);
    }
  }
}

async function seedEnterpriseDemoData(primaryOrganizationId: string, primaryUserId: string) {
  const organizations = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Northstar Bank',
      slug: 'northstar-bank',
      industry: 'Banking',
      website: 'https://northstar.example.com',
      subscriptionPlan: 'ENTERPRISE' as const,
      maxUsers: 250,
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      name: 'HelioPay',
      slug: 'heliopay',
      industry: 'Payments',
      website: 'https://heliopay.example.com',
      subscriptionPlan: 'PRO' as const,
      maxUsers: 40,
    },
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        industry: org.industry,
        website: org.website,
        subscriptionPlan: org.subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        maxUsers: org.maxUsers,
      },
      update: {
        name: org.name,
        industry: org.industry,
        website: org.website,
        subscriptionPlan: org.subscriptionPlan,
        maxUsers: org.maxUsers,
      },
    });
  }

  const users = [
    { id: '20000000-0000-4000-8000-000000000001', clerkUserId: 'user_owner_ops', email: 'owner@northstar.example.com', firstName: 'Avery', lastName: 'Stone', role: 'OWNER' as const, organizationId: organizations[0].id },
    { id: '20000000-0000-4000-8000-000000000002', clerkUserId: 'user_admin_ops', email: 'admin@northstar.example.com', firstName: 'Mira', lastName: 'Patel', role: 'ADMIN' as const, organizationId: organizations[0].id },
    { id: '20000000-0000-4000-8000-000000000003', clerkUserId: 'user_analyst_ops', email: 'analyst@northstar.example.com', firstName: 'Noah', lastName: 'Kim', role: 'ANALYST' as const, organizationId: organizations[0].id },
    { id: '20000000-0000-4000-8000-000000000004', clerkUserId: 'user_viewer_ops', email: 'viewer@northstar.example.com', firstName: 'Lina', lastName: 'Reed', role: 'VIEWER' as const, organizationId: organizations[0].id },
    { id: '20000000-0000-4000-8000-000000000005', clerkUserId: 'user_payments_owner', email: 'owner@heliopay.example.com', firstName: 'Theo', lastName: 'Grant', role: 'OWNER' as const, organizationId: organizations[1].id },
  ];

  for (const demoUser of users) {
    await prisma.user.upsert({
      where: { clerkUserId: demoUser.clerkUserId },
      create: {
        id: demoUser.id,
        clerkUserId: demoUser.clerkUserId,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        status: demoUser.email.includes('viewer') ? 'SUSPENDED' : 'ACTIVE',
        currentOrganizationId: demoUser.organizationId,
        theme: 'dark',
        language: 'en',
        timezone: demoUser.organizationId === organizations[0].id ? 'America/New_York' : 'Europe/London',
        notificationPreferences: {
          email: true,
          browser: true,
          criticalAlerts: true,
          highAlerts: true,
          weeklySummary: true,
          marketing: false,
        },
      },
      update: {
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        currentOrganizationId: demoUser.organizationId,
      },
    });

    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: demoUser.organizationId,
          userId: demoUser.id,
        },
      },
      create: {
        organizationId: demoUser.organizationId,
        userId: demoUser.id,
        role: demoUser.role,
        status: demoUser.email.includes('viewer') ? 'SUSPENDED' : 'ACTIVE',
      },
      update: {
        role: demoUser.role,
        status: demoUser.email.includes('viewer') ? 'SUSPENDED' : 'ACTIVE',
      },
    });
  }

  for (const [index, name] of ['Production Webhook', 'Risk Ops Console', 'Partner Sandbox'].entries()) {
    const raw = `ak_seed_enterprise_${index}`;
    await prisma.apiKey.upsert({
      where: { keyHash: crypto.createHash('sha256').update(raw).digest('hex') },
      create: {
        organizationId: organizations[0].id,
        createdById: users[index % 3].id,
        name,
        keyHash: crypto.createHash('sha256').update(raw).digest('hex'),
        status: index === 2 ? 'REVOKED' : 'ACTIVE',
        lastUsedAt: index === 2 ? null : new Date(Date.now() - index * 86400000),
        expiresAt: index === 0 ? new Date(Date.now() + 90 * 86400000) : null,
      },
      update: {
        name,
        status: index === 2 ? 'REVOKED' : 'ACTIVE',
      },
    });
  }

  const upload = await prisma.upload.upsert({
    where: {
      organizationId_fileHash: {
        organizationId: organizations[0].id,
        fileHash: 'enterprise-seed-upload-hash',
      },
    },
    create: {
      id: '30000000-0000-4000-8000-000000000001',
      organizationId: organizations[0].id,
      uploadedById: users[2].id,
      filename: 'enterprise-risk-upload.csv',
      originalFilename: 'enterprise-risk-upload.csv',
      storageKey: 'seed/enterprise-risk-upload.csv',
      storageUrl: 'local://seed/enterprise-risk-upload.csv',
      mimeType: 'text/csv',
      fileSize: 184320,
      fileHash: 'enterprise-seed-upload-hash',
      status: 'COMPLETED',
      totalRows: 5000,
      processedRows: 4988,
      failedRows: 12,
      processingTime: 18750,
      errorSummary: [{ row: 71, errors: ['Invalid currency'] }],
    },
    update: {
      status: 'COMPLETED',
      totalRows: 5000,
      processedRows: 4988,
      failedRows: 12,
    },
  });

  const transactionSpecs = [
    ['40000000-0000-4000-8000-000000000001', 'NX-9001', 12450.25, 'Aurum Exchange', 'SG', 'CRITICAL' as const, 94],
    ['40000000-0000-4000-8000-000000000002', 'NX-9002', 884.12, 'Cloud Retail', 'US', 'LOW' as const, 18],
    ['40000000-0000-4000-8000-000000000003', 'NX-9003', 5210.0, 'Jetstream Travel', 'GB', 'HIGH' as const, 78],
    ['40000000-0000-4000-8000-000000000004', 'NX-9004', 239.45, 'Metro Utilities', 'CA', 'MEDIUM' as const, 46],
    ['40000000-0000-4000-8000-000000000005', 'NX-9005', 18700.0, 'Mariner Imports', 'AE', 'CRITICAL' as const, 91],
  ];

  for (const [index, spec] of transactionSpecs.entries()) {
    const [id, transactionId, amount, merchant, country, riskLevel, finalScore] = spec;
    const riskLevelValue = String(riskLevel) as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    const transaction = await prisma.transaction.upsert({
      where: { id: String(id) },
      create: {
        id: String(id),
        organizationId: organizations[0].id,
        uploadId: upload.id,
        transactionId: String(transactionId),
        timestamp: new Date(Date.now() - index * 3600000),
        amount: String(amount),
        currency: 'USD',
        merchant: String(merchant),
        merchantCategory: 'ENTERPRISE_DEMO',
        country: String(country),
        city: 'Demo City',
        paymentMethod: index % 2 === 0 ? 'CARD' : 'ACH',
        status: 'IMPORTED',
        metadata: { seed: true, channel: index % 2 === 0 ? 'web' : 'api' },
      },
      update: {
        amount: String(amount),
        merchant: String(merchant),
        country: String(country),
      },
    });

    const prediction = await prisma.mlPrediction.upsert({
      where: { transactionId: transaction.id },
      create: {
        organizationId: organizations[0].id,
        transactionId: transaction.id,
        mlScore: Number(finalScore) / 100,
        mlPrediction: Number(finalScore) > 70 ? 'ANOMALY' : 'NORMAL',
        confidence: 0.86,
        modelVersion: 'seed-model-v1',
        processedAt: new Date(),
        processingTime: 42 + index,
      },
      update: {
        mlScore: Number(finalScore) / 100,
        mlPrediction: Number(finalScore) > 70 ? 'ANOMALY' : 'NORMAL',
        processedAt: new Date(),
      },
    });

    const decision = await prisma.decision.upsert({
      where: { id: `50000000-0000-4000-8000-00000000000${index + 1}` },
      create: {
        id: `50000000-0000-4000-8000-00000000000${index + 1}`,
        organizationId: organizations[0].id,
        transactionId: transaction.id,
        mlPredictionId: prediction.id,
        ruleScore: Number(finalScore) - 7,
        mlScore: Number(finalScore),
        finalScore: Number(finalScore),
        confidence: 0.84,
        riskLevel: riskLevelValue,
        decisionStrategy: 'weighted-rule-ml-v1',
        decisionVersion: '1.0.0',
        explanation: {
          summary: 'Seeded production-like decision.',
          reasons: ['High-risk demo signal'],
          recommendationReason: 'Seed data scenario',
          ruleBreakdown: { score: Number(finalScore) - 7, riskLevel: riskLevelValue, triggeredRules: [] },
          mlBreakdown: { prediction: Number(finalScore) > 70 ? 'ANOMALY' : 'NORMAL', score: Number(finalScore), confidence: 0.86 },
          weights: [],
          thresholds: { risk: {}, recommendations: {} },
          consistency: 0.9,
          timeline: [],
          processingTime: 58,
        },
        recommendation: Number(finalScore) > 90 ? 'ESCALATE' : Number(finalScore) > 70 ? 'MANUAL_REVIEW' : 'MONITOR',
        processedAt: new Date(),
      },
      update: {
        finalScore: Number(finalScore),
        riskLevel: riskLevelValue,
        recommendation: Number(finalScore) > 90 ? 'ESCALATE' : Number(finalScore) > 70 ? 'MANUAL_REVIEW' : 'MONITOR',
      },
    });

    if (Number(finalScore) >= 70) {
      await prisma.alert.upsert({
        where: { id: `60000000-0000-4000-8000-00000000000${index + 1}` },
        create: {
          id: `60000000-0000-4000-8000-00000000000${index + 1}`,
          organizationId: organizations[0].id,
          userId: users[2].id,
          decisionId: decision.id,
          transactionId: transaction.id,
          assignedAnalystId: users[2].id,
          severity: riskLevelValue === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          title: `${riskLevelValue} transaction ${transactionId}`,
          description: 'Production-like seeded alert for enterprise dashboard review.',
          riskScore: Number(finalScore),
          confidence: 0.84,
          status: index === 2 ? 'RESOLVED' : 'OPEN',
          isRead: index === 2,
        },
        update: {
          riskScore: Number(finalScore),
          status: index === 2 ? 'RESOLVED' : 'OPEN',
        },
      });
    }
  }

  const actions = [
    ['login.succeeded', 'USER'],
    ['upload.completed', 'UPLOAD'],
    ['rule.updated', 'RULE'],
    ['alert.created', 'ALERT'],
    ['api_key.rotated', 'API_KEY'],
    ['organization.updated', 'ORGANIZATION'],
  ] as const;

  for (const [index, [action, entity]] of actions.entries()) {
    await prisma.activityLog.upsert({
      where: { id: `70000000-0000-4000-8000-00000000000${index + 1}` },
      create: {
        id: `70000000-0000-4000-8000-00000000000${index + 1}`,
        organizationId: organizations[0].id,
        userId: users[index % users.length].id,
        action,
        entity,
        entityId: index === 1 ? upload.id : organizations[0].id,
        metadata: { seed: true, source: 'enterprise-demo' },
      },
      update: {
        action,
        entity,
        metadata: { seed: true, source: 'enterprise-demo' },
      },
    });
  }

  await prisma.activityLog.upsert({
    where: { id: '70000000-0000-4000-8000-000000000099' },
    create: {
      id: '70000000-0000-4000-8000-000000000099',
      organizationId: primaryOrganizationId,
      userId: primaryUserId,
      action: 'seed.enterprise_demo.ready',
      entity: 'SYSTEM',
      entityId: primaryOrganizationId,
      metadata: { organizations: organizations.length, transactions: transactionSpecs.length },
    },
    update: {
      action: 'seed.enterprise_demo.ready',
      metadata: { organizations: organizations.length, transactions: transactionSpecs.length },
    },
  });
}

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

  await seedDefaultRules(organization.id, user.id);
  await seedEnterpriseDemoData(organization.id, user.id);

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
