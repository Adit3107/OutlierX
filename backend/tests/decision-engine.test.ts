import { EnsembleCalculator } from '../src/modules/decision-engine/calculators/ensemble.calculator.js';
import { HistoricalAdjuster } from '../src/modules/decision-engine/calculators/historical.adjuster.js';
import { DecisionTimelineGenerator } from '../src/modules/decision-engine/calculators/timeline.generator.js';

describe('Decision Engine Phase 2.3 Unit Tests', () => {
  describe('EnsembleCalculator', () => {
    it('should correctly calculate 60% Rule and 40% ML weighted ensemble score', () => {
      const calculator = new EnsembleCalculator();
      const result = calculator.calculate({
        ruleScore: 80,
        isolationForestScore: 50,
        lofScore: 40,
        oneClassSvmScore: 40,
        ruleWeight: 0.60,
        mlWeight: 0.40,
      });

      // Combined ML: (50*0.4 + 40*0.3 + 40*0.3) / 1.0 = 20 + 12 + 12 = 44
      // Ensemble: (80*0.6 + 44*0.4) = 48 + 17.6 = 65.6 -> rounded 65.6
      expect(result.rawScore).toBeCloseTo(65.6, 1);
      expect(result.normalizedScore).toBe(65.6);
      expect(result.ruleContribution).toBe(48);
      expect(result.mlContribution).toBe(17.6);
    });
  });

  describe('HistoricalAdjuster', () => {
    it('should adjust risk score based on previous fraud and alerts', () => {
      const adjuster = new HistoricalAdjuster();
      const result = adjuster.adjust({
        baseScore: 50,
        previousFraudCount: 2, // +10
        previousAlertCount: 1, // +2
        knownDevice: true, // -5
      });

      // 50 + 10 + 2 - 5 = 57
      expect(result.adjustedScore).toBe(57);
      expect(result.delta).toBe(7);
      expect(result.factors.length).toBe(3);
    });
  });

  describe('DecisionTimelineGenerator', () => {
    it('should generate structured 8-stage decision timeline', () => {
      const generator = new DecisionTimelineGenerator();
      const timeline = generator.createTimeline({
        ruleTriggeredCount: 3,
        ruleExecutionTimeMs: 10,
        mlProcessed: true,
        mlExecutionTimeMs: 20,
        hasAlert: true,
        totalProcessingTimeMs: 45,
      });

      expect(timeline.length).toBe(8);
      expect(timeline[0].stage).toBe('INGESTION');
      expect(timeline[2].stage).toBe('RULE_EVALUATION');
      expect(timeline[6].stage).toBe('FINAL_DECISION');
      expect(timeline[7].stage).toBe('ALERT_GENERATION');
    });
  });
});
