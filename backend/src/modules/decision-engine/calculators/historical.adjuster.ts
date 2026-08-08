export interface HistoricalAdjustmentInput {
  baseScore: number;
  previousFraudCount?: number;
  previousAlertCount?: number;
  previousRejectCount?: number;
  knownDevice?: boolean;
  knownCountry?: boolean;
  knownMerchant?: boolean;
  userAgeDays?: number;
}

export interface HistoricalAdjustmentResult {
  adjustedScore: number;
  delta: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
}

export class HistoricalAdjuster {
  adjust(input: HistoricalAdjustmentInput): HistoricalAdjustmentResult {
    let delta = 0;
    const factors: Array<{ name: string; impact: number; description: string }> = [];

    // Past fraud count penalty (+5 points per fraud incident, capped at +15)
    if (input.previousFraudCount && input.previousFraudCount > 0) {
      const penalty = Math.min(15, input.previousFraudCount * 5);
      delta += penalty;
      factors.push({
        name: 'PREVIOUS_FRAUD_PENALTY',
        impact: penalty,
        description: `Account has ${input.previousFraudCount} historical fraud records (+${penalty} risk)`,
      });
    }

    // Past alert count penalty (+2 points per alert, capped at +10)
    if (input.previousAlertCount && input.previousAlertCount > 0) {
      const penalty = Math.min(10, input.previousAlertCount * 2);
      delta += penalty;
      factors.push({
        name: 'PREVIOUS_ALERTS_PENALTY',
        impact: penalty,
        description: `Account has ${input.previousAlertCount} historical security alerts (+${penalty} risk)`,
      });
    }

    // Known device trust discount (-5 points)
    if (input.knownDevice) {
      delta -= 5;
      factors.push({
        name: 'KNOWN_DEVICE_TRUST',
        impact: -5,
        description: 'Transaction originated from a verified historical device (-5 risk)',
      });
    }

    // Known merchant trust discount (-3 points)
    if (input.knownMerchant) {
      delta -= 3;
      factors.push({
        name: 'KNOWN_MERCHANT_TRUST',
        impact: -3,
        description: 'Transaction at a frequently used merchant (-3 risk)',
      });
    }

    // Unknown country penalty (+8 points)
    if (input.knownCountry === false) {
      delta += 8;
      factors.push({
        name: 'NEW_COUNTRY_PENALTY',
        impact: 8,
        description: 'Transaction originated from an unrecognized country (+8 risk)',
      });
    }

    const rawAdjusted = input.baseScore + delta;
    const adjustedScore = Math.min(100, Math.max(0, Math.round(rawAdjusted * 10) / 10));

    return {
      adjustedScore,
      delta: Math.round(delta * 10) / 10,
      factors,
    };
  }
}
