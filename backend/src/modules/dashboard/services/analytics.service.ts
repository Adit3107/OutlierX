import type { AnalyticsPayload } from '@anomaly/shared';
import { ActivityService } from '../../../services/foundation.service.js';
import { DashboardService } from './dashboard.service.js';

export class AnalyticsService {
  constructor(
    private dashboardService: DashboardService,
    private activityService: ActivityService
  ) {}

  async getAnalytics(organizationId: string, userId: string): Promise<AnalyticsPayload> {
    const [summary, charts, activity] = await Promise.all([
      this.dashboardService.getSummary(organizationId, userId),
      this.dashboardService.getCharts(organizationId),
      this.dashboardService.getActivity(organizationId),
    ]);

    await this.activityService.log({
      organizationId,
      userId,
      action: 'analytics.exported',
      entity: 'SYSTEM',
      metadata: { mode: 'view' },
    });

    return { summary, charts, activity };
  }
}
