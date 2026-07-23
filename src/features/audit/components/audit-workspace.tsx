'use client';

import { useRef, useState, useTransition } from 'react';
import { AuditCsvUploadDialog } from '@/features/audit/components/audit-csv-upload-dialog';
import { AuditDashboard } from '@/features/audit/components/audit-dashboard';
import { AuditIngestBar, type AuditDataSource } from '@/features/audit/components/audit-ingest-bar';
import {
  buildAuditFacts,
  buildFallbackNarrative,
  type AuditNarrative
} from '@/features/audit/lib/audit-narrative';
import {
  computeAuditReport,
  parseInvoicesCsv,
  parseInvoicesFromFile,
  type AuditReport,
  type InvoiceRecord
} from '@/features/audit/lib';
import { toast } from 'sonner';

const SAMPLE_CSV_URL = '/fixtures/audit/historical_invoices_250.csv';
const DEFAULT_COMPANY = 'Summit Field Services LLC';
const SAMPLE_ANALYSIS_DATE = '2026-07-22';

function todayInputValue(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseAnalysisDate(value: string): Date {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid analysis date');
  }
  return d;
}

async function fetchNarrative(report: AuditReport): Promise<AuditNarrative> {
  const fallback = buildFallbackNarrative(report);
  try {
    const res = await fetch('/api/audit/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts: buildAuditFacts(report) })
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || `Summarize failed (${res.status})`);
    }
    const payload = (await res.json()) as { narrative: AuditNarrative };
    return payload.narrative;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Summarize failed';
    toast.message('Using template narrative', { description: message });
    return fallback;
  }
}

export function AuditWorkspace() {
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY);
  const [analysisDate, setAnalysisDate] = useState(SAMPLE_ANALYSIS_DATE);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<AuditDataSource>('none');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [narrative, setNarrative] = useState<AuditNarrative | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const summarizeSeq = useRef(0);

  function applyReport(
    invoices: InvoiceRecord[],
    text: string,
    label: string,
    company: string,
    asOf: string,
    source: 'sample' | 'upload'
  ): AuditReport {
    const next = computeAuditReport({
      invoices,
      companyName: company.trim() || 'Your company',
      analysisDate: parseAnalysisDate(asOf)
    });
    setCsvText(text);
    setFileName(label);
    setDataSource(source);
    setReport(next);
    setNarrative(buildFallbackNarrative(next));
    return next;
  }

  function computeFromCsv(
    text: string,
    label: string,
    company: string,
    asOf: string,
    source: 'sample' | 'upload'
  ): AuditReport {
    return applyReport(parseInvoicesCsv(text), text, label, company, asOf, source);
  }

  async function summarizeReport(next: AuditReport) {
    const seq = ++summarizeSeq.current;
    setIsSummarizing(true);
    try {
      const copy = await fetchNarrative(next);
      if (seq !== summarizeSeq.current) return;
      setNarrative(copy);
    } finally {
      if (seq === summarizeSeq.current) {
        setIsSummarizing(false);
      }
    }
  }

  function handleLoadSample() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(SAMPLE_CSV_URL);
        if (!res.ok) throw new Error('Could not load sample dataset');
        const text = await res.text();
        setAnalysisDate(SAMPLE_ANALYSIS_DATE);
        setCompanyName(DEFAULT_COMPANY);
        const next = computeFromCsv(
          text,
          'historical_invoices_250.csv (sample)',
          DEFAULT_COMPANY,
          SAMPLE_ANALYSIS_DATE,
          'sample'
        );
        toast.success('Sample dataset loaded');
        await summarizeReport(next);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load sample';
        setError(message);
        toast.error(message);
      }
    });
  }

  function handleUploadFile(file: File) {
    setError(null);
    startTransition(async () => {
      try {
        const parsed = await parseInvoicesFromFile(file);
        const label = parsed.sheetName != null ? `${file.name} · ${parsed.sheetName}` : file.name;
        const next = applyReport(
          parsed.invoices,
          parsed.csvText,
          label,
          companyName,
          analysisDate,
          'upload'
        );
        toast.success('Audit computed');
        await summarizeReport(next);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not compute audit';
        setReport(null);
        setNarrative(null);
        setDataSource('none');
        setError(message);
        toast.error(message);
      }
    });
  }

  function handleRecompute() {
    if (!csvText || dataSource === 'none') {
      toast.message('Upload an export or run the sample first');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const next = computeFromCsv(
          csvText,
          fileName ?? 'invoices.csv',
          companyName,
          analysisDate,
          dataSource
        );
        toast.success('Audit recomputed');
        await summarizeReport(next);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not recompute';
        setError(message);
        toast.error(message);
      }
    });
  }

  function handleDownloadPdf() {
    if (!report) return;
    window.print();
  }

  const busy = isPending || isSummarizing;

  return (
    <div className='flex min-h-svh flex-col'>
      <AuditIngestBar
        companyName={companyName}
        analysisDate={analysisDate}
        fileName={fileName}
        dataSource={dataSource}
        error={error}
        hasReport={report !== null}
        hasCsv={csvText !== null}
        isPending={busy}
        isSummarizing={isSummarizing}
        isDownloading={false}
        onCompanyNameChange={setCompanyName}
        onAnalysisDateChange={(value) => setAnalysisDate(value || todayInputValue())}
        onUploadClick={() => setUploadOpen(true)}
        onLoadSample={handleLoadSample}
        onRecompute={handleRecompute}
        onDownloadPdf={handleDownloadPdf}
      />
      <AuditCsvUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isPending={busy}
        onFileAccepted={handleUploadFile}
      />
      <AuditDashboard
        report={report}
        narrative={narrative}
        dataSource={dataSource}
        isPending={busy}
        isSummarizing={isSummarizing}
        onLoadSample={handleLoadSample}
        onUploadClick={() => setUploadOpen(true)}
      />
    </div>
  );
}
