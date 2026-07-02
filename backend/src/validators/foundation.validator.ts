import {
  ApiKeyCreateSchema,
  ApiKeyQuerySchema,
  ApiKeyUpdateSchema,
  ActivityQuerySchema,
  AlertBulkActionSchema,
  AlertQuerySchema,
  AlertUpdateSchema,
  MemberCreateSchema,
  MemberQuerySchema,
  MemberUpdateSchema,
  OrganizationDeleteSchema,
  OrganizationTransferSchema,
  OrganizationUpdateSchema,
  PaginationQuerySchema,
  ProfileUpdateSchema,
  QueryTransactionsSchema,
  SettingsUpdateSchema,
  UploadQuerySchema,
} from '@anomaly/shared';
import { z } from 'zod';

export const idParamsValidator = z.object({
  id: z.string().uuid(),
});

export const organizationUpdateValidator = OrganizationUpdateSchema;
export const organizationTransferValidator = OrganizationTransferSchema;
export const organizationDeleteValidator = OrganizationDeleteSchema;
export const profileUpdateValidator = ProfileUpdateSchema;
export const settingsUpdateValidator = SettingsUpdateSchema;
export const memberCreateValidator = MemberCreateSchema;
export const memberQueryValidator = MemberQuerySchema;
export const memberUpdateValidator = MemberUpdateSchema;
export const apiKeyCreateValidator = ApiKeyCreateSchema;
export const apiKeyUpdateValidator = ApiKeyUpdateSchema;
export const apiKeyQueryValidator = ApiKeyQuerySchema;
export const activityQueryValidator = ActivityQuerySchema;
export const paginationQueryValidator = PaginationQuerySchema;
export const uploadQueryValidator = UploadQuerySchema;
export const transactionQueryValidator = QueryTransactionsSchema;
export const alertQueryValidator = AlertQuerySchema;
export const alertUpdateValidator = AlertUpdateSchema;
export const alertBulkActionValidator = AlertBulkActionSchema;
