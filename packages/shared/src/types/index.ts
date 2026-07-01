import type {
  ACTIVITY_ENTITIES,
  ALERT_SEVERITIES,
  API_KEY_STATUSES,
  CONDITION_OPERATORS,
  LOGICAL_OPERATORS,
  MEMBERSHIP_STATUSES,
  PERMISSIONS,
  RISK_LEVELS,
  RULE_CATEGORIES,
  RULE_EXECUTION_SOURCES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
  UPLOAD_STATUSES,
} from '../constants/index.js';

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];
export type Role = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[keyof typeof MEMBERSHIP_STATUSES];
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];
export type ApiKeyStatus = (typeof API_KEY_STATUSES)[keyof typeof API_KEY_STATUSES];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[keyof typeof ALERT_SEVERITIES];
export type ActivityEntity = (typeof ACTIVITY_ENTITIES)[keyof typeof ACTIVITY_ENTITIES];
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type UploadStatus = (typeof UPLOAD_STATUSES)[keyof typeof UPLOAD_STATUSES];
export type RuleCategory = (typeof RULE_CATEGORIES)[keyof typeof RULE_CATEGORIES];
export type RuleSeverity = AlertSeverity;
export type ConditionOperator = (typeof CONDITION_OPERATORS)[keyof typeof CONDITION_OPERATORS];
export type LogicalOperator = (typeof LOGICAL_OPERATORS)[keyof typeof LOGICAL_OPERATORS];
export type RiskLevel = (typeof RISK_LEVELS)[keyof typeof RISK_LEVELS];
export type RuleExecutionSource =
  (typeof RULE_EXECUTION_SOURCES)[keyof typeof RULE_EXECUTION_SOURCES];
export type ApiDate = string | Date;

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  status: UserStatus;
  currentOrganizationId?: string | null;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  industry?: string | null;
  website?: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  maxUsers: number;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  status: MembershipStatus;
  joinedAt: ApiDate;
  createdAt: ApiDate;
  updatedAt: ApiDate;
  user?: User;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  createdById?: string | null;
  name: string;
  keyPreview?: string;
  lastUsedAt?: ApiDate | null;
  expiresAt?: ApiDate | null;
  status: ApiKeyStatus;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface Alert {
  id: string;
  organizationId: string;
  userId?: string | null;
  severity: AlertSeverity;
  title: string;
  description?: string | null;
  isRead: boolean;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface ActivityLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: ActivityEntity;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: ApiDate;
  updatedAt: ApiDate;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'avatar'> | null;
}

export interface AuthContext {
  user: User;
  organization: Organization;
  membership: Membership;
  role: Role;
  permissions: Permission[];
}

export interface Transaction {
  id: string;
  organizationId: string;
  uploadId: string;
  transactionId: string;
  timestamp: ApiDate;
  amount: number;
  currency: string;
  merchant: string;
  merchantCategory?: string | null;
  accountNumber?: string | null;
  country?: string | null;
  city?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  customerId?: string | null;
  status: 'IMPORTED';
  metadata?: Record<string, unknown> | null;
  createdAt: ApiDate;
  updatedAt: ApiDate;
  upload?: Pick<Upload, 'id' | 'filename' | 'originalFilename' | 'createdAt'> & {
    uploadedBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
    organization?: Pick<Organization, 'id' | 'name' | 'slug'> | null;
  };
}

export interface UploadRowError {
  row: number;
  transactionId?: string | null;
  errors: string[];
}

export interface UploadSummary {
  totalRows: number;
  processedRows: number;
  failedRows: number;
  processingTime: number;
  errors: UploadRowError[];
}

export interface Upload {
  id: string;
  organizationId: string;
  uploadedById: string;
  filename: string;
  originalFilename: string;
  storageKey: string;
  storageUrl: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  status: UploadStatus;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  processingTime?: number | null;
  errorSummary?: UploadRowError[] | null;
  createdAt: ApiDate;
  updatedAt: ApiDate;
}

export interface DetectionRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'THRESHOLD' | 'VELOCITY' | 'GEO_MISMATCH' | 'CATEGORICAL_FREQUENCY';
  parameters: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConditionNode {
  type: 'condition';
  id?: string;
  field: string;
  operator: ConditionOperator;
  value?: unknown;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  position?: number;
}

export interface RuleGroupNode {
  type: 'group';
  id?: string;
  operator: LogicalOperator;
  position?: number;
  children: RuleTreeNode[];
}

export type RuleTreeNode = RuleConditionNode | RuleGroupNode;

export interface Rule {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  category: RuleCategory;
  severity: RuleSeverity;
  enabled: boolean;
  priority: number;
  weight: number;
  createdBy?: string | null;
  createdAt: ApiDate;
  updatedAt: ApiDate;
  conditionTree: RuleGroupNode;
  createdByUser?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
}

export interface RuleResult {
  id?: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: RuleSeverity;
  matched: boolean;
  score: number;
  explanation: string;
}

export interface RuleExecution {
  id: string;
  organizationId: string;
  transactionId?: string | null;
  source: RuleExecutionSource;
  finalScore: number;
  riskLevel: RiskLevel;
  executionTimeMs: number;
  triggeredCount: number;
  createdAt: ApiDate;
  transaction?: Pick<Transaction, 'id' | 'transactionId' | 'merchant' | 'amount' | 'currency'> | null;
  results?: RuleResult[];
}

export interface RuleEvaluationResponse {
  executionId?: string;
  finalScore: number;
  riskLevel: RiskLevel;
  triggeredRules: RuleResult[];
  results: RuleResult[];
  executionTimeMs: number;
}

export interface ApiFailure {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiFailure;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
