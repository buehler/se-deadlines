'use client';

import { format as formatDate } from '@formkit/tempo';
import { CheckIcon, CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { FIELD_OPTIONS, FORMAT_OPTIONS, OPERATOR_LABELS, type OutputFormat } from '@/components/home/query-builder/config';
import type {
  BuilderFieldKey,
  BuilderOperator,
  ConditionNode,
  GroupNode,
  PreviewConference,
  PreviewState,
} from '@/components/home/query-builder/types';
import {
  appendNode,
  buildDefaultDeadlineQuery,
  buildFetchUri,
  buildReadableAbsoluteUri,
  changeGroupCombinator,
  createConditionNode,
  createGroupNode,
  getTodayDateString,
  getAllowedOperators,
  getEmptyRootGroup,
  getPlaceholder,
  hydrateRootGroupFromQuery,
  isDateField,
  removeNode,
  resetOperatorForField,
  serializeExecutionQuery,
  serializePageQuery,
  updateNode,
} from '@/components/home/query-builder/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Conference } from '@/lib/data';
import { cn } from '@/lib/utils';

const INITIAL_PREVIEW_STATE: PreviewState = {
  status: 'idle',
  data: [],
  error: null,
};

function QueryBuilderSelectTrigger({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <SelectTrigger
      id={id}
      className="field-input h-auto min-h-12.5 w-full border-transparent bg-surface-container-high px-4 py-3 text-sm"
    >
      {children}
    </SelectTrigger>
  );
}

function GroupEditor({
  group,
  isRoot = false,
  onAddCondition,
  onAddGroup,
  onRemoveNode,
  onChangeCombinator,
  onChangeField,
  onChangeOperator,
  onChangeValue,
}: {
  group: GroupNode;
  isRoot?: boolean;
  onAddCondition: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onChangeCombinator: (groupId: string, combinator: GroupNode['combinator']) => void;
  onChangeField: (conditionId: string, field: BuilderFieldKey) => void;
  onChangeOperator: (conditionId: string, operator: BuilderOperator) => void;
  onChangeValue: (conditionId: string, value: string) => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[1.4rem] border border-outline-variant/15 bg-surface-container-lowest p-4 sm:p-5',
        !isRoot && 'bg-surface-container-low/35'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
            {isRoot ? 'Root group' : 'Nested group'}
          </p>
          <Select
            value={group.combinator}
            onValueChange={(value: GroupNode['combinator']) => onChangeCombinator(group.id, value)}
          >
            <SelectTrigger className="h-10 min-w-28 rounded-full border-outline-variant/20 bg-surface-container-high px-4 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddCondition(group.id)}
            className="rounded-full border-dashed border-outline-variant bg-transparent text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant hover:border-primary hover:bg-transparent hover:text-primary"
          >
            <PlusIcon data-icon="inline-start" />
            Condition
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddGroup(group.id)}
            className="rounded-full border-dashed border-outline-variant bg-transparent text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant hover:border-primary hover:bg-transparent hover:text-primary"
          >
            <PlusIcon data-icon="inline-start" />
            Group
          </Button>
          {!isRoot ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemoveNode(group.id)}
              className="rounded-full text-on-surface-variant hover:text-error"
              aria-label="Remove group"
            >
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {group.children.map((child, index) => (
          <div key={child.id} className="flex flex-col gap-4">
            {index > 0 ? (
              <div className="flex items-center gap-3">
                <Separator className="bg-outline-variant/20" />
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-outline">
                  {group.combinator}
                </span>
                <Separator className="bg-outline-variant/20" />
              </div>
            ) : null}

            {child.type === 'condition' ? (
              <ConditionEditor
                condition={child}
                onRemoveNode={onRemoveNode}
                onChangeField={onChangeField}
                onChangeOperator={onChangeOperator}
                onChangeValue={onChangeValue}
              />
            ) : (
              <GroupEditor
                group={child}
                onAddCondition={onAddCondition}
                onAddGroup={onAddGroup}
                onRemoveNode={onRemoveNode}
                onChangeCombinator={onChangeCombinator}
                onChangeField={onChangeField}
                onChangeOperator={onChangeOperator}
                onChangeValue={onChangeValue}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConditionEditor({
  condition,
  onRemoveNode,
  onChangeField,
  onChangeOperator,
  onChangeValue,
}: {
  condition: ConditionNode;
  onRemoveNode: (nodeId: string) => void;
  onChangeField: (conditionId: string, field: BuilderFieldKey) => void;
  onChangeOperator: (conditionId: string, operator: BuilderOperator) => void;
  onChangeValue: (conditionId: string, value: string) => void;
}) {
  const allowedOperators = getAllowedOperators(condition.field);
  const dateField = isDateField(condition.field);

  return (
    <div className="rounded-[1.2rem] bg-surface-container-high/40 p-4">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1.05fr_1.2fr_auto] lg:items-end">
        <Field>
          <FieldLabel className="field-label" htmlFor={`field-${condition.id}`}>
            Property
          </FieldLabel>
          <Select value={condition.field} onValueChange={(value: BuilderFieldKey) => onChangeField(condition.id, value)}>
            <QueryBuilderSelectTrigger id={`field-${condition.id}`}>
              <SelectValue />
            </QueryBuilderSelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FIELD_OPTIONS.map((field) => (
                  <SelectItem key={field.key} value={field.key}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="field-label" htmlFor={`operator-${condition.id}`}>
            Operator
          </FieldLabel>
          <Select
            value={condition.operator}
            onValueChange={(value: BuilderOperator) => onChangeOperator(condition.id, value)}
          >
            <QueryBuilderSelectTrigger id={`operator-${condition.id}`}>
              <SelectValue />
            </QueryBuilderSelectTrigger>
            <SelectContent>
              <SelectGroup>
                {allowedOperators.map((operator) => (
                  <SelectItem key={operator} value={operator}>
                    {OPERATOR_LABELS[operator]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="field-label" htmlFor={`value-${condition.id}`}>
            Value
          </FieldLabel>
          <Input
            id={`value-${condition.id}`}
            type={dateField ? 'date' : 'text'}
            value={condition.value}
            onChange={(event) => onChangeValue(condition.id, event.target.value)}
            placeholder={getPlaceholder(condition.field, condition.operator)}
            autoComplete="off"
            spellCheck={false}
            className="field-input min-h-12.5 border-transparent bg-surface-container-high px-4 py-3 text-sm"
          />
        </Field>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemoveNode(condition.id)}
          className="rounded-full text-on-surface-variant hover:text-error"
          aria-label="Remove condition"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function ConferenceCard({ conference }: { conference: Conference }) {
  return (
    <article className="surface-panel ghost-outline rounded-[1.6rem] bg-surface-container-lowest p-6 transition hover:bg-surface-container-low">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="min-w-28 border-outline-variant/20 md:border-r md:pr-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-outline">Deadline</p>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-on-surface">
            {formatDate(conference.deadline, 'MMM', 'en-US').toUpperCase()}
          </div>
          <div className="text-2xl font-light text-on-surface-variant">{formatDate(conference.deadline, 'DD', 'en-US')}</div>
          <div className="mt-3 text-xs text-outline">{formatDate(conference.deadline, 'YYYY', 'en-US')}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-on-surface">{conference.name}</h3>
            <Badge
              variant="outline"
              className="rounded-full border-transparent bg-primary/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary"
            >
              {conference.year}
            </Badge>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">{conference.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {conference.tags.map((tag) => (
              <Badge
                key={`${conference.name}-${tag.tag}`}
                variant="outline"
                className="rounded-full border-transparent bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface-variant"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="min-w-44 border-outline-variant/20 text-left md:border-l md:pl-6 md:text-right">
          <p className="text-sm font-medium text-on-surface-variant">{conference.place ?? 'Location TBD'}</p>
          {conference.date ? <p className="mt-2 text-xs text-outline">{conference.date}</p> : null}
          {conference.note ? <p className="mt-2 text-xs text-outline">{conference.note}</p> : null}
          <a
            href={conference.link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-primary hover:text-primary/80"
          >
            Open venue
          </a>
        </div>
      </div>
    </article>
  );
}

function ResultsSection({ previewState }: { previewState: PreviewState }) {
  return (
    <section className="mt-8 rounded-[2rem] bg-surface-container-low/50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Results</p>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">Matching conferences from the live JSON endpoint.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
          {previewState.status === 'success' ? `${previewState.data.length} found` : previewState.status}
        </span>
      </div>

      {previewState.status === 'error' ? (
        <div className="mt-5 rounded-[1.2rem] bg-error-container px-4 py-3 text-sm text-on-error-container">
          {previewState.error}
        </div>
      ) : null}

      {previewState.status === 'loading' ? (
        <div className="mt-5 rounded-[1.2rem] bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
          Loading results...
        </div>
      ) : null}

      {previewState.status === 'success' && previewState.data.length === 0 ? (
        <div className="mt-5 rounded-[1.2rem] bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
          No conferences matched the current query.
        </div>
      ) : null}

      {previewState.status === 'success' && previewState.data.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {previewState.data.map((conference, i) => (
            <ConferenceCard
              key={`${i}-${conference.name}-${conference.year}-${conference.deadline}`}
              conference={{
                ...conference,
                deadline: new Date(conference.deadline),
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function QueryBuilder() {
  const [rootGroup, setRootGroup] = useState<GroupNode>(() => getEmptyRootGroup());
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('json');
  const [previewState, setPreviewState] = useState<PreviewState>(INITIAL_PREVIEW_STATE);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [isUrlReady, setIsUrlReady] = useState(false);
  const [today, setToday] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    setToday(getTodayDateString());
    const currentQuery = new URLSearchParams(window.location.search).get('q');
    setRootGroup(hydrateRootGroupFromQuery(currentQuery));
    setIsUrlReady(true);
  }, []);

  const pageQuery = useMemo(() => serializePageQuery(rootGroup, true), [rootGroup]);
  const executionQuery = useMemo(() => serializeExecutionQuery(rootGroup, true), [rootGroup]);
  const effectiveExecutionQuery = useMemo(
    () => executionQuery ?? buildDefaultDeadlineQuery(today),
    [executionQuery, today]
  );
  const deferredExecutionQuery = useDeferredValue(effectiveExecutionQuery);
  const displayUri = useMemo(
    () => buildReadableAbsoluteUri(origin, selectedFormat, effectiveExecutionQuery),
    [origin, selectedFormat, effectiveExecutionQuery]
  );
  const fetchUri = useMemo(() => buildFetchUri('json', deferredExecutionQuery), [deferredExecutionQuery]);

  useEffect(() => {
    if (!isUrlReady) {
      return;
    }

    const pathname = window.location.pathname;
    const nextUrl = pageQuery ? `${pathname}?q=${pageQuery}` : pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [isUrlReady, pageQuery]);

  useEffect(() => {
    if (!isUrlReady) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPreviewState((current) => ({
        ...current,
        status: 'loading',
        error: null,
      }));

      try {
        const response = await fetch(fetchUri, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Preview request failed with ${response.status}`);
        }

        const json = (await response.json()) as PreviewConference[];

        startTransition(() => {
          setPreviewState({
            status: 'success',
            data: json,
            error: null,
          });
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPreviewState({
          status: 'error',
          data: [],
          error: error instanceof Error ? error.message : 'Unknown preview error',
        });
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [fetchUri, isUrlReady]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyUri = async () => {
    await navigator.clipboard.writeText(displayUri);
    setCopied(true);
  };

  const handleOpenUri = () => {
    window.open(displayUri, '_blank', 'noopener,noreferrer');
  };

  const handleClearAll = () => {
    setRootGroup(getEmptyRootGroup());
  };

  const handleAddCondition = (groupId: string) => {
    setRootGroup((current) => appendNode(current, groupId, createConditionNode()));
  };

  const handleAddGroup = (groupId: string) => {
    setRootGroup((current) => appendNode(current, groupId, createGroupNode()));
  };

  const handleRemoveNode = (nodeId: string) => {
    setRootGroup((current) => removeNode(current, nodeId));
  };

  const handleChangeCombinator = (groupId: string, combinator: GroupNode['combinator']) => {
    setRootGroup((current) => changeGroupCombinator(current, groupId, combinator));
  };

  const handleChangeField = (conditionId: string, field: BuilderFieldKey) => {
    setRootGroup((current) =>
      updateNode(current, conditionId, (node) => (node.type === 'condition' ? resetOperatorForField(node, field) : node))
    );
  };

  const handleChangeOperator = (conditionId: string, operator: BuilderOperator) => {
    setRootGroup((current) =>
      updateNode(current, conditionId, (node) => (node.type === 'condition' ? { ...node, operator, value: '' } : node))
    );
  };

  const handleChangeValue = (conditionId: string, value: string) => {
    setRootGroup((current) =>
      updateNode(current, conditionId, (node) => (node.type === 'condition' ? { ...node, value } : node))
    );
  };

  return (
    <>
      <div className="mt-10 rounded-[2rem] bg-surface-container-low/90 p-4 sm:p-6">
        <div className="rounded-[1.6rem] bg-surface-container-lowest px-5 py-6 shadow-[0_12px_32px_-4px_rgba(6,97,156,0.06)] sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-outline">Query Builder</p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearAll}
              className="rounded-full bg-surface-container-high px-4 text-primary shadow-none hover:bg-surface-container"
            >
              Clear all
            </Button>
          </div>

          <div className="mt-6">
            <GroupEditor
              group={rootGroup}
              isRoot
              onAddCondition={handleAddCondition}
              onAddGroup={handleAddGroup}
              onRemoveNode={handleRemoveNode}
              onChangeCombinator={handleChangeCombinator}
              onChangeField={handleChangeField}
              onChangeOperator={handleChangeOperator}
              onChangeValue={handleChangeValue}
            />
          </div>

          <div className="mt-8 rounded-[1.4rem] bg-secondary/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Request URI</p>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Format affects the generated URI. Results are always fetched from the JSON endpoint.
                </p>
              </div>
              <Field className="min-w-40">
                <FieldLabel className="field-label" htmlFor="output-format">
                  Format
                </FieldLabel>
                <Select value={selectedFormat} onValueChange={(value: OutputFormat) => setSelectedFormat(value)}>
                  <QueryBuilderSelectTrigger id="output-format">
                    <SelectValue />
                  </QueryBuilderSelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FORMAT_OPTIONS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <pre className="mt-5 overflow-x-auto rounded-[1.2rem] bg-on-surface p-4 text-xs leading-7 text-primary-fixed">
              <code>{displayUri}</code>
            </pre>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenUri}
                className="rounded-full border-outline-variant/20 bg-surface-container-lowest px-4 text-on-surface shadow-none hover:bg-surface-container-high"
              >
                Open URI
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopyUri}
                className="rounded-full bg-secondary px-4 text-on-secondary shadow-[0_12px_32px_-4px_rgba(6,97,156,0.12)] hover:bg-secondary/90"
              >
                {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
                {copied ? 'Copied' : 'Copy URI'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ResultsSection previewState={previewState} />
    </>
  );
}
