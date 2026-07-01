CREATE TYPE "RuleCategory" AS ENUM ('AMOUNT', 'LOCATION', 'MERCHANT', 'TIME', 'ACCOUNT', 'DEVICE', 'CUSTOM');
CREATE TYPE "ConditionOperator" AS ENUM ('EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS', 'NOT_CONTAINS', 'IN', 'NOT_IN', 'EXISTS', 'MISSING', 'BETWEEN');
CREATE TYPE "LogicalOperator" AS ENUM ('AND', 'OR');
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RuleExecutionSource" AS ENUM ('UPLOAD', 'MANUAL', 'PLAYGROUND');

ALTER TYPE "ActivityEntity" ADD VALUE IF NOT EXISTS 'RULE';

CREATE TABLE "Rule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "RuleCategory" NOT NULL,
  "severity" "AlertSeverity" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL,
  "weight" INTEGER NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuleGroup" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "parentGroupId" TEXT,
  "operator" "LogicalOperator" NOT NULL DEFAULT 'AND',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RuleGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuleCondition" (
  "id" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "operator" "ConditionOperator" NOT NULL,
  "value" JSONB,
  "dataType" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RuleCondition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuleExecution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "transactionId" TEXT,
  "source" "RuleExecutionSource" NOT NULL,
  "finalScore" INTEGER NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "executionTimeMs" INTEGER NOT NULL,
  "triggeredCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RuleExecution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RuleResult" (
  "id" TEXT NOT NULL,
  "executionId" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "matched" BOOLEAN NOT NULL,
  "score" INTEGER NOT NULL,
  "explanation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RuleResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Rule_organizationId_name_key" ON "Rule"("organizationId", "name");
CREATE INDEX "Rule_organizationId_idx" ON "Rule"("organizationId");
CREATE INDEX "Rule_createdBy_idx" ON "Rule"("createdBy");
CREATE INDEX "Rule_category_idx" ON "Rule"("category");
CREATE INDEX "Rule_severity_idx" ON "Rule"("severity");
CREATE INDEX "Rule_enabled_idx" ON "Rule"("enabled");
CREATE INDEX "Rule_priority_idx" ON "Rule"("priority");
CREATE INDEX "Rule_updatedAt_idx" ON "Rule"("updatedAt");
CREATE INDEX "Rule_organizationId_enabled_priority_idx" ON "Rule"("organizationId", "enabled", "priority");

CREATE INDEX "RuleGroup_ruleId_idx" ON "RuleGroup"("ruleId");
CREATE INDEX "RuleGroup_parentGroupId_idx" ON "RuleGroup"("parentGroupId");
CREATE INDEX "RuleGroup_ruleId_parentGroupId_idx" ON "RuleGroup"("ruleId", "parentGroupId");

CREATE INDEX "RuleCondition_ruleId_idx" ON "RuleCondition"("ruleId");
CREATE INDEX "RuleCondition_groupId_idx" ON "RuleCondition"("groupId");
CREATE INDEX "RuleCondition_field_idx" ON "RuleCondition"("field");
CREATE INDEX "RuleCondition_ruleId_groupId_idx" ON "RuleCondition"("ruleId", "groupId");

CREATE INDEX "RuleExecution_organizationId_idx" ON "RuleExecution"("organizationId");
CREATE INDEX "RuleExecution_transactionId_idx" ON "RuleExecution"("transactionId");
CREATE INDEX "RuleExecution_source_idx" ON "RuleExecution"("source");
CREATE INDEX "RuleExecution_riskLevel_idx" ON "RuleExecution"("riskLevel");
CREATE INDEX "RuleExecution_createdAt_idx" ON "RuleExecution"("createdAt");
CREATE INDEX "RuleExecution_organizationId_createdAt_idx" ON "RuleExecution"("organizationId", "createdAt");

CREATE INDEX "RuleResult_executionId_idx" ON "RuleResult"("executionId");
CREATE INDEX "RuleResult_ruleId_idx" ON "RuleResult"("ruleId");
CREATE INDEX "RuleResult_matched_idx" ON "RuleResult"("matched");
CREATE INDEX "RuleResult_createdAt_idx" ON "RuleResult"("createdAt");

ALTER TABLE "Rule" ADD CONSTRAINT "Rule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RuleGroup" ADD CONSTRAINT "RuleGroup_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleGroup" ADD CONSTRAINT "RuleGroup_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "RuleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleCondition" ADD CONSTRAINT "RuleCondition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RuleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleExecution" ADD CONSTRAINT "RuleExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleExecution" ADD CONSTRAINT "RuleExecution_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleResult" ADD CONSTRAINT "RuleResult_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "RuleExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RuleResult" ADD CONSTRAINT "RuleResult_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
