-- ExtendEnum
ALTER TYPE "UploadStatus" ADD VALUE IF NOT EXISTS 'PARSING';
ALTER TYPE "UploadStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "UploadStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN "originalFilename" TEXT;
ALTER TABLE "Upload" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "Upload" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "Upload" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Upload" ADD COLUMN "fileHash" TEXT;
ALTER TABLE "Upload" ADD COLUMN "totalRows" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Upload" ADD COLUMN "processedRows" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Upload" ADD COLUMN "failedRows" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Upload" ADD COLUMN "processingTime" INTEGER;
ALTER TABLE "Upload" ADD COLUMN "errorSummary" JSONB;

UPDATE "Upload"
SET
  "originalFilename" = "filename",
  "storageKey" = "storageUrl",
  "mimeType" = 'text/csv',
  "fileSize" = 0,
  "fileHash" = "id",
  "totalRows" = "totalRecords",
  "processedRows" = "processedRecords",
  "failedRows" = "failedRecords";

ALTER TABLE "Upload" ALTER COLUMN "originalFilename" SET NOT NULL;
ALTER TABLE "Upload" ALTER COLUMN "storageKey" SET NOT NULL;
ALTER TABLE "Upload" ALTER COLUMN "mimeType" SET NOT NULL;
ALTER TABLE "Upload" ALTER COLUMN "fileSize" SET NOT NULL;
ALTER TABLE "Upload" ALTER COLUMN "fileHash" SET NOT NULL;
ALTER TABLE "Upload" DROP COLUMN "processingStatus";
ALTER TABLE "Upload" DROP COLUMN "totalRecords";
ALTER TABLE "Upload" DROP COLUMN "processedRecords";
ALTER TABLE "Upload" DROP COLUMN "failedRecords";

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "merchantCategory" TEXT,
    "accountNumber" TEXT,
    "country" TEXT,
    "city" TEXT,
    "paymentMethod" TEXT,
    "description" TEXT,
    "referenceNumber" TEXT,
    "customerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Upload_organizationId_fileHash_key" ON "Upload"("organizationId", "fileHash");
CREATE INDEX "Transaction_organizationId_idx" ON "Transaction"("organizationId");
CREATE INDEX "Transaction_transactionId_idx" ON "Transaction"("transactionId");
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");
CREATE INDEX "Transaction_merchant_idx" ON "Transaction"("merchant");
CREATE INDEX "Transaction_country_idx" ON "Transaction"("country");
CREATE INDEX "Transaction_amount_idx" ON "Transaction"("amount");
CREATE INDEX "Transaction_uploadId_idx" ON "Transaction"("uploadId");

-- DropIndex
DROP INDEX IF EXISTS "Upload_processingStatus_idx";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
