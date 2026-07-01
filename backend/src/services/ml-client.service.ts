import type { Transaction } from '@prisma/client';
import { config } from '../config/index.js';

export interface MLPredictionDto {
  transactionId: string | null;
  prediction: string;
  anomalyScore: number;
  confidence: number;
  modelVersion: string;
  inferenceTimeMs: number;
}

interface BatchPredictionResponse {
  predictions: MLPredictionDto[];
  errors?: Array<{ transactionId?: string | null; error: string }>;
  modelVersion: string;
  inferenceTimeMs: number;
}

function toPayload(transaction: Transaction) {
  return {
    id: transaction.id,
    transactionId: transaction.transactionId,
    timestamp: transaction.timestamp.toISOString(),
    amount: Number(transaction.amount),
    currency: transaction.currency,
    merchant: transaction.merchant,
    merchantCategory: transaction.merchantCategory,
    accountNumber: transaction.accountNumber,
    country: transaction.country,
    city: transaction.city,
    paymentMethod: transaction.paymentMethod,
    description: transaction.description,
    referenceNumber: transaction.referenceNumber,
    customerId: transaction.customerId,
    metadata: transaction.metadata,
  };
}

function isPrediction(value: unknown): value is MLPredictionDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.prediction === 'string' &&
    typeof item.anomalyScore === 'number' &&
    typeof item.confidence === 'number' &&
    typeof item.modelVersion === 'string' &&
    typeof item.inferenceTimeMs === 'number'
  );
}

export class MLClientService {
  constructor(
    private baseUrl: string = config.mlService.url,
    private timeoutMs: number = 5000
  ) {}

  async predictBatch(transactions: Transaction[]): Promise<MLPredictionDto[]> {
    if (transactions.length === 0) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: transactions.map(toPayload) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ML service returned ${response.status}`);
      }

      const body = (await response.json()) as Partial<BatchPredictionResponse>;
      if (!Array.isArray(body.predictions) || !body.predictions.every(isPrediction)) {
        throw new Error('ML service returned a malformed prediction response');
      }

      return body.predictions;
    } finally {
      clearTimeout(timeout);
    }
  }
}
