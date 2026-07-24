/** Paste-ready copy pack for app.revcollect.ai/audit. No em dashes. */

export const AUDIT_META = {
  title: 'Free AR Audit | See How Your Customers Actually Pay | RevCollect',
  description:
    'Upload your invoice history or connect QuickBooks or Xero. Get a free AR collection audit: who pays late, what it costs you in cash, and the ten moves that release it.'
} as const;

export const AUDIT_HERO = {
  emptyLead:
    'Two ways to start: see the sample in one click, or run it on your own book in about a minute.',
  headline:
    'Your accounting system shows what is outstanding. This shows how you actually get paid.',
  subhead:
    'Upload your invoice history and get the AR Collection Audit in about a minute: which customers pay late, who is getting slower, what the gap costs you in locked cash, and the ten moves that release the most of it. Free, and yours to keep as a PDF.',
  primaryCta: 'Upload my invoice export',
  secondaryCta: 'See a sample audit first',
  underCta: 'No signup to run it. No card, ever, for the audit.'
} as const;

export const AUDIT_UPLOAD = {
  title: 'Upload invoice history',
  zoneLabel: 'Drop your invoice export here, or click to browse',
  zoneActive: 'Drop file to upload',
  formats:
    'CSV or Excel. Most systems export this in one click: QuickBooks (Reports > Invoices), Xero (Business > Invoices > Export), or any statement of invoices.',
  columnsHelper:
    'We need five columns to work with: customer, invoice date, due date, amount, and payment date (blank if unpaid). Extra columns are fine; we ignore them. Column names do not need to match ours.',
  privacy:
    'Your file is processed for this report and nothing else. It is never used to train AI models, and you can delete it with one click when you are done.',
  wrongType:
    'That file type did not work. Export your invoices as CSV or Excel and try again; the helper below the upload zone shows where to find the export in QuickBooks and Xero.'
} as const;

export const AUDIT_FIELDS = {
  preparedFor: 'Prepared for',
  preparedForPlaceholder: 'Your company name',
  preparedForHelper: 'Appears on the cover of your report.',
  analysisDate: 'Analysis date',
  analysisDateHelper: 'Aging is computed as of this date. Defaults to today.',
  invoiceExport: 'Invoice export',
  invoiceExportHelper: 'The file you uploaded. Replace it any time; the report recomputes.'
} as const;

export const AUDIT_CONTROLS = {
  runSample: 'See it on sample data',
  sampleBanner:
    'You are viewing the audit on fictional sample data: 250 invoices, 18 customers, every number computed the same way yours will be. Upload your export to see your own book.',
  recompute: 'Recompute',
  recomputeHelper: 'Re-runs every number against the current file and analysis date.',
  downloadPdf: 'Download the PDF',
  downloadHelper: 'The full eight-page report, yours to keep or forward.',
  upload: 'Upload'
} as const;

export const AUDIT_PROCESSING = [
  'Reading your invoices…',
  'Matching payments to invoices…',
  'Computing how each customer actually pays…',
  'Finding who is speeding up and who is slowing down…',
  'Working out what the gap costs you in cash…',
  'Ranking the ten moves that release the most…',
  'Building your report…'
] as const;

export function auditCompletionLine(invoiceCount: number, customerCount: number): string {
  return `Done. ${invoiceCount} invoices analyzed across ${customerCount} customers.`;
}

export function auditResultsHeader(input: {
  extraCreditDays: number;
  terms: number;
  actual: number;
  cash: string;
  extra: number;
}): string {
  const { extraCreditDays, terms, actual, cash, extra } = input;
  if (extraCreditDays < 8) {
    return 'Good news first: you collect close to your terms. The detail below shows the few places money still leaks.';
  }
  if (extraCreditDays <= 25) {
    return `You invoice on ${terms}-day terms and collect at ${actual} days. Roughly ${cash} of your cash is parked with customers. The report below shows exactly where, and how to release it.`;
  }
  return `Your customers are taking ${extra} extra days of credit you never agreed to. That is ${cash} of your money, permanently in their accounts. Start with the priority list.`;
}

export const AUDIT_ERRORS = {
  wrongType: AUDIT_UPLOAD.wrongType,
  columnsNotFound:
    'We could not find the columns we need (customer, invoice date, due date, amount, payment date). If your export uses different names, that is fine, but these five need to exist. Check the file and re-upload, or reply to the help address and attach it; a human will map it for you same day.',
  tooFewRows:
    'The audit needs at least 30 invoices to say anything honest about payment behavior. With fewer, the averages would be noise dressed as insight. If you have a longer history in your accounting system, export a wider date range and re-upload.',
  datesUnreadable:
    'Some dates in the file did not parse. The commonest cause is a mixed date format from a regional export. Re-export with a consistent format (YYYY-MM-DD works everywhere) and try again.',
  generic:
    'Something went wrong on our side, not yours. Try once more; if it repeats, email the file to audit@revcollect.ai and we will run it by hand and send you the PDF today.'
} as const;

export const AUDIT_TRUST = [
  {
    title: 'Read-only, delete anytime.',
    body: 'Your file produces this report and nothing else. One click removes it from our systems.'
  },
  {
    title: 'Never AI training data.',
    body: 'Your numbers are processed to compute your report. No model is ever trained on them. That is contractual, not a promise.'
  },
  {
    title: 'Built by a finance practitioner.',
    body: "The methodology is a Chartered Accountant's, not a marketer's: every number is explained on the report's methods page."
  }
] as const;

export const AUDIT_FAQ = [
  {
    q: 'What do I get, exactly?',
    a: 'An eight-page PDF: your headline cash numbers, how you collect versus your terms, every customer profiled by payment behavior including who is deteriorating, the ten highest-impact moves ranked by cash released (never by a vanity metric), and the full invoice-level record behind every figure.'
  },
  {
    q: 'Is it really free?',
    a: 'Yes. The audit is how we introduce RevCollect: the report shows you what your history says; our agent is the thing that acts on it. If the report is all you want, keep it with our compliments and fix the leaks yourself; the playbook is on page 5.'
  },
  {
    q: 'Can my accountant run this for me?',
    a: 'Yes, and many do. If you are an accountant or bookkeeper, run it for any client from their invoice export, put your name on the cover, and ask us about the partner program: advisors earn 25% recurring on clients they bring.'
  }
] as const;

export const AUDIT_FOOTER_CTA = {
  headline: 'The report told you where the money sits. The agent goes and gets it.',
  body: 'RevCollect reads every reply, tracks every promise to its date, and drafts every follow-up with the invoices attached, for your one-tap approval. The first overnight run on your real book is free for 7 days.',
  button: 'Start the free agent trial',
  href: 'https://revcollect.ai',
  smallPrint:
    '15-minute setup from QuickBooks or Xero. Every send approved by you. Your data never trains AI.'
} as const;

export const AUDIT_SHARE_NUDGE =
  "Report downloaded. One more thing: the person who most often fixes this is the company's accountant. Forwarding them the PDF usually starts the right conversation.";

export function mapAuditError(raw: string): string {
  // Already a pack message (e.g. tooFewRows thrown directly)
  if (
    Object.values(AUDIT_ERRORS).includes(raw as (typeof AUDIT_ERRORS)[keyof typeof AUDIT_ERRORS])
  ) {
    return raw;
  }

  const message = raw.toLowerCase();
  if (
    message.includes('unsupported file') ||
    message.includes('file type') ||
    message.includes('drop a') ||
    message.includes('please drop')
  ) {
    return AUDIT_ERRORS.wrongType;
  }
  if (message.includes('missing required column') || message.includes('could not find')) {
    return AUDIT_ERRORS.columnsNotFound;
  }
  if (message.includes('30 invoice') || message.includes('at least 30')) {
    return AUDIT_ERRORS.tooFewRows;
  }
  if (
    message.includes('date') &&
    (message.includes('parse') || message.includes('invalid') || message.includes('unreadable'))
  ) {
    return AUDIT_ERRORS.datesUnreadable;
  }
  if (message.includes('invalid invoice row')) {
    return AUDIT_ERRORS.datesUnreadable;
  }
  return AUDIT_ERRORS.generic;
}
