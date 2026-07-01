import type { AlertSeverity, ChartDatum, DashboardCharts, HeatMapDatum, TimeSeriesDatum } from '@anomaly/shared';

export class ChartBuilder {
  build(input: {
    riskDistribution: Array<{ riskLevel: string; _count: { _all: number } }>;
    riskTrend: Array<{ date: Date; value: number }>;
    dailyTransactionVolume: Array<{ date: Date; value: bigint | number }>;
    transactionsByCountry: Array<{ country: string | null; _count: { _all: number } }>;
    transactionsByMerchant: Array<{ merchant: string; _count: { _all: number } }>;
    paymentMethodDistribution: Array<{ paymentMethod: string | null; _count: { _all: number } }>;
    currencyDistribution: Array<{ currency: string; _count: { _all: number } }>;
    topRiskyMerchants: ChartDatum[];
    topRiskyCountries: Array<{ name: string | null; value: number }>;
    hourlyTransactionHeatmap: Array<{ day: string; hour: number; value: bigint | number }>;
    ruleTriggerFrequency: ChartDatum[];
    modelPredictionDistribution: Array<{ mlPrediction: string; _count: { _all: number } }>;
    recentUploadTrend: Array<{ date: Date; value: bigint | number }>;
    recentAlertTrend: Array<{ date: Date; value: bigint | number }>;
  }): DashboardCharts {
    return {
      riskDistribution: input.riskDistribution.map((item) => ({
        name: item.riskLevel,
        label: this.title(item.riskLevel),
        value: item._count._all,
        severity: item.riskLevel as AlertSeverity,
      })),
      riskTrend: this.time(input.riskTrend),
      dailyTransactionVolume: this.time(input.dailyTransactionVolume),
      transactionsByCountry: input.transactionsByCountry.map((item) => this.datum(item.country ?? 'Unknown', item._count._all)),
      transactionsByMerchant: input.transactionsByMerchant.map((item) => this.datum(item.merchant, item._count._all)),
      paymentMethodDistribution: input.paymentMethodDistribution.map((item) => this.datum(item.paymentMethod ?? 'Unknown', item._count._all)),
      currencyDistribution: input.currencyDistribution.map((item) => this.datum(item.currency, item._count._all)),
      topRiskyMerchants: input.topRiskyMerchants,
      topRiskyCountries: input.topRiskyCountries.map((item) => this.datum(item.name ?? 'Unknown', item.value)),
      hourlyTransactionHeatmap: input.hourlyTransactionHeatmap.map((item): HeatMapDatum => ({
        day: item.day.trim(),
        hour: item.hour,
        value: Number(item.value),
      })),
      ruleTriggerFrequency: input.ruleTriggerFrequency,
      modelPredictionDistribution: input.modelPredictionDistribution.map((item) => this.datum(item.mlPrediction, item._count._all)),
      recentUploadTrend: this.time(input.recentUploadTrend),
      recentAlertTrend: this.time(input.recentAlertTrend),
    };
  }

  private datum(name: string, value: number): ChartDatum {
    return { name, label: this.title(name), value: Math.round(value * 100) / 100 };
  }

  private time(rows: Array<{ date: Date; value: bigint | number }>): TimeSeriesDatum[] {
    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      label: row.date.toISOString().slice(0, 10),
      value: Number(row.value),
    }));
  }

  private title(value: string) {
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' ');
  }
}
