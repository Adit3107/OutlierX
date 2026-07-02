'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  FlaskConical,
  GitBranch,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  WalletCards,
} from 'lucide-react';
import type {
  ApiDate,
  AuthContext,
  ConditionOperator,
  LogicalOperator,
  PaginatedResponse,
  Rule,
  RuleConditionNode,
  RuleEvaluationResponse,
  RuleExecution,
  RuleGroupNode,
  RuleSeverity,
} from '@anomaly/shared';
import { CONDITION_OPERATORS, PERMISSIONS, RULE_CATEGORIES, ALERT_SEVERITIES } from '@anomaly/shared';
import { createApiClient } from '../../lib/api-client';
import { useAuthData } from '../../providers/auth-provider';
import {
  RulePayload,
  RuleFilters,
  useCreateRule,
  useDeleteRule,
  useDuplicateRule,
  useRule,
  useRuleHistory,
  useRules,
  useTestRules,
  useToggleRule,
  useUpdateRule,
} from '../../hooks/rules/use-rules';
import { AppShell } from '../app-shell';


function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatDate(value?: ApiDate | null) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function severityClass(severity: RuleSeverity) {
  return {
    LOW: 'border-low/40 bg-low/10 text-low',
    MEDIUM: 'border-medium/40 bg-medium/10 text-medium',
    HIGH: 'border-high/40 bg-high/10 text-high',
    CRITICAL: 'border-critical/40 bg-critical/10 text-critical',
  }[severity];
}

function SeverityBadge({ severity }: { severity: RuleSeverity }) {
  return (
    <span className={cn('inline-flex h-6 items-center rounded-md border px-2 font-mono text-[11px] uppercase', severityClass(severity))}>
      {severity}
    </span>
  );
}

function RiskBadge({ level }: { level: RuleSeverity }) {
  return <SeverityBadge severity={level} />;
}

function Shell({
  active,
  children,
}: {
  auth: AuthContext | null;
  active: 'rules' | 'playground';
  children: React.ReactNode;
}) {
  const title = active === 'playground' ? 'Rule Playground' : 'Rules';
  return <AppShell title={title} breadcrumb="OPS / RULES"><div className="space-y-4">{children}</div></AppShell>;
}


function RuleSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        aria-label="Search rules"
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search rule name or description"
        value={value}
      />
    </label>
  );
}

function RuleTable({
  data,
  canUpdate,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  data?: PaginatedResponse<Rule>;
  canUpdate: boolean;
  onToggle: (rule: Rule) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rules = data?.items ?? [];
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="px-3">Rule Name</th>
              <th className="px-3">Category</th>
              <th className="px-3">Priority</th>
              <th className="px-3">Weight</th>
              <th className="px-3">Severity</th>
              <th className="px-3">Enabled</th>
              <th className="px-3">Created By</th>
              <th className="px-3">Last Updated</th>
              <th className="px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="h-11 border-b border-border/70 hover:bg-surface-alt/65">
                <td className="max-w-[240px] truncate px-3">
                  <Link className="font-medium text-foreground hover:text-primary" href={`/rules/${rule.id}`}>
                    {rule.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{rule.description ?? '-'}</p>
                </td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{rule.category}</td>
                <td className="px-3 font-mono text-xs">{rule.priority}</td>
                <td className="px-3 font-mono text-xs">{rule.weight}</td>
                <td className="px-3"><SeverityBadge severity={rule.severity} /></td>
                <td className="px-3">
                  <button className="h-7 rounded-md border border-border px-2 font-mono text-[11px] uppercase text-muted-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => onToggle(rule)} type="button">
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="max-w-[150px] truncate px-3 text-xs text-muted-foreground">{rule.createdByUser?.email ?? '-'}</td>
                <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(rule.updatedAt)}</td>
                <td className="px-3 text-right">
                  <div className="inline-flex gap-2">
                    <button aria-label="Duplicate rule" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => onDuplicate(rule.id)} type="button">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button aria-label="Delete rule" className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => onDelete(rule.id)} type="button">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rules.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="font-display text-lg font-semibold">No rules found.</p>
          <p className="mt-1 text-sm text-muted-foreground">Create or seed rules to begin deterministic scoring.</p>
        </div>
      ) : null}
    </section>
  );
}

const emptyCondition = (position = 0): RuleConditionNode => ({
  type: 'condition',
  field: 'amount',
  operator: 'GT',
  value: 50000,
  dataType: 'number',
  position,
});

const emptyTree = (): RuleGroupNode => ({
  type: 'group',
  operator: 'AND',
  children: [emptyCondition(0)],
});

function parseValue(value: string, dataType: RuleConditionNode['dataType'], operator: ConditionOperator) {
  if (operator === 'MISSING' || operator === 'EXISTS') {
    return null;
  }
  if (operator === 'IN' || operator === 'NOT_IN' || operator === 'BETWEEN' || dataType === 'array') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (dataType === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (dataType === 'boolean') {
    return value === 'true';
  }
  return value;
}

function valueToInput(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : value === null || value === undefined ? '' : String(value);
}

function ConditionEditor({
  node,
  onChange,
  onRemove,
}: {
  node: RuleConditionNode;
  onChange: (node: RuleConditionNode) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-background p-2 md:grid-cols-[1fr_150px_130px_1fr_36px]">
      <input className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" onChange={(event) => onChange({ ...node, field: event.target.value })} placeholder="Field" value={node.field} />
      <select className="h-9 rounded-md border border-border bg-surface px-2 text-xs outline-none" onChange={(event) => onChange({ ...node, operator: event.target.value as ConditionOperator })} value={node.operator}>
        {Object.values(CONDITION_OPERATORS).map((operator) => <option key={operator} value={operator}>{operator}</option>)}
      </select>
      <select className="h-9 rounded-md border border-border bg-surface px-2 text-xs outline-none" onChange={(event) => onChange({ ...node, dataType: event.target.value as RuleConditionNode['dataType'] })} value={node.dataType}>
        {['string', 'number', 'date', 'boolean', 'array'].map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <input className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" disabled={node.operator === 'EXISTS' || node.operator === 'MISSING'} onChange={(event) => onChange({ ...node, value: parseValue(event.target.value, node.dataType, node.operator) })} placeholder="Value or comma-separated list" value={valueToInput(node.value)} />
      <button aria-label="Remove condition" className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground" onClick={onRemove} type="button">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function GroupEditor({ group, onChange }: { group: RuleGroupNode; onChange: (group: RuleGroupNode) => void }) {
  const updateChild = (index: number, child: RuleGroupNode['children'][number]) => {
    onChange({ ...group, children: group.children.map((item, itemIndex) => itemIndex === index ? { ...child, position: itemIndex } : item) });
  };

  return (
    <section className="space-y-3 rounded-md border border-border bg-surface-alt p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none" onChange={(event) => onChange({ ...group, operator: event.target.value as LogicalOperator })} value={group.operator}>
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
        <div className="flex gap-2">
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground" onClick={() => onChange({ ...group, children: [...group.children, emptyCondition(group.children.length)] })} type="button">
            <Plus className="h-3.5 w-3.5" /> Condition
          </button>
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 text-xs text-foreground" onClick={() => onChange({ ...group, children: [...group.children, { type: 'group', operator: 'AND', position: group.children.length, children: [emptyCondition(0)] }] })} type="button">
            <GitBranch className="h-3.5 w-3.5" /> Group
          </button>
        </div>
      </div>
      {group.children.map((child, index) => child.type === 'group' ? (
        <GroupEditor key={child.id ?? `group-${index}`} group={child} onChange={(next) => updateChild(index, next)} />
      ) : (
        <ConditionEditor
          key={child.id ?? `condition-${index}`}
          node={child}
          onChange={(next) => updateChild(index, next)}
          onRemove={() => onChange({ ...group, children: group.children.filter((_, itemIndex) => itemIndex !== index) })}
        />
      ))}
    </section>
  );
}

function RuleForm({ initialRule }: { initialRule?: Rule }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const createRule = useCreateRule(client);
  const updateRule = useUpdateRule(client, initialRule?.id ?? '');
  const [form, setForm] = React.useState<RulePayload>(() => ({
    name: initialRule?.name ?? '',
    description: initialRule?.description ?? '',
    category: initialRule?.category ?? 'AMOUNT',
    severity: initialRule?.severity ?? 'MEDIUM',
    enabled: initialRule?.enabled ?? true,
    priority: initialRule?.priority ?? 100,
    weight: initialRule?.weight ?? 10,
    conditionTree: initialRule?.conditionTree ?? emptyTree(),
  }));

  const save = () => {
    const mutation = initialRule ? updateRule : createRule;
    mutation.mutate(form, {
      onSuccess: (rule) => {
        toast.success(initialRule ? 'Rule updated' : 'Rule created');
        void queryClient.invalidateQueries({ queryKey: ['rules'] });
        router.push(`/rules/${rule.id}`);
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to save rule'),
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-border bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none md:col-span-2" onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Rule name" value={form.name} />
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setForm({ ...form, category: event.target.value as RulePayload['category'] })} value={form.category}>
            {Object.values(RULE_CATEGORIES).map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" onChange={(event) => setForm({ ...form, severity: event.target.value as RuleSeverity })} value={form.severity}>
            {Object.values(ALERT_SEVERITIES).map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
          <input className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" min="1" onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} placeholder="Priority" type="number" value={form.priority} />
          <input className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none" min="0" max="100" onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} placeholder="Weight" type="number" value={form.weight} />
          <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
            <input checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} type="checkbox" />
            Enabled
          </label>
          <input className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none xl:col-span-4" onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" value={form.description ?? ''} />
        </div>
      </section>
      <GroupEditor group={form.conditionTree} onChange={(conditionTree) => setForm({ ...form, conditionTree })} />
      <div className="flex justify-end gap-2">
        <Link className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm text-foreground" href="/rules">Cancel</Link>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground disabled:opacity-60" disabled={!form.name || createRule.isPending || updateRule.isPending} onClick={save} type="button">
          <Save className="h-4 w-4" /> Save Rule
        </button>
      </div>
    </div>
  );
}

export function RulesPageContent() {
  const { getToken } = useAuth();
  const { auth, hasPermission } = useAuthData();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const [filters, setFilters] = React.useState<RuleFilters>({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    severity: '',
    enabled: '',
    sortBy: 'priority',
    sortOrder: 'asc',
  });
  const rulesQuery = useRules(client, filters);
  const toggleRule = useToggleRule(client);
  const duplicateRule = useDuplicateRule(client);
  const deleteRule = useDeleteRule(client);
  const canCreate = hasPermission(PERMISSIONS.RULES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.RULES_UPDATE);

  return (
    <Shell active="rules" auth={auth}>
      <div className="flex flex-wrap items-center gap-2">
        <RuleSearch value={filters.search ?? ''} onChange={(search) => setFilters({ ...filters, search, page: 1 })} />
        <button aria-label="Refresh rules" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground" onClick={() => void rulesQuery.refetch()} type="button">
          <RefreshCw className="h-4 w-4" />
        </button>
        {canCreate ? (
          <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-primary-strong px-3 text-sm font-medium text-primary-foreground" href="/rules/new">
            <Plus className="h-4 w-4" /> New Rule
          </Link>
        ) : null}
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        <select className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" onChange={(event) => setFilters({ ...filters, category: event.target.value as never, page: 1 })}>
          <option value="">All categories</option>
          {Object.values(RULE_CATEGORIES).map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" onChange={(event) => setFilters({ ...filters, severity: event.target.value as never, page: 1 })}>
          <option value="">All severities</option>
          {Object.values(ALERT_SEVERITIES).map((severity) => <option key={severity} value={severity}>{severity}</option>)}
        </select>
        <select className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" onChange={(event) => setFilters({ ...filters, enabled: event.target.value === '' ? '' : event.target.value === 'true', page: 1 })}>
          <option value="">Any status</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
        <select className="h-9 rounded-md border border-border bg-surface px-3 text-xs outline-none" onChange={(event) => setFilters({ ...filters, sortBy: event.target.value as never })} value={filters.sortBy}>
          {['priority', 'updatedAt', 'name', 'category', 'severity', 'weight'].map((field) => <option key={field} value={field}>{field}</option>)}
        </select>
      </section>
      {rulesQuery.error ? <section className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">Unable to load rules.</section> : null}
      <RuleTable
        canUpdate={canUpdate}
        data={rulesQuery.data}
        onDelete={(id) => deleteRule.mutate(id, { onSuccess: () => { toast.success('Rule deleted'); void queryClient.invalidateQueries({ queryKey: ['rules'] }); } })}
        onDuplicate={(id) => duplicateRule.mutate(id, { onSuccess: () => { toast.success('Rule duplicated'); void queryClient.invalidateQueries({ queryKey: ['rules'] }); } })}
        onToggle={(rule) => toggleRule.mutate({ id: rule.id, enabled: !rule.enabled }, { onSuccess: () => { toast.success(rule.enabled ? 'Rule disabled' : 'Rule enabled'); void queryClient.invalidateQueries({ queryKey: ['rules'] }); } })}
      />
    </Shell>
  );
}

export function RuleEditorPageContent({ ruleId }: { ruleId?: string }) {
  const { getToken } = useAuth();
  const { auth } = useAuthData();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const ruleQuery = useRule(client, ruleId ?? '');

  return (
    <Shell active="rules" auth={auth}>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground" href="/rules">
        <ArrowLeft className="h-4 w-4" /> Rules
      </Link>
      {ruleId && ruleQuery.isLoading ? <div className="h-80 animate-pulse rounded-md bg-surface" /> : null}
      {ruleId && ruleQuery.error ? <section className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">Unable to load rule.</section> : null}
      {!ruleId || ruleQuery.data ? <RuleForm initialRule={ruleQuery.data} /> : null}
    </Shell>
  );
}

function TreeViewer({ node }: { node: RuleGroupNode | RuleConditionNode }) {
  if (node.type === 'condition') {
    return (
      <div className="rounded-md border border-border bg-background p-2 font-mono text-xs text-muted-foreground">
        {node.field} {node.operator} {valueToInput(node.value)}
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-md border border-border bg-surface-alt p-3">
      <p className="font-mono text-xs text-foreground">{node.operator}</p>
      {node.children.map((child, index) => <TreeViewer key={child.id ?? index} node={child} />)}
    </div>
  );
}

function HistoryTable({ data }: { data?: PaginatedResponse<RuleExecution> }) {
  const rows = data?.items ?? [];
  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-base font-semibold">Execution History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface-alt text-xs uppercase text-muted-foreground">
            <tr className="h-9 border-b border-border">
              <th className="px-3">Transaction</th>
              <th className="px-3">Execution Time</th>
              <th className="px-3">Risk</th>
              <th className="px-3">Score</th>
              <th className="px-3">Matched</th>
              <th className="px-3">Explanation</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((execution) =>
              (execution.results ?? []).filter((result) => result.matched).map((result) => (
                <tr key={`${execution.id}-${result.ruleId}`} className="h-10 border-b border-border/70">
                  <td className="px-3 font-mono text-xs text-muted-foreground">{execution.transaction?.transactionId ?? execution.transactionId ?? '-'}</td>
                  <td className="px-3 font-mono text-xs text-muted-foreground">{formatDate(execution.createdAt)}</td>
                  <td className="px-3"><RiskBadge level={execution.riskLevel} /></td>
                  <td className="px-3 font-mono text-xs">{result.score}</td>
                  <td className="px-3 font-mono text-xs">{result.matched ? 'YES' : 'NO'}</td>
                  <td className="px-3 text-sm text-muted-foreground">{result.explanation}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RuleDetailPageContent({ ruleId }: { ruleId: string }) {
  const { getToken } = useAuth();
  const { auth, hasPermission } = useAuthData();
  const router = useRouter();
  const queryClient = useQueryClient();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const ruleQuery = useRule(client, ruleId);
  const historyQuery = useRuleHistory(client, { page: 1, limit: 20, ruleId });
  const deleteRule = useDeleteRule(client);
  const duplicateRule = useDuplicateRule(client);
  const canUpdate = hasPermission(PERMISSIONS.RULES_UPDATE);
  const [editing, setEditing] = React.useState(false);

  return (
    <Shell active="rules" auth={auth}>
      <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:text-foreground" href="/rules">
        <ArrowLeft className="h-4 w-4" /> Rules
      </Link>
      {ruleQuery.isLoading ? <div className="h-64 animate-pulse rounded-md bg-surface" /> : null}
      {editing && ruleQuery.data ? <RuleForm initialRule={ruleQuery.data} /> : null}
      {ruleQuery.data ? (
        <div className={cn('space-y-4', editing && 'hidden')}>
          <section className="rounded-md border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase text-muted-foreground">{ruleQuery.data.category}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">{ruleQuery.data.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ruleQuery.data.description ?? '-'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SeverityBadge severity={ruleQuery.data.severity} />
                <button className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs text-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => setEditing(true)} type="button">Edit</button>
                <button className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs text-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => duplicateRule.mutate(ruleId, { onSuccess: () => { toast.success('Rule duplicated'); void queryClient.invalidateQueries({ queryKey: ['rules'] }); } })} type="button">Duplicate</button>
                <button className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs text-foreground disabled:opacity-50" disabled={!canUpdate} onClick={() => deleteRule.mutate(ruleId, { onSuccess: () => { toast.success('Rule deleted'); router.push('/rules'); } })} type="button">Delete</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-md border border-border bg-surface-alt p-3"><p className="text-[11px] uppercase text-muted-foreground">Priority</p><p className="mt-1 font-mono text-sm">{ruleQuery.data.priority}</p></div>
              <div className="rounded-md border border-border bg-surface-alt p-3"><p className="text-[11px] uppercase text-muted-foreground">Weight</p><p className="mt-1 font-mono text-sm">{ruleQuery.data.weight}</p></div>
              <div className="rounded-md border border-border bg-surface-alt p-3"><p className="text-[11px] uppercase text-muted-foreground">Enabled</p><p className="mt-1 font-mono text-sm">{ruleQuery.data.enabled ? 'YES' : 'NO'}</p></div>
              <div className="rounded-md border border-border bg-surface-alt p-3"><p className="text-[11px] uppercase text-muted-foreground">Updated</p><p className="mt-1 font-mono text-xs">{formatDate(ruleQuery.data.updatedAt)}</p></div>
            </div>
          </section>
          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 font-display text-base font-semibold">Conditions</h2>
            <TreeViewer node={ruleQuery.data.conditionTree} />
          </section>
          <HistoryTable data={historyQuery.data} />
        </div>
      ) : null}
    </Shell>
  );
}

export function RulePlaygroundPageContent() {
  const { getToken } = useAuth();
  const { auth } = useAuthData();
  const client = React.useMemo(() => createApiClient(() => getToken()), [getToken]);
  const testRules = useTestRules(client);
  const [json, setJson] = React.useState(JSON.stringify({
    transactionId: 'demo-001',
    timestamp: new Date().toISOString(),
    amount: 65000,
    currency: 'USD',
    merchant: 'Crypto Exchange',
    country: 'RU',
    paymentMethod: 'Wire',
    referenceNumber: '',
  }, null, 2));
  const [result, setResult] = React.useState<RuleEvaluationResponse | null>(null);

  const run = () => {
    try {
      const transaction = JSON.parse(json) as Record<string, unknown>;
      testRules.mutate({ transaction }, {
        onSuccess: (data) => setResult(data),
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Rule test failed'),
      });
    } catch {
      toast.error('Transaction JSON is invalid');
    }
  };

  return (
    <Shell active="playground" auth={auth}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <section className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-base font-semibold">Transaction JSON</h2>
            <button className="inline-flex h-8 items-center gap-2 rounded-md bg-primary-strong px-3 text-xs font-medium text-primary-foreground" onClick={run} type="button">
              <FlaskConical className="h-3.5 w-3.5" /> Run Rules
            </button>
          </div>
          <textarea className="min-h-[520px] w-full resize-y bg-background p-4 font-mono text-xs leading-relaxed text-foreground outline-none" onChange={(event) => setJson(event.target.value)} value={json} />
        </section>
        <section className="rounded-md border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-display text-base font-semibold">Result</h2>
          </div>
          {result ? (
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level={result.riskLevel} />
                <span className="font-mono text-sm">{result.finalScore}/100</span>
                <span className="text-sm text-muted-foreground">{result.triggeredRules.length} triggered</span>
              </div>
              <div className="space-y-2">
                {result.triggeredRules.map((rule) => (
                  <div key={rule.ruleId} className={cn('rounded-md border p-3', severityClass(rule.severity))}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{rule.ruleName}</p>
                      <span className="font-mono text-xs">+{rule.score}</span>
                    </div>
                    <p className="mt-1 text-sm">{rule.explanation}</p>
                  </div>
                ))}
              </div>
              <pre className="max-h-80 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Run a transaction to see triggered rules, score, and explanations.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
