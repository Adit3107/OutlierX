import { PrismaClient, Prisma } from '@prisma/client';

export class ModelRegistryRepository {
  constructor(private prisma: PrismaClient) {}

  async listModels() {
    return this.prisma.mLModel.findMany({
      include: {
        versions: {
          orderBy: { createdDate: 'desc' },
          include: {
            evaluations: {
              orderBy: { evaluationDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findModelByName(name: string) {
    return this.prisma.mLModel.findUnique({
      where: { name },
      include: {
        versions: {
          orderBy: { createdDate: 'desc' },
          include: {
            evaluations: {
              orderBy: { evaluationDate: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async findVersionById(versionId: string) {
    return this.prisma.mLModelVersion.findUnique({
      where: { id: versionId },
      include: {
        model: true,
        evaluations: {
          orderBy: { evaluationDate: 'desc' },
        },
      },
    });
  }

  async findVersionByModelAndVersion(modelId: string, version: string) {
    return this.prisma.mLModelVersion.findUnique({
      where: {
        modelId_version: {
          modelId,
          version,
        },
      },
      include: {
        model: true,
        evaluations: {
          orderBy: { evaluationDate: 'desc' },
          take: 1,
        },
      },
    });
  }

  async upsertModel(data: { name: string; algorithm: string; description?: string; activeVersion?: string }) {
    return this.prisma.mLModel.upsert({
      where: { name: data.name },
      create: {
        name: data.name,
        algorithm: data.algorithm,
        description: data.description,
        activeVersion: data.activeVersion ?? 'v1.2.0',
        status: 'ACTIVE',
      },
      update: {
        algorithm: data.algorithm,
        description: data.description,
        ...(data.activeVersion ? { activeVersion: data.activeVersion } : {}),
      },
    });
  }

  async upsertVersion(data: Prisma.MLModelVersionCreateInput) {
    return this.prisma.mLModelVersion.upsert({
      where: {
        modelId_version: {
          modelId: data.model.connect?.id ?? '',
          version: data.version,
        },
      },
      create: data,
      update: {
        status: data.status,
        activeFlag: data.activeFlag,
        productionFlag: data.productionFlag,
        experimentalFlag: data.experimentalFlag,
        archivedFlag: data.archivedFlag,
        deploymentDate: data.deploymentDate,
        reasonForUpdate: data.reasonForUpdate,
      },
    });
  }

  async setVersionActive(modelId: string, targetVersionId: string, reason?: string) {
    await this.prisma.mLModelVersion.updateMany({
      where: { modelId },
      data: {
        activeFlag: false,
        productionFlag: false,
        status: 'INACTIVE',
      },
    });

    const updated = await this.prisma.mLModelVersion.update({
      where: { id: targetVersionId },
      data: {
        activeFlag: true,
        productionFlag: true,
        status: 'ACTIVE',
        deploymentDate: new Date(),
        reasonForUpdate: reason ?? 'Activated as active production version',
      },
      include: { model: true },
    });

    await this.prisma.mLModel.update({
      where: { id: modelId },
      data: { activeVersion: updated.version },
    });

    return updated;
  }

  async archiveVersion(versionId: string, reason?: string) {
    return this.prisma.mLModelVersion.update({
      where: { id: versionId },
      data: {
        status: 'ARCHIVED',
        archivedFlag: true,
        reasonForUpdate: reason ?? 'Archived version',
      },
    });
  }

  async createEvaluation(data: Prisma.ModelEvaluationCreateInput) {
    return this.prisma.modelEvaluation.create({ data });
  }

  async listEvaluations(versionId: string) {
    return this.prisma.modelEvaluation.findMany({
      where: { versionId },
      orderBy: { evaluationDate: 'desc' },
    });
  }

  async createDeploymentHistory(data: {
    modelId: string;
    versionId: string;
    action: string;
    performedBy?: string;
    reason?: string;
    previousState?: unknown;
    newState?: unknown;
  }) {
    return this.prisma.modelDeploymentHistory.create({
      data: {
        modelId: data.modelId,
        versionId: data.versionId,
        action: data.action,
        performedBy: data.performedBy ?? 'system',
        reason: data.reason,
        previousState: data.previousState as Prisma.InputJsonValue,
        newState: data.newState as Prisma.InputJsonValue,
      },
      include: {
        model: true,
        version: true,
      },
    });
  }

  async listDeploymentHistory() {
    return this.prisma.modelDeploymentHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        model: true,
        version: true,
      },
    });
  }

  async saveComparison(data: Prisma.ModelComparisonCreateInput) {
    return this.prisma.modelComparison.create({ data });
  }

  async getLatestComparison(versionAId: string, versionBId: string) {
    return this.prisma.modelComparison.findFirst({
      where: {
        OR: [
          { versionAId, versionBId },
          { versionAId: versionBId, versionBId: versionAId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
