ALTER TYPE "ActivityEntity" ADD VALUE IF NOT EXISTS 'TRANSACTION';

CREATE INDEX IF NOT EXISTS "Transaction_organizationId_timestamp_idx" ON "Transaction"("organizationId", "timestamp");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_createdAt_idx" ON "Transaction"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_merchant_idx" ON "Transaction"("organizationId", "merchant");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_country_idx" ON "Transaction"("organizationId", "country");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_currency_idx" ON "Transaction"("organizationId", "currency");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_status_idx" ON "Transaction"("organizationId", "status");
