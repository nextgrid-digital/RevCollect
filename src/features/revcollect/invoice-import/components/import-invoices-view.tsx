'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { WorkspaceCanvas } from '@/components/layout/workspace-canvas';
import { WorkspaceCard } from '@/components/layout/workspace-card';
import { WorkspacePageTitle } from '@/components/layout/workspace-page-title';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { revcollectKeys, useIntegrationStatus } from '@/features/revcollect/api/queries';
import type {
  InvoiceImportCreateResult,
  InvoiceImportDraft
} from '@/features/revcollect/invoice-import/types';

export function ImportInvoicesView() {
  const queryClient = useQueryClient();
  const { data: integrationStatus, isPending: statusPending } = useIntegrationStatus();
  const [files, setFiles] = useState<File[]>([]);
  const [drafts, setDrafts] = useState<InvoiceImportDraft[]>([]);
  const [results, setResults] = useState<InvoiceImportCreateResult[]>([]);
  const [isExtracting, startExtract] = useTransition();
  const [isCreating, startCreate] = useTransition();

  const xeroConnected = integrationStatus?.xero.connected ?? false;

  function updateDraft(id: string, patch: Partial<InvoiceImportDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft))
    );
  }

  function handleExtract() {
    if (files.length === 0) {
      toast.error('Choose at least one PDF');
      return;
    }

    startExtract(async () => {
      try {
        const form = new FormData();
        for (const file of files) {
          form.append('files', file);
        }
        const response = await fetch('/api/integrations/xero/import/extract', {
          method: 'POST',
          body: form
        });
        const payload = (await response.json()) as {
          drafts?: InvoiceImportDraft[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Extraction failed');
        }
        setDrafts(payload.drafts ?? []);
        setResults([]);
        toast.success(
          `Extracted ${payload.drafts?.length ?? 0} invoice${(payload.drafts?.length ?? 0) === 1 ? '' : 's'}`
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Extraction failed');
      }
    });
  }

  function handleCreate() {
    const selected = drafts.filter((draft) => draft.selected);
    if (selected.length === 0) {
      toast.error('Select at least one invoice');
      return;
    }

    startCreate(async () => {
      try {
        const response = await fetch('/api/integrations/xero/import/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drafts: selected })
        });
        const payload = (await response.json()) as {
          results?: InvoiceImportCreateResult[];
          createdCount?: number;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? 'Create failed');
        }
        setResults(payload.results ?? []);
        void queryClient.invalidateQueries({ queryKey: revcollectKeys.customers() });
        void queryClient.invalidateQueries({ queryKey: revcollectKeys.invoices() });
        void queryClient.invalidateQueries({ queryKey: revcollectKeys.agingBuckets() });
        toast.success(`Created ${payload.createdCount ?? 0} invoice(s) in Xero`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Create failed');
      }
    });
  }

  return (
    <WorkspaceCanvas className='flex-col'>
      <WorkspacePageTitle
        className='h-8 shrink-0'
        breadcrumbs={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Import invoices' }]}
      />
      <div className='scroll-stable min-h-0 flex-1 overflow-y-auto'>
        <WorkspaceCard className='mx-auto w-full max-w-5xl space-y-6 p-4 md:p-5'>
          <div className='space-y-1'>
            <h2 className='text-lg font-semibold'>Import PDF invoices into Xero</h2>
            <p className='text-muted-foreground text-sm'>
              Upload invoice PDFs, review the extracted fields, then create AUTHORISED sales
              invoices in your connected Xero organisation.
            </p>
          </div>

          {statusPending ? (
            <p className='text-muted-foreground text-sm'>Checking Xero connection…</p>
          ) : !xeroConnected ? (
            <div className='border-border bg-muted/40 space-y-3 rounded-lg border p-4'>
              <p className='text-sm font-medium'>Connect Xero first</p>
              <Button asChild size='sm'>
                <Link href='/onboarding/connect-xero'>Connect Xero</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                <Label htmlFor='invoice-pdfs'>PDF files</Label>
                <Input
                  id='invoice-pdfs'
                  type='file'
                  accept='application/pdf,.pdf'
                  multiple
                  onChange={(event) => {
                    setFiles(Array.from(event.target.files ?? []));
                    setDrafts([]);
                    setResults([]);
                  }}
                />
                {files.length > 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    {files.length} file{files.length === 1 ? '' : 's'} selected
                  </p>
                ) : null}
                <Button
                  type='button'
                  onClick={handleExtract}
                  isLoading={isExtracting}
                  disabled={files.length === 0}
                >
                  <Icons.upload className='size-4' />
                  Extract fields
                </Button>
              </div>

              {drafts.length > 0 ? (
                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <p className='text-sm font-medium'>Review before creating</p>
                    <Button
                      type='button'
                      onClick={handleCreate}
                      isLoading={isCreating}
                      disabled={!drafts.some((draft) => draft.selected)}
                    >
                      Create selected in Xero
                    </Button>
                  </div>

                  <div className='space-y-4'>
                    {drafts.map((draft) => (
                      <div key={draft.id} className='border-border space-y-3 rounded-lg border p-4'>
                        <div className='flex items-start gap-3'>
                          <Checkbox
                            checked={draft.selected}
                            onCheckedChange={(checked) =>
                              updateDraft(draft.id, { selected: checked === true })
                            }
                            aria-label={`Select ${draft.sourceFileName}`}
                          />
                          <div className='min-w-0 flex-1 space-y-3'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <Icons.fileTypePdf className='size-4 shrink-0' />
                              <p className='truncate text-sm font-medium'>{draft.sourceFileName}</p>
                              <span className='text-muted-foreground text-xs'>
                                confidence {Math.round(draft.confidence * 100)}%
                              </span>
                            </div>
                            {draft.notes ? (
                              <p className='text-muted-foreground text-xs'>{draft.notes}</p>
                            ) : null}
                            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                              <Field
                                label='Customer'
                                value={draft.customerName}
                                onChange={(value) => updateDraft(draft.id, { customerName: value })}
                              />
                              <Field
                                label='Email'
                                value={draft.customerEmail}
                                onChange={(value) =>
                                  updateDraft(draft.id, { customerEmail: value })
                                }
                              />
                              <Field
                                label='Invoice #'
                                value={draft.invoiceNumber}
                                onChange={(value) =>
                                  updateDraft(draft.id, { invoiceNumber: value })
                                }
                              />
                              <Field
                                label='Issue date'
                                type='date'
                                value={draft.issueDate}
                                onChange={(value) => updateDraft(draft.id, { issueDate: value })}
                              />
                              <Field
                                label='Due date'
                                type='date'
                                value={draft.dueDate}
                                onChange={(value) => updateDraft(draft.id, { dueDate: value })}
                              />
                              <Field
                                label='Amount'
                                type='number'
                                value={String(draft.amount)}
                                onChange={(value) =>
                                  updateDraft(draft.id, {
                                    amount: Number(value) || 0
                                  })
                                }
                              />
                              <div className='sm:col-span-2 lg:col-span-3'>
                                <Field
                                  label='Description'
                                  value={draft.description}
                                  onChange={(value) =>
                                    updateDraft(draft.id, { description: value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.length > 0 ? (
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>Results</p>
                  <ul className='space-y-1 text-sm'>
                    {results.map((result) => (
                      <li key={result.id}>
                        {result.ok ? (
                          <span className='text-emerald-600 dark:text-emerald-400'>
                            {result.sourceFileName}: created{' '}
                            {result.xeroInvoiceNumber ?? result.xeroInvoiceId}
                          </span>
                        ) : (
                          <span className='text-destructive'>
                            {result.sourceFileName}: {result.error}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant='outline' size='sm'>
                    <Link href='/customers'>View customers</Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </WorkspaceCard>
      </div>
    </WorkspaceCanvas>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = label.toLowerCase().replaceAll(/\s+/g, '-');
  return (
    <div className='space-y-1'>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
