export type InvoiceStatus = string;

export interface RawInvoiceRow {
  InvoiceNumber: string;
  Customer: string;
  CustomerEmail: string;
  InvoiceDate: string;
  Terms: string;
  DueDate: string;
  Amount: string;
  Status: string;
  PaymentDate: string;
  AmountPaid: string;
  DaysToPay: string;
  DaysPastDue_AtPayment: string;
  DaysPastDue_Current: string;
}

export interface InvoiceRecord {
  invoiceNumber: string;
  customer: string;
  customerEmail: string;
  invoiceDate: Date;
  terms: string;
  termsDays: number;
  dueDate: Date;
  amount: number;
  status: string;
  paymentDate: Date | null;
  amountPaid: number;
  daysToPay: number | null;
  daysLateAtPayment: number | null;
  isPaid: boolean;
  isOutstanding: boolean;
}

export type AgingBucket = 'Current' | '1-30' | '31-60' | '61-90' | '90+';

export interface EnrichedInvoice extends InvoiceRecord {
  daysPastDueNow: number | null;
  bucket: AgingBucket | null;
  openAmount: number;
  openValueXAge: number;
}

export type BehaviorBand = 'Reliable' | 'Mildly slow' | 'Chronically slow' | 'Problem payer';

export interface CustomerBehavior {
  customer: string;
  invoiceCount: number;
  lifetimeBilled: number;
  avgDaysToPay: number | null;
  termsDays: number;
  avgDaysLate: number | null;
  lateTrendDays: number | null;
  behaviorBand: BehaviorBand;
  deteriorating: boolean;
  behaviorRead: string;
  openInvoiceCount: number;
  openValue: number;
  aging: Record<AgingBucket, number>;
  valueWeightedAge: number;
  impactScore: number;
}

export interface PriorityItem {
  rank: number;
  customer: string;
  openValue: number;
  valueWeightedAge: number;
  impactScore: number;
  avgDaysLate: number | null;
  recommendedFirstMove: string;
}

export interface AuditHeadline {
  invoiceCount: number;
  paidCount: number;
  outstandingCount: number;
  totalBilled: number;
  monthSpan: number;
  billingStart: Date;
  billingEnd: Date;
  averageMonthlyBilling: number;
  openAr: number;
  openCustomerCount: number;
  withinTermsCount: number;
  vwAvgDaysToPay: number;
  vwAvgTerms: number;
  extraCreditDays: number;
  cashLocked: number;
  interestCostAnnual: number;
  headlineSentence: string;
  aging: Record<AgingBucket, number>;
}

export interface AuditReport {
  companyName: string;
  analysisDate: Date;
  headline: AuditHeadline;
  customers: CustomerBehavior[];
  priority: PriorityItem[];
  overdueInvoices: Array<{
    invoiceNumber: string;
    customer: string;
    issued: Date;
    due: Date;
    amount: number;
    daysPastDue: number;
  }>;
  modelPayers: string[];
  creditDonors: string[];
  oneToWatch: string | null;
  fixReleaseLow: number;
  fixReleaseHigh: number;
}
