CREATE TYPE "DecisionRecommendation" AS ENUM ('APPROVE', 'MONITOR', 'MANUAL_REVIEW', 'BLOCK_TRANSACTION', 'ESCALATE');

CREATE TABLE "Decision" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "ruleExecutionId" TEXT,
  "mlPredictionId" TEXT,
  "ruleScore" DOUBLE PRECISION NOT NULL,
  "mlScore" DOUBLE PRECISION NOT NULL,
  "finalScore" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "decisionStrategy" TEXT NOT NULL,
  "decisionVersion" TEXT NOT NULL,
  "explanation" JSONB NOT NULL,
  "recommendation" "DecisionRecommendation" NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Decision_organizationId_idx" ON "Decision"("organizationId");
CREATE INDEX "Decision_transactionId_idx" ON "Decision"("transactionId");
CREATE INDEX "Decision_ruleExecutionId_idx" ON "Decision"("ruleExecutionId");
CREATE INDEX "Decision_mlPredictionId_idx" ON "Decision"("mlPredictionId");
CREATE INDEX "Decision_riskLevel_idx" ON "Decision"("riskLevel");
CREATE INDEX "Decision_recommendation_idx" ON "Decision"("recommendation");
CREATE INDEX "Decision_decisionStrategy_idx" ON "Decision"("decisionStrategy");
CREATE INDEX "Decision_processedAt_idx" ON "Decision"("processedAt");
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");
CREATE INDEX "Decision_organizationId_processedAt_idx" ON "Decision"("organizationId", "processedAt");
CREATE INDEX "Decision_organizationId_transactionId_processedAt_idx" ON "Decision"("organizationId", "transactionId", "processedAt");

ALTER TABLE "Decision" ADD CONSTRAINT "Decision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_ruleExecutionId_fkey" FOREIGN KEY ("ruleExecutionId") REFERENCES "RuleExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_mlPredictionId_fkey" FOREIGN KEY ("mlPredictionId") REFERENCES "MlPrediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
