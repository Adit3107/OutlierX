CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'RESOLVED', 'ARCHIVED');

ALTER TABLE "Alert"
  ADD COLUMN "decisionId" TEXT,
  ADD COLUMN "transactionId" TEXT,
  ADD COLUMN "assignedAnalystId" TEXT,
  ADD COLUMN "riskScore" DOUBLE PRECISION,
  ADD COLUMN "confidence" DOUBLE PRECISION,
  ADD COLUMN "triggeredRules" JSONB,
  ADD COLUMN "recommendation" "DecisionRecommendation",
  ADD COLUMN "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Alert_decisionId_key" ON "Alert"("decisionId");
CREATE INDEX "Alert_decisionId_idx" ON "Alert"("decisionId");
CREATE INDEX "Alert_transactionId_idx" ON "Alert"("transactionId");
CREATE INDEX "Alert_assignedAnalystId_idx" ON "Alert"("assignedAnalystId");
CREATE INDEX "Alert_status_idx" ON "Alert"("status");
CREATE INDEX "Alert_deletedAt_idx" ON "Alert"("deletedAt");
CREATE INDEX "Alert_organizationId_status_severity_idx" ON "Alert"("organizationId", "status", "severity");
CREATE INDEX "Alert_organizationId_isRead_createdAt_idx" ON "Alert"("organizationId", "isRead", "createdAt");

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_assignedAnalystId_fkey" FOREIGN KEY ("assignedAnalystId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Alert" (
  "id",
  "organizationId",
  "decisionId",
  "transactionId",
  "severity",
  "title",
  "description",
  "riskScore",
  "confidence",
  "triggeredRules",
  "recommendation",
  "status",
  "isRead",
  "createdAt",
  "updatedAt"
)
SELECT
  md5(d."id" || '-alert'),
  d."organizationId",
  d."id",
  d."transactionId",
  d."riskLevel"::TEXT::"AlertSeverity",
  CONCAT(INITCAP(LOWER(d."riskLevel"::TEXT)), ' risk decision for ', t."transactionId"),
  COALESCE(d."explanation"->>'summary', 'Decision Engine generated an alert from stored analysis.'),
  d."finalScore",
  d."confidence",
  d."explanation" #> '{ruleBreakdown,triggeredRules}',
  d."recommendation",
  'OPEN',
  false,
  d."processedAt",
  CURRENT_TIMESTAMP
FROM "Decision" d
JOIN "Transaction" t ON t."id" = d."transactionId"
WHERE NOT EXISTS (
  SELECT 1 FROM "Alert" a WHERE a."decisionId" = d."id"
);
