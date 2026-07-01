export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'MEMBER' | 'OWNER';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  description?: string;
  anomalous: boolean;
  anomalyScore?: number;
  anomalyReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DetectionRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'THRESHOLD' | 'VELOCITY' | 'GEO_MISMATCH' | 'CATEGORICAL_FREQUENCY';
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
