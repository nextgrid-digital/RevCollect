'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type AuditDataSource = 'none' | 'sample' | 'upload';

interface AuditIngestBarProps {
  companyName: string;
  analysisDate: string;
  fileName: string | null;
  dataSource: AuditDataSource;
  error: string | null;
  hasReport: boolean;
  hasCsv: boolean;
  isPending: boolean;
  isSummarizing: boolean;
  isDownloading: boolean;
  onCompanyNameChange: (value: string) => void;
  onAnalysisDateChange: (value: string) => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
  onRecompute: () => void;
  onDownloadPdf: () => void;
}

export function AuditIngestBar({
  companyName,
  analysisDate,
  fileName,
  dataSource,
  error,
  hasReport,
  hasCsv,
  isPending,
  isSummarizing,
  isDownloading,
  onCompanyNameChange,
  onAnalysisDateChange,
  onUploadClick,
  onLoadSample,
  onRecompute,
  onDownloadPdf
}: AuditIngestBarProps) {
  return (
    <section className='audit-ingest sticky top-0 z-20 print:hidden'>
      <div className='mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 py-4 sm:px-8'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='flex flex-col gap-2'>
            <p className='font-audit-sans text-audit-ink text-[11px] font-semibold tracking-[0.08em] uppercase'>
              AR Audit
            </p>
            <div className='flex flex-wrap items-center gap-2'>
              {dataSource === 'sample' ? (
                <span className='audit-pill text-[12px]'>Demo dataset — fictional invoices</span>
              ) : null}
              {dataSource === 'upload' ? (
                <span className='audit-pill text-[12px]'>
                  Live export — formulas run on your file
                </span>
              ) : null}
              {isSummarizing ? (
                <span className='audit-pill text-[12px]'>Writing narrative with Gemini…</span>
              ) : null}
              {fileName ? (
                <span className='font-audit-sans text-audit-muted text-[12px]'>{fileName}</span>
              ) : null}
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              className={cn('audit-btn-outline shadow-none')}
              onClick={onRecompute}
              disabled={isPending || !hasCsv}
            >
              Recompute
            </Button>
            <Button
              type='button'
              size='sm'
              className={cn('audit-btn-forest shadow-none')}
              onClick={onDownloadPdf}
              isLoading={isDownloading}
              disabled={!hasReport}
            >
              Download PDF
            </Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='flex flex-col gap-1.5'>
            <Label
              htmlFor='company'
              className='font-audit-sans text-audit-muted text-[12px] font-medium'
            >
              Prepared for
            </Label>
            <Input
              id='company'
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
              placeholder='Customer legal name'
              className='rounded-[14px] border-[var(--audit-rule)] bg-[var(--audit-surface)] shadow-none'
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label
              htmlFor='asof'
              className='font-audit-sans text-audit-muted text-[12px] font-medium'
            >
              Analysis date
            </Label>
            <Input
              id='asof'
              type='date'
              value={analysisDate}
              onChange={(e) => onAnalysisDateChange(e.target.value)}
              className='rounded-[14px] border-[var(--audit-rule)] bg-[var(--audit-surface)] shadow-none'
            />
          </div>
          <div className='flex flex-col gap-1.5 sm:col-span-2'>
            <Label className='font-audit-sans text-audit-muted text-[12px] font-medium'>
              Invoice export
            </Label>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                className='audit-btn-outline shadow-none'
                onClick={onUploadClick}
                disabled={isPending}
              >
                <Icons.upload className='size-4' />
                Upload
              </Button>
              <Button
                type='button'
                size='sm'
                className='audit-btn-ivory shadow-none'
                onClick={onLoadSample}
                isLoading={isPending}
              >
                Run sample
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <p className='font-audit-sans text-[14px] text-[var(--audit-forest-shadow)]'>{error}</p>
        ) : null}
      </div>
    </section>
  );
}
