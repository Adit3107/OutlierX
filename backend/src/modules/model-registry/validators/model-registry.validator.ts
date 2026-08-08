import {
  ModelActivateSchema,
  ModelArchiveSchema,
  ModelCompareSchema,
  ModelRollbackSchema,
} from '@anomaly/shared';

export const modelActivateValidator = ModelActivateSchema;
export const modelRollbackValidator = ModelRollbackSchema;
export const modelArchiveValidator = ModelArchiveSchema;
export const modelCompareValidator = ModelCompareSchema;
