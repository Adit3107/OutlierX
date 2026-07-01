export const TRANSACTION_STATUSES = {
  IMPORTED: 'IMPORTED',
} as const;

export const UPLOAD_STATUSES = {
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  PARSING: 'PARSING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const USER_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export const MEMBERSHIP_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'ACTIVE',
  TRIAL: 'TRIAL',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
} as const;

export const API_KEY_STATUSES = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export const ALERT_SEVERITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const ALERT_STATUSES = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const RULE_CATEGORIES = {
  AMOUNT: 'AMOUNT',
  LOCATION: 'LOCATION',
  MERCHANT: 'MERCHANT',
  TIME: 'TIME',
  ACCOUNT: 'ACCOUNT',
  DEVICE: 'DEVICE',
  CUSTOM: 'CUSTOM',
} as const;

export const CONDITION_OPERATORS = {
  EQ: 'EQ',
  NEQ: 'NEQ',
  GT: 'GT',
  GTE: 'GTE',
  LT: 'LT',
  LTE: 'LTE',
  CONTAINS: 'CONTAINS',
  NOT_CONTAINS: 'NOT_CONTAINS',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  EXISTS: 'EXISTS',
  MISSING: 'MISSING',
  BETWEEN: 'BETWEEN',
} as const;

export const LOGICAL_OPERATORS = {
  AND: 'AND',
  OR: 'OR',
} as const;

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const DECISION_RECOMMENDATIONS = {
  APPROVE: 'APPROVE',
  MONITOR: 'MONITOR',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  BLOCK_TRANSACTION: 'BLOCK_TRANSACTION',
  ESCALATE: 'ESCALATE',
} as const;

export const DECISION_STRATEGIES = {
  WEIGHTED_RULE_ML_V1: 'weighted-rule-ml-v1',
} as const;

export const RULE_EXECUTION_SOURCES = {
  UPLOAD: 'UPLOAD',
  MANUAL: 'MANUAL',
  PLAYGROUND: 'PLAYGROUND',
} as const;

export const ACTIVITY_ENTITIES = {
  USER: 'USER',
  ORGANIZATION: 'ORGANIZATION',
  MEMBERSHIP: 'MEMBERSHIP',
  API_KEY: 'API_KEY',
  UPLOAD: 'UPLOAD',
  TRANSACTION: 'TRANSACTION',
  RULE: 'RULE',
  ALERT: 'ALERT',
  SYSTEM: 'SYSTEM',
} as const;

export const PERMISSIONS = {
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  MEMBERS_READ: 'members:read',
  MEMBERS_CREATE: 'members:create',
  MEMBERS_UPDATE: 'members:update',
  MEMBERS_DELETE: 'members:delete',
  API_KEYS_READ: 'api-keys:read',
  API_KEYS_CREATE: 'api-keys:create',
  API_KEYS_DELETE: 'api-keys:delete',
  UPLOADS_READ: 'uploads:read',
  UPLOADS_CREATE: 'uploads:create',
  UPLOADS_DELETE: 'uploads:delete',
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_DELETE: 'transactions:delete',
  DECISIONS_READ: 'decisions:read',
  DECISIONS_WRITE: 'decisions:write',
  RULES_READ: 'rules:read',
  RULES_TEST: 'rules:test',
  RULES_CREATE: 'rules:create',
  RULES_UPDATE: 'rules:update',
  RULES_DELETE: 'rules:delete',
  RULES_EVALUATE: 'rules:evaluate',
  ACTIVITY_READ: 'activity:read',
  DASHBOARD_READ: 'dashboard:read',
  ANALYTICS_READ: 'analytics:read',
  ALERTS_READ: 'alerts:read',
  ALERTS_UPDATE: 'alerts:update',
  ALERTS_DELETE: 'alerts:delete',
} as const;

export const RULE_TYPES = {
  THRESHOLD: 'THRESHOLD',
  VELOCITY: 'VELOCITY',
  GEO_MISMATCH: 'GEO_MISMATCH',
  CATEGORICAL_FREQUENCY: 'CATEGORICAL_FREQUENCY',
} as const;

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const;

export const TRANSACTION_CATEGORIES = [
  'FOOD_AND_DINING',
  'SHOPPING',
  'TRAVEL_AND_TRANSPORT',
  'UTILITIES_AND_BILLS',
  'ENTERTAINMENT',
  'FINANCIAL_SERVICES',
  'HEALTH_AND_WELLNESS',
  'OTHERS',
] as const;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
export const CSV_MIME_TYPES = ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'] as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
} as const;
