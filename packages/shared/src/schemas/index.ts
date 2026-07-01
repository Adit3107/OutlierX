import { z } from 'zod';
import {
  API_KEY_STATUSES,
  MEMBERSHIP_STATUSES,
  RULE_TYPES,
  SUPPORTED_CURRENCIES,
  TRANSACTION_STATUSES,
  UPLOAD_STATUSES,
  USER_ROLES,
} from '../constants/index.js';

const ruleCategoryValues = ['AMOUNT', 'LOCATION', 'MERCHANT', 'TIME', 'ACCOUNT', 'DEVICE', 'CUSTOM'] as const;
const alertSeverityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const conditionOperatorValues = [
  'EQ',
  'NEQ',
  'GT',
  'GTE',
  'LT',
  'LTE',
  'CONTAINS',
  'NOT_CONTAINS',
  'IN',
  'NOT_IN',
  'EXISTS',
  'MISSING',
  'BETWEEN',
] as const;
const logicalOperatorValues = ['AND', 'OR'] as const;
const ruleExecutionSourceValues = ['UPLOAD', 'MANUAL', 'PLAYGROUND'] as const;

export const TransactionCreateSchema = z.object({
  transactionId: z.string().min(1).max(255),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Unsupported currency code' }),
  }),
  merchant: z.string().min(1, 'Merchant name is required').max(255),
  timestamp: z.string().datetime({ message: 'Invalid ISO 8601 datetime string' }),
  merchantCategory: z.string().max(255).nullable().optional(),
  accountNumber: z.string().max(255).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  paymentMethod: z.string().max(120).nullable().optional(),
  description: z.string().max(500).optional(),
  referenceNumber: z.string().max(255).nullable().optional(),
  customerId: z.string().max(255).nullable().optional(),
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

export const RuleConditionNodeSchema = z.object({
  type: z.literal('condition'),
  id: z.string().uuid().optional(),
  field: z.string().min(1).max(80),
  operator: z.enum(conditionOperatorValues),
  value: z.any().optional(),
  dataType: z.enum(['string', 'number', 'date', 'boolean', 'array']),
  position: z.number().int().nonnegative().optional(),
});

export type RuleConditionNodeInput = z.infer<typeof RuleConditionNodeSchema>;

export type RuleGroupNodeInput = {
  type: 'group';
  id?: string;
  operator: (typeof logicalOperatorValues)[number];
  position?: number;
  children: RuleTreeNodeInput[];
};

export type RuleTreeNodeInput = RuleConditionNodeInput | RuleGroupNodeInput;

export const RuleGroupNodeSchema: z.ZodType<RuleGroupNodeInput> = z.lazy(() =>
  z.object({
    type: z.literal('group'),
    id: z.string().uuid().optional(),
    operator: z.enum(logicalOperatorValues),
    position: z.number().int().nonnegative().optional(),
    children: z.array(z.union([RuleConditionNodeSchema, RuleGroupNodeSchema])).min(1).max(25),
  })
);

export const RuleCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  category: z.enum(ruleCategoryValues),
  severity: z.enum(alertSeverityValues),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(10000),
  weight: z.number().int().min(0).max(100),
  conditionTree: RuleGroupNodeSchema,
});

export const RuleUpdateSchema = RuleCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one rule field must be provided' }
);

export const RuleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(120).optional(),
  category: z.enum(ruleCategoryValues).optional(),
  severity: z.enum(alertSeverityValues).optional(),
  enabled: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'category', 'severity', 'priority', 'weight', 'updatedAt']).default('priority'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const RuleHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  ruleId: z.string().uuid().optional(),
  transactionId: z.string().uuid().optional(),
  matched: z.coerce.boolean().optional(),
});

export const RuleReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    priority: z.number().int().min(1).max(10000),
  })).min(1).max(500),
});

export const RuleTestSchema = z.object({
  transaction: TransactionCreateSchema.extend({
    id: z.string().uuid().optional(),
    uploadId: z.string().uuid().optional(),
    status: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }).passthrough(),
  ruleIds: z.array(z.string().uuid()).max(100).optional(),
});

export const RuleEvaluateSchema = z.object({
  transactionIds: z.array(z.string().uuid()).min(1).max(500),
  ruleIds: z.array(z.string().uuid()).max(100).optional(),
  source: z.enum(ruleExecutionSourceValues).default('MANUAL'),
});

export const QueryTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['timestamp', 'amount', 'merchant', 'country', 'createdAt', 'transactionId']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(120).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  country: z.string().max(120).optional(),
  merchant: z.string().max(255).optional(),
  merchantCategory: z.string().max(255).optional(),
  paymentMethod: z.string().max(120).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]]).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  uploadId: z.string().uuid().optional(),
  status: z.enum(Object.values(TRANSACTION_STATUSES) as [string, ...string[]]).optional(),
  ids: z.string().max(5000).optional(),
  format: z.enum(['csv', 'json']).default('csv'),
  scope: z.enum(['page', 'filtered', 'selected']).default('filtered'),
}).refine((value) => !value.startDate || !value.endDate || new Date(value.startDate) <= new Date(value.endDate), {
  message: 'Start date must be before end date',
  path: ['startDate'],
}).refine((value) => value.minAmount === undefined || value.maxAmount === undefined || value.minAmount <= value.maxAmount, {
  message: 'Minimum amount must be less than maximum amount',
  path: ['minAmount'],
});

export const UploadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(Object.values(UPLOAD_STATUSES) as [string, ...string[]]).optional(),
});

export const OrganizationUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens')
    .optional(),
  logo: z.string().url().nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  website: z.string().url().nullable().optional(),
});

export const MemberCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).default(USER_ROLES.MEMBER),
});

export const MemberUpdateSchema = z.object({
  role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(MEMBERSHIP_STATUSES) as [string, ...string[]]).optional(),
}).refine((value) => value.role !== undefined || value.status !== undefined, {
  message: 'At least one member field must be provided',
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(2).max(120),
  expiresAt: z.string().datetime().optional(),
});

export const ApiKeyQuerySchema = z.object({
  status: z.enum(Object.values(API_KEY_STATUSES) as [string, ...string[]]).optional(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
