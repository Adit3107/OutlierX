import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PredictionUpsertInput {
  organizationId: string;
  transactionId: string;
  mlScore: number;
  mlPrediction: string;
  confidence: number;
  modelVersion: string;
  processedAt: Date;
  processingTime: number;
}

export class PredictionRepository {
  constructor(private db: PrismaClient = prisma) {}

  upsert(input: PredictionUpsertInput) {
    const data = {
      organizationId: input.organizationId,
      transactionId: input.transactionId,
      mlScore: input.mlScore,
      mlPrediction: input.mlPrediction,
      confidence: input.confidence,
      modelVersion: input.modelVersion,
      processedAt: input.processedAt,
      processingTime: input.processingTime,
    } satisfies Prisma.MlPredictionUncheckedCreateInput;

    return this.db.mlPrediction.upsert({
      where: { transactionId: input.transactionId },
      create: data,
      update: data,
    });
  }

  findByTransaction(organizationId: string, transactionId: string) {
    return this.db.mlPrediction.findFirst({
      where: {
        organizationId,
        transactionId,
      },
    });
  }
}
