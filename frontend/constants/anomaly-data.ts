import type { AlertSeverity } from '@anomaly/shared';

export type AnomalyStatus = 'NEW' | 'TRIAGED' | 'ESCALATED' | 'SUPPRESSED';

export interface AnomalyEvent {
  id: string;
  transactionId: string;
  eventId: string;
  timestamp: string;
  amount: number;
  currency: string;
  merchant: string;
  channel: string;
  region: string;
  riskScore: number;
  severity: AlertSeverity;
  reason: string;
  status: AnomalyStatus;
  analyst?: string;
}

export const anomalyEvents: AnomalyEvent[] = [
  {
    id: 'evt-9a7f1c',
    transactionId: 'TX-8841-77B2',
    eventId: 'ANM-2026-0701-001',
    timestamp: '2026-07-01T13:58:22+05:30',
    amount: 48250,
    currency: 'USD',
    merchant: 'Orion Asset Desk',
    channel: 'Wire',
    region: 'SG-SIN',
    riskScore: 97,
    severity: 'CRITICAL',
    reason: 'Velocity spike across linked beneficiary accounts',
    status: 'ESCALATED',
    analyst: 'M. Shah',
  },
  {
    id: 'evt-8de23b',
    transactionId: 'TX-8841-769E',
    eventId: 'ANM-2026-0701-002',
    timestamp: '2026-07-01T13:54:10+05:30',
    amount: 18790,
    currency: 'USD',
    merchant: 'Northline Crypto OTC',
    channel: 'API',
    region: 'AE-DXB',
    riskScore: 88,
    severity: 'HIGH',
    reason: 'Merchant category drift from historical profile',
    status: 'NEW',
  },
  {
    id: 'evt-7cdd02',
    transactionId: 'TX-8841-73FA',
    eventId: 'ANM-2026-0701-003',
    timestamp: '2026-07-01T13:47:43+05:30',
    amount: 9240,
    currency: 'EUR',
    merchant: 'Asterion Logistics',
    channel: 'Card-not-present',
    region: 'DE-FRA',
    riskScore: 74,
    severity: 'MEDIUM',
    reason: 'Unusual hour for shipping corridor',
    status: 'TRIAGED',
    analyst: 'R. Iyer',
  },
  {
    id: 'evt-6e0f11',
    transactionId: 'TX-8841-71A8',
    eventId: 'ANM-2026-0701-004',
    timestamp: '2026-07-01T13:41:08+05:30',
    amount: 1210,
    currency: 'GBP',
    merchant: 'Civic Subscription Hub',
    channel: 'ACH',
    region: 'GB-LON',
    riskScore: 39,
    severity: 'LOW',
    reason: 'Low-confidence duplicate descriptor match',
    status: 'SUPPRESSED',
  },
  {
    id: 'evt-5dc2aa',
    transactionId: 'TX-8841-6F22',
    eventId: 'ANM-2026-0701-005',
    timestamp: '2026-07-01T13:38:51+05:30',
    amount: 31750,
    currency: 'USD',
    merchant: 'Helix Escrow Services',
    channel: 'Wire',
    region: 'US-NYC',
    riskScore: 91,
    severity: 'CRITICAL',
    reason: 'Dormant account resumed with high-value outward wire',
    status: 'NEW',
  },
  {
    id: 'evt-4bb177',
    transactionId: 'TX-8841-6BD0',
    eventId: 'ANM-2026-0701-006',
    timestamp: '2026-07-01T13:34:05+05:30',
    amount: 6840,
    currency: 'CAD',
    merchant: 'Veridian Marketplace',
    channel: 'Card-present',
    region: 'CA-TOR',
    riskScore: 69,
    severity: 'MEDIUM',
    reason: 'Geo-distance mismatch against device session',
    status: 'TRIAGED',
    analyst: 'A. Mehta',
  },
  {
    id: 'evt-329ed0',
    transactionId: 'TX-8841-67C4',
    eventId: 'ANM-2026-0701-007',
    timestamp: '2026-07-01T13:29:30+05:30',
    amount: 14980,
    currency: 'USD',
    merchant: 'Kestrel Payments',
    channel: 'API',
    region: 'US-SFO',
    riskScore: 82,
    severity: 'HIGH',
    reason: 'Burst pattern from newly issued API key',
    status: 'ESCALATED',
    analyst: 'M. Shah',
  },
  {
    id: 'evt-25a7de',
    transactionId: 'TX-8841-62AF',
    eventId: 'ANM-2026-0701-008',
    timestamp: '2026-07-01T13:22:12+05:30',
    amount: 520,
    currency: 'JPY',
    merchant: 'Transit Aggregator',
    channel: 'Wallet',
    region: 'JP-TYO',
    riskScore: 28,
    severity: 'LOW',
    reason: 'Minor frequency deviation within monitored wallet cluster',
    status: 'SUPPRESSED',
  },
];

export const trendSeries = [
  { window: '13:00', critical: 1, high: 2, medium: 4, low: 3 },
  { window: '13:10', critical: 2, high: 3, medium: 4, low: 2 },
  { window: '13:20', critical: 1, high: 4, medium: 5, low: 4 },
  { window: '13:30', critical: 3, high: 4, medium: 6, low: 3 },
  { window: '13:40', critical: 4, high: 5, medium: 4, low: 5 },
  { window: '13:50', critical: 5, high: 6, medium: 5, low: 4 },
];

export const analystTimeline = [
  {
    id: 'note-001',
    timestamp: '13:59:01 IST',
    severity: 'CRITICAL' as AlertSeverity,
    text: 'Escalated linked beneficiary cluster to senior review.',
  },
  {
    id: 'note-002',
    timestamp: '13:51:44 IST',
    severity: 'HIGH' as AlertSeverity,
    text: 'API key burst pattern correlated with merchant drift.',
  },
  {
    id: 'note-003',
    timestamp: '13:42:16 IST',
    severity: 'MEDIUM' as AlertSeverity,
    text: 'Geo-distance mismatch queued for device telemetry check.',
  },
];
