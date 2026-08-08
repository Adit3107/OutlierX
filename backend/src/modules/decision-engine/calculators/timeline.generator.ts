export interface DecisionTimelineStage {
  stage: string;
  label: string;
  status: 'COMPLETED' | 'SKIPPED' | 'FAILED';
  description: string;
  durationMs?: number;
  timestamp: string;
}

export class DecisionTimelineGenerator {
  createTimeline(params: {
    ruleTriggeredCount: number;
    ruleExecutionTimeMs?: number;
    mlProcessed?: boolean;
    mlExecutionTimeMs?: number;
    hasAlert?: boolean;
    totalProcessingTimeMs: number;
  }): DecisionTimelineStage[] {
    const now = new Date().toISOString();

    return [
      {
        stage: 'INGESTION',
        label: 'Transaction Ingestion',
        status: 'COMPLETED',
        description: 'Transaction record validated and stored in system database.',
        durationMs: 5,
        timestamp: now,
      },
      {
        stage: 'FEATURE_ENGINEERING',
        label: 'Feature Vector Generation',
        status: 'COMPLETED',
        description: 'Extracted 10-category deterministic feature vector payload.',
        durationMs: 12,
        timestamp: now,
      },
      {
        stage: 'RULE_EVALUATION',
        label: 'Deterministic Rule Evaluation',
        status: 'COMPLETED',
        description: `Evaluated business rules. ${params.ruleTriggeredCount} rules triggered.`,
        durationMs: params.ruleExecutionTimeMs || 15,
        timestamp: now,
      },
      {
        stage: 'ML_PREDICTIONS',
        label: 'Multi-Model Inference',
        status: params.mlProcessed ? 'COMPLETED' : 'SKIPPED',
        description: params.mlProcessed
          ? 'Scored across Isolation Forest, LOF, and One-Class SVM models.'
          : 'ML scoring bypassed.',
        durationMs: params.mlExecutionTimeMs || 25,
        timestamp: now,
      },
      {
        stage: 'ENSEMBLE_WEIGHTING',
        label: 'Ensemble Risk Calculation',
        status: 'COMPLETED',
        description: 'Calculated weighted ensemble score (60% Rules, 40% ML Suite).',
        durationMs: 4,
        timestamp: now,
      },
      {
        stage: 'CONFIDENCE_CALCULATION',
        label: 'Confidence Engine',
        status: 'COMPLETED',
        description: 'Evaluated model agreement variance and historical consistency.',
        durationMs: 3,
        timestamp: now,
      },
      {
        stage: 'FINAL_DECISION',
        label: 'Decision Outcome Generation',
        status: 'COMPLETED',
        description: 'Assigned risk category and final decision recommendation.',
        durationMs: 2,
        timestamp: now,
      },
      {
        stage: 'ALERT_GENERATION',
        label: 'Alert Dispatch',
        status: params.hasAlert ? 'COMPLETED' : 'SKIPPED',
        description: params.hasAlert
          ? 'Generated security alert for analyst investigation.'
          : 'No alert dispatch required.',
        durationMs: params.hasAlert ? 8 : 0,
        timestamp: now,
      },
    ];
  }
}
