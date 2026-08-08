import axios from 'axios';
import type { PrismaClient } from '@prisma/client';
import type { ModelHealth, ModelInfo, ModelStats } from '@anomaly/shared';
import { prisma as defaultPrisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export class ModelRegistryService {
  private mlServiceUrl: string;

  constructor(private prisma: PrismaClient = defaultPrisma) {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  async listModels(): Promise<{ default_model: string; models: ModelInfo[] }> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/models/list`, { timeout: 5000 });
      const data = response.data;

      if (data && Array.isArray(data.models)) {
        // Sync models into Prisma ModelRegistry table
        for (const m of data.models) {
          await this.prisma.modelRegistry.upsert({
            where: { modelName: m.name },
            create: {
              modelName: m.name,
              algorithm: m.algorithm,
              version: m.version,
              status: m.status || 'ACTIVE',
              supportedFeatures: m.supported_features || [],
              hyperparameters: m.hyperparameters || {},
              totalInferences: m.total_inferences || 0,
              avgLatencyMs: m.avg_latency_ms || 0.0,
            },
            update: {
              algorithm: m.algorithm,
              version: m.version,
              status: m.status || 'ACTIVE',
              supportedFeatures: m.supported_features || [],
              hyperparameters: m.hyperparameters || {},
              totalInferences: m.total_inferences || 0,
              avgLatencyMs: m.avg_latency_ms || 0.0,
            },
          });
        }
        return { default_model: data.default_model || 'isolation_forest', models: data.models };
      }
    } catch (error) {
      logger.warn('Failed to fetch live models from ML Service, returning DB cache:', error);
    }

    // Fallback DB lookup
    const dbModels = await this.prisma.modelRegistry.findMany();
    const mapped: ModelInfo[] = dbModels.map((m) => ({
      name: m.modelName,
      version: m.version,
      algorithm: m.algorithm,
      status: m.status as any,
      supported_features: (m.supportedFeatures as string[]) || [],
      hyperparameters: (m.hyperparameters as Record<string, unknown>) || {},
      accuracy: m.accuracy,
      total_inferences: m.totalInferences,
      avg_latency_ms: m.avgLatencyMs,
      last_used_at: m.lastUsedAt ? m.lastUsedAt.toISOString() : null,
    }));

    return { default_model: 'isolation_forest', models: mapped };
  }

  async getModelsHealth(): Promise<{ overall: string; models: ModelHealth[] }> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/models/health`, { timeout: 5000 });
      return {
        overall: response.data?.overall || 'HEALTHY',
        models: response.data?.models || [],
      };
    } catch (error) {
      logger.error('ML service health check failed:', error);
      return {
        overall: 'UNHEALTHY',
        models: [
          {
            name: 'isolation_forest',
            algorithm: 'IsolationForest',
            status: 'UNHEALTHY',
            loaded: false,
            version: 'v1.0.0',
            details: { error: 'ML service unreachable' },
          },
        ],
      };
    }
  }

  async getModelStats(): Promise<ModelStats[]> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/models/stats`, { timeout: 5000 });
      return response.data?.stats || [];
    } catch (error) {
      logger.warn('Failed to fetch model stats from ML Service:', error);
      return [];
    }
  }
}
