import type { MlPrediction, Transaction } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { PredictionRepository } from '../repositories/prediction.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { MLClientService } from './ml-client.service.js';

const ML_BATCH_SIZE = 250;

export interface PredictionDto {
  id: string;
  transactionId: string;
  mlScore: number;
  mlPrediction: string;
  confidence: number;
  modelVersion: string;
  processedAt: Date;
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toPredictionDto(prediction?: MlPrediction | null): PredictionDto | null {
  if (!prediction) {
    return null;
  }

  return {
    id: prediction.id,
    transactionId: prediction.transactionId,
    mlScore: prediction.mlScore,
    mlPrediction: prediction.mlPrediction,
    confidence: prediction.confidence,
    modelVersion: prediction.modelVersion,
    processedAt: prediction.processedAt,
    processingTime: prediction.processingTime,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt,
  };
}

export class PredictionService {
  constructor(
    private predictionRepository: PredictionRepository,
    private transactionRepository: TransactionRepository,
    private mlClientService: MLClientService
  ) {}

  async predictStoredTransaction(organizationId: string, transactionId: string): Promise<PredictionDto> {
    const transaction = await this.transactionRepository.findRawById(organizationId, transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    const [prediction] = await this.persistPredictions(organizationId, [transaction]);
    if (!prediction) {
      throw new Error('ML service did not return a prediction for this transaction');
    }

    return prediction;
  }

  async processTransactionsBestEffort(organizationId: string, transactions: Transaction[]) {
    if (transactions.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (let index = 0; index < transactions.length; index += ML_BATCH_SIZE) {
      const batch = transactions.slice(index, index + ML_BATCH_SIZE);
      try {
        const predictions = await this.persistPredictions(organizationId, batch);
        processed += predictions.length;
        failed += Math.max(batch.length - predictions.length, 0);
      } catch (error) {
        failed += batch.length;
        logger.warn('ML prediction batch failed', {
          organizationId,
          count: batch.length,
          reason: error instanceof Error ? error.message : 'Unknown ML prediction failure',
        });
      }
    }

    return { processed, failed };
  }

  private async persistPredictions(
    organizationId: string,
    transactions: Transaction[]
  ): Promise<PredictionDto[]> {
    const results = await this.mlClientService.predictBatch(transactions);
    const transactionIds = new Set(transactions.map((transaction) => transaction.id));
    const persisted: PredictionDto[] = [];

    for (const result of results) {
      if (!result.transactionId || !transactionIds.has(result.transactionId)) {
        continue;
      }

      const prediction = await this.predictionRepository.upsert({
        organizationId,
        transactionId: result.transactionId,
        mlScore: result.anomalyScore,
        mlPrediction: result.prediction,
        confidence: result.confidence,
        modelVersion: result.modelVersion,
        processedAt: new Date(),
        processingTime: result.inferenceTimeMs,
      });
      persisted.push(toPredictionDto(prediction)!);
    }

    return persisted;
  }
}
