CREATE TABLE "MlPrediction" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "mlScore" DOUBLE PRECISION NOT NULL,
  "mlPrediction" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL,
  "processingTime" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MlPrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MlPrediction_transactionId_key" ON "MlPrediction"("transactionId");
CREATE INDEX "MlPrediction_organizationId_idx" ON "MlPrediction"("organizationId");
CREATE INDEX "MlPrediction_transactionId_idx" ON "MlPrediction"("transactionId");
CREATE INDEX "MlPrediction_mlPrediction_idx" ON "MlPrediction"("mlPrediction");
CREATE INDEX "MlPrediction_modelVersion_idx" ON "MlPrediction"("modelVersion");
CREATE INDEX "MlPrediction_processedAt_idx" ON "MlPrediction"("processedAt");
CREATE INDEX "MlPrediction_organizationId_processedAt_idx" ON "MlPrediction"("organizationId", "processedAt");

ALTER TABLE "MlPrediction" ADD CONSTRAINT "MlPrediction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MlPrediction" ADD CONSTRAINT "MlPrediction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
