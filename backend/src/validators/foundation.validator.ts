import {
  ApiKeyCreateSchema,
  ApiKeyQuerySchema,
  MemberCreateSchema,
  MemberUpdateSchema,
  OrganizationUpdateSchema,
  PaginationQuerySchema,
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
