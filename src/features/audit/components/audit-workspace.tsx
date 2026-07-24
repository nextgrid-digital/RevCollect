'use client';

import { useRef, useState } from 'react';
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
import { AUDIT_ERRORS, AUDIT_SHARE_NUDGE, mapAuditError } from '@/features/audit/lib/ui-copy';
import { toast } from 'sonner';

const SAMPLE_CSV_URL = '/fixtures/audit/historical_invoices_250.csv';
const DEFAULT_COMPANY = 'Summit Field Services LLC';
const SAMPLE_ANALYSIS_DATE = '2026-07-22';
const MIN_INVOICES = 30;
/** Keep the processing panel up long enough that the report never "pops in" instantly. */
const MIN_PROCESSING_MS = 2400;

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

function assertEnoughInvoices(count: number) {
  if (count < MIN_INVOICES) {
    throw new Error(AUDIT_ERRORS.tooFewRows);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
  const [runStats, setRunStats] = useState<{
    invoiceCount: number;
    customerCount: number;
  } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const runSeq = useRef(0);
  const runStartedAt = useRef(0);

  function beginRun(): number {
    runSeq.current += 1;
    runStartedAt.current = Date.now();
    setIsRunning(true);
    setIsSummarizing(false);
    setError(null);
    setReport(null);
    setNarrative(null);
    setRunStats(null);
    return runSeq.current;
  }

  function failRun(message: string, clearSource = false) {
    setReport(null);
    setNarrative(null);
    setRunStats(null);
    if (clearSource) {
      setDataSource('none');
    }
    setError(message);
    setIsSummarizing(false);
    setIsRunning(false);
    toast.error(message);
  }

  function applyReport(
    invoices: InvoiceRecord[],
    text: string,
    label: string,
    company: string,
    asOf: string,
    source: 'sample' | 'upload'
  ): AuditReport {
    assertEnoughInvoices(invoices.length);
    const next = computeAuditReport({
      invoices,
      companyName: company.trim() || 'Your company',
      analysisDate: parseAnalysisDate(asOf)
    });
    setCsvText(text);
    setFileName(label);
    setDataSource(source);
    setRunStats({
      invoiceCount: next.headline.invoiceCount,
      customerCount: next.customers.length
    });
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

  async function publishReport(next: AuditReport, seq: number) {
    setIsSummarizing(true);
    const copy = await fetchNarrative(next);
    const waitMs = MIN_PROCESSING_MS - (Date.now() - runStartedAt.current);
    if (waitMs > 0) {
      await sleep(waitMs);
    }
    if (seq !== runSeq.current) return;

    // Publish and leave the busy state in one update so the report never paints while computing.
    setReport(next);
    setNarrative(copy);
    setIsSummarizing(false);
    setIsRunning(false);
    toast.success(auditDoneToast(next));
  }

  function handleLoadSample() {
    const seq = beginRun();
    void (async () => {
      try {
        const res = await fetch(SAMPLE_CSV_URL);
        if (!res.ok) throw new Error('Could not load sample dataset');
        const text = await res.text();
        if (seq !== runSeq.current) return;
        setAnalysisDate(SAMPLE_ANALYSIS_DATE);
        setCompanyName(DEFAULT_COMPANY);
        const next = computeFromCsv(
          text,
          'historical_invoices_250.csv (sample)',
          DEFAULT_COMPANY,
          SAMPLE_ANALYSIS_DATE,
          'sample'
        );
        await publishReport(next, seq);
      } catch (err) {
        if (seq !== runSeq.current) return;
        failRun(mapAuditError(err instanceof Error ? err.message : 'Could not load sample'));
      }
    })();
  }

  function handleUploadFile(file: File) {
    const seq = beginRun();
    void (async () => {
      try {
        const parsed = await parseInvoicesFromFile(file);
        if (seq !== runSeq.current) return;
        const label = parsed.sheetName != null ? `${file.name} · ${parsed.sheetName}` : file.name;
        const next = applyReport(
          parsed.invoices,
          parsed.csvText,
          label,
          companyName,
          analysisDate,
          'upload'
        );
        await publishReport(next, seq);
      } catch (err) {
        if (seq !== runSeq.current) return;
        failRun(
          mapAuditError(err instanceof Error ? err.message : 'Could not compute audit'),
          true
        );
      }
    })();
  }

  function handleRecompute() {
    if (!csvText || dataSource === 'none') {
      toast.message('Upload an export or run the sample first');
      return;
    }
    const seq = beginRun();
    void (async () => {
      try {
        const next = computeFromCsv(
          csvText,
          fileName ?? 'invoices.csv',
          companyName,
          analysisDate,
          dataSource
        );
        if (seq !== runSeq.current) return;
        await publishReport(next, seq);
      } catch (err) {
        if (seq !== runSeq.current) return;
        failRun(mapAuditError(err instanceof Error ? err.message : 'Could not recompute'));
      }
    })();
  }

  function handleDownloadPdf() {
    if (!report || isRunning) return;
    window.print();
    toast.message(AUDIT_SHARE_NUDGE);
  }

  const busy = isRunning;
  // Never hand the report to the dashboard while a run is in progress.
  const visibleReport = busy ? null : report;
  const visibleNarrative = busy ? null : narrative;

  return (
    <div className='flex min-h-svh flex-col'>
      <AuditIngestBar
        companyName={companyName}
        analysisDate={analysisDate}
        fileName={fileName}
        dataSource={dataSource}
        error={error}
        hasReport={visibleReport !== null}
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
        report={visibleReport}
        narrative={visibleNarrative}
        dataSource={dataSource}
        isPending={busy}
        isSummarizing={isSummarizing}
        invoiceCount={runStats?.invoiceCount ?? null}
        customerCount={runStats?.customerCount ?? null}
        onLoadSample={handleLoadSample}
        onUploadClick={() => setUploadOpen(true)}
      />
    </div>
  );
}

function auditDoneToast(report: AuditReport): string {
  return `Done. ${report.headline.invoiceCount} invoices analyzed across ${report.customers.length} customers.`;
}
