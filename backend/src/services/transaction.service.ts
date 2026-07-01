import { Transaction } from '@anomaly/shared';
import { ITransactionRepository } from '../repositories/transaction.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

export class TransactionService {
  constructor(private transactionRepository: ITransactionRepository) {}

  async createTransaction(
    orgId: string,
    payload: Omit<Transaction, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'anomalous' | 'status'>
  ): Promise<Transaction> {
    logger.info(`Processing transaction creation for organization: ${orgId}`, {
      amount: payload.amount,
      currency: payload.currency,
    });

    // Save transaction via repository
    const transaction = await this.transactionRepository.create({
      organizationId: orgId,
      ...payload,
    });

    logger.info(`Transaction saved successfully with ID: ${transaction.id}. Target ML URL: ${config.mlService.url}`);

    // Placeholder: call python ml-service for async or sync analysis in subsequent phases

    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundError(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async getTransactions(filters: {
    page: number;
    limit: number;
    category?: string;
  }): Promise<{ items: Transaction[]; total: number }> {
    return this.transactionRepository.findMany(filters);
  }
}
