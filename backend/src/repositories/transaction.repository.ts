import { Transaction } from '@anomaly/shared';

export interface ITransactionRepository {
  create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'anomalous' | 'status'>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findMany(filters: {
    page: number;
    limit: number;
    category?: string;
  }): Promise<{ items: Transaction[]; total: number }>;
}

export class TransactionRepository implements ITransactionRepository {
  private static mockDb: Transaction[] = [];

  async create(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'anomalous' | 'status'>
  ): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: `tx_mock_${Math.random().toString(36).substring(2, 11)}`,
      ...data,
      status: 'PENDING',
      anomalous: Math.random() > 0.8, // Mock detection flag
      anomalyScore: parseFloat(Math.random().toFixed(2)),
      anomalyReason: Math.random() > 0.8 ? 'Unusual transaction amount threshold breached' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    TransactionRepository.mockDb.push(newTransaction);
    return newTransaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const tx = TransactionRepository.mockDb.find((t) => t.id === id);
    return tx || null;
  }

  async findMany(filters: {
    page: number;
    limit: number;
    category?: string;
  }): Promise<{ items: Transaction[]; total: number }> {
    let list = [...TransactionRepository.mockDb];

    if (filters.category) {
      list = list.filter((t) => t.category === filters.category);
    }

    const total = list.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const items = list.slice(startIndex, startIndex + filters.limit);

    return { items, total };
  }
}
