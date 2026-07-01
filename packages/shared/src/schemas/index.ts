import { z } from 'zod';
import { SUPPORTED_CURRENCIES, TRANSACTION_CATEGORIES, RULE_TYPES, TRANSACTION_STATUSES } from '../constants/index.js';

export const TransactionCreateSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Unsupported currency code' }),
  }),
  merchant: z.string().min(1, 'Merchant name is required').max(255),
  category: z.enum(TRANSACTION_CATEGORIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid transaction category' }),
  }),
  timestamp: z.string().datetime({ message: 'Invalid ISO 8601 datetime string' }),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export const TransactionImportSchema = z.array(TransactionCreateSchema);

export const DetectionRuleCreateSchema = z.object({
  name: z.string().min(3, 'Rule name must be at least 3 characters long').max(100),
  description: z.string().max(255).optional(),
  type: z.enum(Object.values(RULE_TYPES) as [string, ...string[]]),
  parameters: z.record(z.any()).refine((params) => Object.keys(params).length > 0, {
    message: 'Parameters must not be empty and must define rule bounds',
  }),
  isActive: z.boolean().default(true),
});

export const QueryTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  category: z.string().optional(),
  status: z.enum(Object.values(TRANSACTION_STATUSES) as [string, ...string[]]).optional(),
  anomalous: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});
