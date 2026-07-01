import type { AlertSeverity } from '@anomaly/shared';

export const severityOrder: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const severityConfig: Record<
  AlertSeverity,
  {
    label: string;
    cssVar: string;
    className: string;
    borderClassName: string;
    bgClassName: string;
  }
> = {
  CRITICAL: {
    label: 'Critical',
    cssVar: 'var(--critical)',
    className: 'text-severity-critical',
    borderClassName: 'border-severity-critical',
    bgClassName: 'bg-severity-critical/15',
  },
  HIGH: {
    label: 'High',
    cssVar: 'var(--high)',
    className: 'text-severity-high',
    borderClassName: 'border-severity-high',
    bgClassName: 'bg-severity-high/15',
  },
  MEDIUM: {
    label: 'Medium',
    cssVar: 'var(--medium)',
    className: 'text-severity-medium',
    borderClassName: 'border-severity-medium',
    bgClassName: 'bg-severity-medium/15',
  },
  LOW: {
    label: 'Low',
    cssVar: 'var(--low)',
    className: 'text-severity-low',
    borderClassName: 'border-severity-low',
    bgClassName: 'bg-severity-low/15',
  },
};

export function getSeverityConfig(severity: AlertSeverity) {
  return severityConfig[severity];
}
