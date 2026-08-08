export interface EnsembleScoreInput {
  ruleScore: number;
  isolationForestScore?: number | null;
  lofScore?: number | null;
  oneClassSvmScore?: number | null;
  ruleWeight?: number;
  mlWeight?: number;
  ifWeight?: number;
  lofWeight?: number;
  svmWeight?: number;
}

export interface EnsembleScoreResult {
  rawScore: number;
  normalizedScore: number;
  ruleContribution: number;
  mlContribution: number;
  mlBreakdown: {
    isolationForest: number;
    localOutlierFactor: number;
    oneClassSvm: number;
    combinedMlScore: number;
  };
  weightsUsed: {
    ruleWeight: number;
    mlWeight: number;
    ifWeight: number;
    lofWeight: number;
    svmWeight: number;
  };
}

export class EnsembleCalculator {
  calculate(input: EnsembleScoreInput): EnsembleScoreResult {
    const ruleWeight = input.ruleWeight ?? 0.60;
    const mlWeight = input.mlWeight ?? 0.40;
    const ifWeight = input.ifWeight ?? 0.40;
    const lofWeight = input.lofWeight ?? 0.30;
    const svmWeight = input.svmWeight ?? 0.30;

    const ifScore = input.isolationForestScore ?? input.ruleScore;
    const lofScore = input.lofScore ?? ifScore;
    const svmScore = input.oneClassSvmScore ?? ifScore;

    // Sub-ML Ensemble calculation
    const totalMlSubWeight = ifWeight + lofWeight + svmWeight;
    const combinedMlScore =
      totalMlSubWeight > 0
        ? (ifScore * ifWeight + lofScore * lofWeight + svmScore * svmWeight) / totalMlSubWeight
        : ifScore;

    // Overall Ensemble calculation
    const totalWeight = ruleWeight + mlWeight;
    const rawScore =
      totalWeight > 0
        ? (input.ruleScore * ruleWeight + combinedMlScore * mlWeight) / totalWeight
        : input.ruleScore;

    const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

    return {
      rawScore: Math.round(rawScore * 100) / 100,
      normalizedScore,
      ruleContribution: Math.round(((input.ruleScore * ruleWeight) / totalWeight) * 10) / 10,
      mlContribution: Math.round(((combinedMlScore * mlWeight) / totalWeight) * 10) / 10,
      mlBreakdown: {
        isolationForest: Math.round(ifScore * 10) / 10,
        localOutlierFactor: Math.round(lofScore * 10) / 10,
        oneClassSvm: Math.round(svmScore * 10) / 10,
        combinedMlScore: Math.round(combinedMlScore * 10) / 10,
      },
      weightsUsed: {
        ruleWeight,
        mlWeight,
        ifWeight,
        lofWeight,
        svmWeight,
      },
    };
  }
}
