import {
  ApiKeyCreateSchema,
  ApiKeyQuerySchema,
  AlertBulkActionSchema,
  AlertQuerySchema,
  AlertUpdateSchema,
  MemberCreateSchema,
  MemberUpdateSchema,
  OrganizationUpdateSchema,
  PaginationQuerySchema,
  QueryTransactionsSchema,
  UploadQuerySchema,
} from '@anomaly/shared';
import { z } from 'zod';

export const idParamsValidator = z.object({
  id: z.string().uuid(),
});

export const organizationUpdateValidator = OrganizationUpdateSchema;
export const memberCreateValidator = MemberCreateSchema;
export const memberUpdateValidator = MemberUpdateSchema;
export const apiKeyCreateValidator = ApiKeyCreateSchema;
export const apiKeyQueryValidator = ApiKeyQuerySchema;
export const paginationQueryValidator = PaginationQuerySchema;
export const uploadQueryValidator = UploadQuerySchema;
export const transactionQueryValidator = QueryTransactionsSchema;
export const alertQueryValidator = AlertQuerySchema;
export const alertUpdateValidator = AlertUpdateSchema;
export const alertBulkActionValidator = AlertBulkActionSchema;
