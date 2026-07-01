import { TransactionCreateSchema, QueryTransactionsSchema } from '@anomaly/shared';
import { z } from 'zod';

export const createTransactionValidator = TransactionCreateSchema;
export const queryTransactionsValidator = QueryTransactionsSchema;
export const bulkDeleteTransactionsValidator = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});
export const bulkTransactionActionValidator = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['TAG', 'MARK_REVIEWED']),
});
