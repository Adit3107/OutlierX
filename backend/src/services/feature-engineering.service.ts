import axios from 'axios';
import type { PrismaClient } from '@prisma/client';
import type { FeaturePipelineMetrics, FeatureVector } from '@anomaly/shared';
import { prisma as defaultPrisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export class FeatureEngineeringService {
  private mlServiceUrl: string;

  constructor(private prisma: PrismaClient = defaultPrisma) {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  async extractAndStoreFeatureVector(
    organizationId: string,
    transaction: any,
    userHistory: any[] = []
  ): Promise<FeatureVector> {
    const startTime = Date.now();
    try {
      // Call FastAPI ML service feature extraction endpoint
      const response = await axios.post(
        `${this.mlServiceUrl}/features/extract`,
        {
          transaction: {
            id: transaction.id,
            transactionId: transaction.transactionId,
            organizationId,
            amount: Number(transaction.amount),
            currency: transaction.currency,
            timestamp: transaction.timestamp,
            merchant: transaction.merchant,
            merchantCategory: transaction.merchantCategory,
            accountNumber: transaction.accountNumber,
            country: transaction.country,
            city: transaction.city,
            paymentMethod: transaction.paymentMethod,
            description: transaction.description,
            metadata: transaction.metadata,
          },
          user_history: userHistory,
        },
        { timeout: 10000 }
      );

      const data = response.data?.data;
      if (!data || !data.vector) {
        throw new Error('ML service returned invalid feature vector response');
      }

      // Upsert into Prisma FeatureVector table
      const created = await this.prisma.featureVector.upsert({
        where: { transactionId: transaction.id },
        create: {
          organizationId,
          transactionId: transaction.id,
          pipelineVersion: data.metadata?.pipeline_version || 'v1.0.0',
          featureVersion: data.metadata?.feature_version || 'features-v2.1',
          featureCount: data.feature_count || Object.keys(data.vector).length,
          vector: data.vector,
          status: data.status || 'VALIDATED',
          processingTimeMs: Math.round(data.processing_time_ms || (Date.now() - startTime)),
          metadata: data.metadata || {},
        },
        update: {
          pipelineVersion: data.metadata?.pipeline_version || 'v1.0.0',
          featureVersion: data.metadata?.feature_version || 'features-v2.1',
          featureCount: data.feature_count || Object.keys(data.vector).length,
          vector: data.vector,
          status: data.status || 'VALIDATED',
          processingTimeMs: Math.round(data.processing_time_ms || (Date.now() - startTime)),
          metadata: data.metadata || {},
        },
      });

      return created as unknown as FeatureVector;
    } catch (error) {
      logger.error('Feature vector extraction failed:', error);
      // Fallback local feature vector generation if ML service is unreachable
      const fallbackVector = this.generateFallbackVector(transaction);
      const created = await this.prisma.featureVector.upsert({
        where: { transactionId: transaction.id },
        create: {
          organizationId,
          transactionId: transaction.id,
          pipelineVersion: 'v1.0.0-fallback',
          featureVersion: 'features-v2.1',
          featureCount: Object.keys(fallbackVector).length,
          vector: fallbackVector,
          status: 'FAILED',
          processingTimeMs: Math.round(Date.now() - startTime),
          metadata: { error: error instanceof Error ? error.message : 'Service unavailable' },
        },
        update: {
          pipelineVersion: 'v1.0.0-fallback',
          featureVersion: 'features-v2.1',
          featureCount: Object.keys(fallbackVector).length,
          vector: fallbackVector,
          status: 'FAILED',
          processingTimeMs: Math.round(Date.now() - startTime),
          metadata: { error: error instanceof Error ? error.message : 'Service unavailable' },
        },
      });

      return created as unknown as FeatureVector;
    }
  }

  async processBatchFeatureVectors(
    organizationId: string,
    transactions: any[]
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const tx of transactions) {
      try {
        await this.extractAndStoreFeatureVector(organizationId, tx);
        processed++;
      } catch (err) {
        failed++;
      }
    }

    return { processed, failed };
  }

  async getFeatureVectorByTransaction(
    organizationId: string,
    transactionId: string
  ): Promise<FeatureVector | null> {
    const vector = await this.prisma.featureVector.findFirst({
      where: { organizationId, transactionId },
    });
    return vector as unknown as FeatureVector | null;
  }

  async getPipelineMetrics(organizationId: string): Promise<FeaturePipelineMetrics> {
    const totalCount = await this.prisma.featureVector.count({ where: { organizationId } });
    const failedCount = await this.prisma.featureVector.count({ where: { organizationId, status: 'FAILED' } });
    
    const avgTimeResult = await this.prisma.featureVector.aggregate({
      where: { organizationId },
      _avg: { processingTimeMs: true },
    });

    let mlMetrics: Partial<FeaturePipelineMetrics> = {};
    try {
      const resp = await axios.get(`${this.mlServiceUrl}/features/metrics`, { timeout: 3000 });
      mlMetrics = resp.data?.data || {};
    } catch {
      // ML service un-reachable metrics fallback
    }

    return {
      pipeline_version: mlMetrics.pipeline_version || 'v1.0.0',
      feature_version: mlMetrics.feature_version || 'features-v2.1',
      total_extractions: totalCount,
      failed_extractions: failedCount,
      avg_processing_time_ms: Math.round(avgTimeResult._avg.processingTimeMs || 0),
      scaler_mode: mlMetrics.scaler_mode || 'standard',
      encoder_mode: mlMetrics.encoder_mode || 'frequency',
    };
  }

  private generateFallbackVector(transaction: any): Record<string, number> {
    const amount = Number(transaction.amount) || 0;
    const dt = new Date(transaction.timestamp || Date.now());
    return {
      transaction_amount: amount,
      log_amount: Math.log1p(amount),
      transaction_hour: dt.getUTCHours(),
      transaction_weekday: dt.getUTCDay(),
      high_value_flag: amount >= 10000 ? 1 : 0,
      rule_score: 0,
    };
  }
}
