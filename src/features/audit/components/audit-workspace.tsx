'use client';

import { useRef, useState, useTransition } from 'react';
import { AuditDashboard } from '@/features/audit/components/audit-dashboard';
import { AuditIngestBar, type AuditDataSource } from '@/features/audit/components/audit-ingest-bar';
import { computeAuditReport, parseInvoicesCsv, type AuditReport } from '@/features/audit/lib';
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

export function AuditWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY);
  const [analysisDate, setAnalysisDate] = useState(SAMPLE_ANALYSIS_DATE);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<AuditDataSource>('none');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isPending, startTransition] = useTransition();

  function computeFromCsv(
    text: string,
    label: string,
    company: string,
    asOf: string,
    source: 'sample' | 'upload'
  ) {
    const invoices = parseInvoicesCsv(text);
    const next = computeAuditReport({
      invoices,
      companyName: company.trim() || 'Your company',
      analysisDate: parseAnalysisDate(asOf)
    });
    setCsvText(text);
    setFileName(label);
    setDataSource(source);
    setReport(next);
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
        computeFromCsv(
          text,
          'historical_invoices_250.csv (sample)',
          DEFAULT_COMPANY,
          SAMPLE_ANALYSIS_DATE,
          'sample'
        );
        toast.success('Sample dataset loaded');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load sample';
        setError(message);
        toast.error(message);
      }
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setError(null);
      startTransition(() => {
        try {
          computeFromCsv(text, file.name, companyName, analysisDate, 'upload');
          toast.success('Audit computed');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not compute audit';
          setReport(null);
          setDataSource('none');
          setError(message);
          toast.error(message);
        }
      });
    };
    reader.onerror = () => {
      setError('Could not read file');
      toast.error('Could not read file');
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function handleRecompute() {
    if (!csvText || dataSource === 'none') {
      toast.message('Upload a CSV or run the sample first');
      return;
    }
    setError(null);
    startTransition(() => {
      try {
        computeFromCsv(csvText, fileName ?? 'invoices.csv', companyName, analysisDate, dataSource);
        toast.success('Audit recomputed');
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
        isPending={isPending}
        isDownloading={false}
        fileInputRef={fileInputRef}
        onCompanyNameChange={setCompanyName}
        onAnalysisDateChange={(value) => setAnalysisDate(value || todayInputValue())}
        onUploadClick={() => fileInputRef.current?.click()}
        onFileChange={handleFileChange}
        onLoadSample={handleLoadSample}
        onRecompute={handleRecompute}
        onDownloadPdf={handleDownloadPdf}
      />
      <AuditDashboard
        report={report}
        dataSource={dataSource}
        isPending={isPending}
        onLoadSample={handleLoadSample}
        onUploadClick={() => fileInputRef.current?.click()}
      />
    </div>
  );
}
