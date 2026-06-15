import type {
  AgentConfig,
  AgentDraftMeta,
  AgingBucket,
  AgingBucketSummary,
  AgingChartBucketRow,
  AgingCustomerBreakdownRow,
  AgingReportFilters,
  AgingReportSummary,
  CollectionStatus,
  Customer,
  CustomerInboxContext,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  LastActionInsight,
  ThreadEmail,
  TimelineEvent
} from './types';
import {
  buildAgingChartBuckets,
  buildAgingCustomerRows,
  buildAgingReportSummary,
  filterInvoicesForReport
} from './aging/lib/aging-report';
import { enrichTimelineWithThreads } from './inbox/lib/enrich-timeline-with-threads';
import { createInboxThreadData } from './mock-inbox-threads';
import { dicebearAvatar, formatRelativeDate } from './utils';

type CustomerSeed = Omit<Customer, 'balanceCents'>;

const customerSeeds: CustomerSeed[] = [
  {
    id: 'cust-1',
    name: 'Sarah Chen',
    email: 'sarah@northwindlogistics.com',
    company: 'Northwind Logistics',
    status: 'overdue',
    daysOverdue: 42
  },
  {
    id: 'cust-2',
    name: 'Marcus Webb',
    email: 'marcus@brightstudio.io',
    company: 'Bright Studio',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-3',
    name: 'Elena Rodriguez',
    email: 'elena@harborfoods.co',
    company: 'Harbor Foods Co.',
    status: 'in_dispute',
    daysOverdue: 18
  },
  {
    id: 'cust-4',
    name: 'James Okonkwo',
    email: 'james@apexmechanical.com',
    company: 'Apex Mechanical',
    status: 'promised',
    daysOverdue: 12
  },
  {
    id: 'cust-5',
    name: 'Priya Nair',
    email: 'priya@cloudstack.dev',
    company: 'CloudStack Dev',
    status: 'current',
    daysOverdue: 0
  },
  {
    id: 'cust-6',
    name: 'Tom Bradley',
    email: 'tom@ridgelinebuilders.com',
    company: 'Ridgeline Builders',
    status: 'overdue',
    daysOverdue: 67
  },
  {
    id: 'cust-7',
    name: 'Liam Patel',
    email: 'liam@quantumbio.ai',
    company: 'QuantumBio Labs',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-8',
    name: 'Nora Schmidt',
    email: 'nora@eurofreight.de',
    company: 'EuroFreight GmbH',
    status: 'overdue',
    daysOverdue: 29
  },
  {
    id: 'cust-9',
    name: 'David Kim',
    email: 'david@signalforge.com',
    company: 'SignalForge',
    status: 'promised',
    daysOverdue: 9
  },
  {
    id: 'cust-10',
    name: 'Maya Singh',
    email: 'maya@orchardretail.co',
    company: 'Orchard Retail',
    status: 'in_dispute',
    daysOverdue: 21
  },
  {
    id: 'cust-11',
    name: 'Felix Adler',
    email: 'felix@alpineparts.ch',
    company: 'Alpine Parts AG',
    status: 'current',
    daysOverdue: 0
  },
  {
    id: 'cust-12',
    name: 'Ava Johnson',
    email: 'ava@metroprint.us',
    company: 'MetroPrint',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-13',
    name: 'Omar Hassan',
    email: 'omar@novaenergy.ae',
    company: 'Nova Energy',
    status: 'overdue',
    daysOverdue: 54
  },
  {
    id: 'cust-14',
    name: 'Sofia Rossi',
    email: 'sofia@bellacucina.it',
    company: 'Bella Cucina Imports',
    status: 'promised',
    daysOverdue: 6
  },
  {
    id: 'cust-15',
    name: 'Noah Williams',
    email: 'noah@pinnaclelegal.io',
    company: 'Pinnacle Legal Ops',
    status: 'current',
    daysOverdue: 0
  },
  {
    id: 'cust-16',
    name: 'Iris Tan',
    email: 'iris@harborline.sg',
    company: 'Harborline Shipping',
    status: 'overdue',
    daysOverdue: 73
  },
  {
    id: 'cust-17',
    name: 'Mateo Alvarez',
    email: 'mateo@solarspark.mx',
    company: 'SolarSpark',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-18',
    name: 'Chloe Martin',
    email: 'chloe@finedine.fr',
    company: 'FineDine Group',
    status: 'in_dispute',
    daysOverdue: 14
  },
  {
    id: 'cust-19',
    name: 'Yuki Sato',
    email: 'yuki@tokyofabric.jp',
    company: 'Tokyo Fabric Mills',
    status: 'overdue',
    daysOverdue: 35
  },
  {
    id: 'cust-20',
    name: 'Ethan Brown',
    email: 'ethan@vertexsystems.ca',
    company: 'Vertex Systems',
    status: 'promised',
    daysOverdue: 11
  },
  {
    id: 'cust-21',
    name: 'Anika Bose',
    email: 'anika@medisphere.in',
    company: 'MediSphere Health',
    status: 'current',
    daysOverdue: 0
  },
  {
    id: 'cust-22',
    name: 'Gabriel Costa',
    email: 'gabriel@portofoods.br',
    company: 'Porto Foods',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-23',
    name: 'Hannah Lee',
    email: 'hannah@blueridgehotels.com',
    company: 'BlueRidge Hotels',
    status: 'overdue',
    daysOverdue: 46
  },
  {
    id: 'cust-24',
    name: 'Oliver Grant',
    email: 'oliver@timberlineworks.com',
    company: 'Timberline Works',
    status: 'in_dispute',
    daysOverdue: 24
  },
  {
    id: 'cust-25',
    name: 'Riya Kapoor',
    email: 'riya@atlasfashion.co.uk',
    company: 'Atlas Fashion',
    status: 'promised',
    daysOverdue: 8
  },
  {
    id: 'cust-26',
    name: 'Lucas Meyer',
    email: 'lucas@rheinsteel.de',
    company: 'Rhein Steel',
    status: 'overdue',
    daysOverdue: 91
  },
  {
    id: 'cust-27',
    name: 'Zara Ahmed',
    email: 'zara@greenleafpackaging.com',
    company: 'GreenLeaf Packaging',
    status: 'current',
    daysOverdue: 0
  },
  {
    id: 'cust-28',
    name: 'Benjamin Cole',
    email: 'benjamin@aurorasoft.io',
    company: 'AuroraSoft',
    status: 'due_soon',
    daysOverdue: 0
  },
  {
    id: 'cust-29',
    name: 'Mina Park',
    email: 'mina@seoulpharma.kr',
    company: 'Seoul Pharma',
    status: 'overdue',
    daysOverdue: 58
  },
  {
    id: 'cust-30',
    name: 'Jacob Reed',
    email: 'jacob@cascadewholesale.com',
    company: 'Cascade Wholesale',
    status: 'in_dispute',
    daysOverdue: 19
  }
];

type InvoiceSeed = Omit<Invoice, 'id'> & { id: string };

const invoiceSeeds: InvoiceSeed[] = [
  {
    id: 'inv-1',
    customerId: 'cust-1',
    number: 'INV-1042',
    amountCents: 945000,
    dueDate: '2026-03-15',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-2',
    customerId: 'cust-1',
    number: 'INV-1088',
    amountCents: 900000,
    dueDate: '2026-04-01',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-3',
    customerId: 'cust-2',
    number: 'INV-2011',
    amountCents: 620000,
    dueDate: '2026-05-20',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-4',
    customerId: 'cust-2',
    number: 'INV-2019',
    amountCents: 180000,
    dueDate: '2026-06-10',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-5',
    customerId: 'cust-3',
    number: 'INV-3301',
    amountCents: 2310000,
    dueDate: '2026-04-28',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-6',
    customerId: 'cust-3',
    number: 'INV-3308',
    amountCents: 490000,
    dueDate: '2026-05-02',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-7',
    customerId: 'cust-4',
    number: 'INV-4402',
    amountCents: 975000,
    dueDate: '2026-05-05',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-8',
    customerId: 'cust-4',
    number: 'INV-4410',
    amountCents: 265000,
    dueDate: '2026-05-07',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-9',
    customerId: 'cust-5',
    number: 'INV-5101',
    amountCents: 220000,
    dueDate: '2026-06-24',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-10',
    customerId: 'cust-5',
    number: 'INV-5107',
    amountCents: 145000,
    dueDate: '2026-07-02',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-11',
    customerId: 'cust-6',
    number: 'INV-5520',
    amountCents: 2020000,
    dueDate: '2026-03-23',
    status: 'overdue',
    agingBucket: '90+'
  },
  {
    id: 'inv-12',
    customerId: 'cust-6',
    number: 'INV-5488',
    amountCents: 1240000,
    dueDate: '2026-04-14',
    status: 'overdue',
    agingBucket: '61-90'
  },
  {
    id: 'inv-12b',
    customerId: 'cust-6',
    number: 'INV-5402',
    amountCents: 860000,
    dueDate: '2026-04-26',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-13',
    customerId: 'cust-7',
    number: 'INV-7005',
    amountCents: 520000,
    dueDate: '2026-06-09',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-14',
    customerId: 'cust-7',
    number: 'INV-7012',
    amountCents: 340000,
    dueDate: '2026-06-15',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-15',
    customerId: 'cust-8',
    number: 'INV-8022',
    amountCents: 690000,
    dueDate: '2026-04-29',
    status: 'overdue',
    agingBucket: '1-30'
  },
  {
    id: 'inv-16',
    customerId: 'cust-8',
    number: 'INV-8031',
    amountCents: 475000,
    dueDate: '2026-03-30',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-17',
    customerId: 'cust-9',
    number: 'INV-9103',
    amountCents: 810000,
    dueDate: '2026-05-12',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-18',
    customerId: 'cust-9',
    number: 'INV-9114',
    amountCents: 220000,
    dueDate: '2026-05-09',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-19',
    customerId: 'cust-10',
    number: 'INV-10041',
    amountCents: 1110000,
    dueDate: '2026-04-26',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-20',
    customerId: 'cust-10',
    number: 'INV-10055',
    amountCents: 640000,
    dueDate: '2026-04-10',
    status: 'in_dispute',
    agingBucket: '31-60'
  },
  {
    id: 'inv-21',
    customerId: 'cust-11',
    number: 'INV-11021',
    amountCents: 205000,
    dueDate: '2026-06-28',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-22',
    customerId: 'cust-11',
    number: 'INV-11034',
    amountCents: 178000,
    dueDate: '2026-07-04',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-23',
    customerId: 'cust-12',
    number: 'INV-12011',
    amountCents: 380000,
    dueDate: '2026-06-02',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-24',
    customerId: 'cust-12',
    number: 'INV-12017',
    amountCents: 315000,
    dueDate: '2026-06-16',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-25',
    customerId: 'cust-13',
    number: 'INV-13002',
    amountCents: 1280000,
    dueDate: '2026-03-18',
    status: 'overdue',
    agingBucket: '61-90'
  },
  {
    id: 'inv-26',
    customerId: 'cust-13',
    number: 'INV-13013',
    amountCents: 720000,
    dueDate: '2026-04-01',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-27',
    customerId: 'cust-14',
    number: 'INV-14022',
    amountCents: 450000,
    dueDate: '2026-05-13',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-28',
    customerId: 'cust-14',
    number: 'INV-14027',
    amountCents: 190000,
    dueDate: '2026-05-18',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-29',
    customerId: 'cust-15',
    number: 'INV-15009',
    amountCents: 165000,
    dueDate: '2026-06-25',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-30',
    customerId: 'cust-15',
    number: 'INV-15015',
    amountCents: 145000,
    dueDate: '2026-06-30',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-31',
    customerId: 'cust-16',
    number: 'INV-16001',
    amountCents: 1620000,
    dueDate: '2026-02-01',
    status: 'overdue',
    agingBucket: '90+'
  },
  {
    id: 'inv-32',
    customerId: 'cust-16',
    number: 'INV-16008',
    amountCents: 970000,
    dueDate: '2026-03-05',
    status: 'overdue',
    agingBucket: '61-90'
  },
  {
    id: 'inv-33',
    customerId: 'cust-17',
    number: 'INV-17014',
    amountCents: 310000,
    dueDate: '2026-06-07',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-34',
    customerId: 'cust-17',
    number: 'INV-17019',
    amountCents: 285000,
    dueDate: '2026-06-12',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-35',
    customerId: 'cust-18',
    number: 'INV-18003',
    amountCents: 780000,
    dueDate: '2026-05-01',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-36',
    customerId: 'cust-18',
    number: 'INV-18021',
    amountCents: 560000,
    dueDate: '2026-04-26',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-37',
    customerId: 'cust-19',
    number: 'INV-19007',
    amountCents: 920000,
    dueDate: '2026-04-03',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-38',
    customerId: 'cust-19',
    number: 'INV-19014',
    amountCents: 470000,
    dueDate: '2026-04-18',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-39',
    customerId: 'cust-20',
    number: 'INV-20006',
    amountCents: 540000,
    dueDate: '2026-05-10',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-40',
    customerId: 'cust-20',
    number: 'INV-20015',
    amountCents: 250000,
    dueDate: '2026-05-16',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-41',
    customerId: 'cust-21',
    number: 'INV-21002',
    amountCents: 110000,
    dueDate: '2026-06-22',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-42',
    customerId: 'cust-21',
    number: 'INV-21011',
    amountCents: 95000,
    dueDate: '2026-06-29',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-43',
    customerId: 'cust-22',
    number: 'INV-22004',
    amountCents: 305000,
    dueDate: '2026-06-03',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-44',
    customerId: 'cust-22',
    number: 'INV-22010',
    amountCents: 275000,
    dueDate: '2026-06-08',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-45',
    customerId: 'cust-23',
    number: 'INV-23001',
    amountCents: 1400000,
    dueDate: '2026-03-22',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-46',
    customerId: 'cust-23',
    number: 'INV-23009',
    amountCents: 330000,
    dueDate: '2026-04-01',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-47',
    customerId: 'cust-24',
    number: 'INV-24005',
    amountCents: 910000,
    dueDate: '2026-04-20',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-48',
    customerId: 'cust-24',
    number: 'INV-24012',
    amountCents: 520000,
    dueDate: '2026-04-11',
    status: 'in_dispute',
    agingBucket: '31-60'
  },
  {
    id: 'inv-49',
    customerId: 'cust-25',
    number: 'INV-25003',
    amountCents: 420000,
    dueDate: '2026-05-15',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-50',
    customerId: 'cust-25',
    number: 'INV-25011',
    amountCents: 240000,
    dueDate: '2026-05-20',
    status: 'promised',
    agingBucket: '1-30'
  },
  {
    id: 'inv-51',
    customerId: 'cust-26',
    number: 'INV-26002',
    amountCents: 1720000,
    dueDate: '2026-01-09',
    status: 'overdue',
    agingBucket: '90+'
  },
  {
    id: 'inv-52',
    customerId: 'cust-26',
    number: 'INV-26014',
    amountCents: 980000,
    dueDate: '2026-02-15',
    status: 'overdue',
    agingBucket: '90+'
  },
  {
    id: 'inv-53',
    customerId: 'cust-27',
    number: 'INV-27006',
    amountCents: 180000,
    dueDate: '2026-06-24',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-54',
    customerId: 'cust-27',
    number: 'INV-27013',
    amountCents: 150000,
    dueDate: '2026-07-01',
    status: 'current',
    agingBucket: 'current'
  },
  {
    id: 'inv-55',
    customerId: 'cust-28',
    number: 'INV-28008',
    amountCents: 460000,
    dueDate: '2026-06-05',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-56',
    customerId: 'cust-28',
    number: 'INV-28016',
    amountCents: 350000,
    dueDate: '2026-06-14',
    status: 'due_soon',
    agingBucket: 'current'
  },
  {
    id: 'inv-57',
    customerId: 'cust-29',
    number: 'INV-29004',
    amountCents: 1250000,
    dueDate: '2026-03-13',
    status: 'overdue',
    agingBucket: '61-90'
  },
  {
    id: 'inv-58',
    customerId: 'cust-29',
    number: 'INV-29017',
    amountCents: 670000,
    dueDate: '2026-04-05',
    status: 'overdue',
    agingBucket: '31-60'
  },
  {
    id: 'inv-59',
    customerId: 'cust-30',
    number: 'INV-30001',
    amountCents: 990000,
    dueDate: '2026-04-22',
    status: 'in_dispute',
    agingBucket: '1-30'
  },
  {
    id: 'inv-60',
    customerId: 'cust-30',
    number: 'INV-30012',
    amountCents: 410000,
    dueDate: '2026-04-16',
    status: 'in_dispute',
    agingBucket: '31-60'
  }
];

export const invoices: Invoice[] = invoiceSeeds;

const balanceByCustomerId = invoices.reduce<Record<string, number>>((acc, invoice) => {
  acc[invoice.customerId] = (acc[invoice.customerId] ?? 0) + invoice.amountCents;
  return acc;
}, {});

export const customers: Customer[] = customerSeeds.map((seed) => ({
  ...seed,
  avatarUrl: dicebearAvatar(seed.id),
  balanceCents: balanceByCustomerId[seed.id] ?? 0
}));

const inboxThreadData = createInboxThreadData(
  customerSeeds.map((seed) => ({
    ...seed,
    avatarUrl: dicebearAvatar(seed.id),
    balanceCents: balanceByCustomerId[seed.id] ?? 0
  }))
);

export const inboxMessages: InboxMessage[] = inboxThreadData.inboxMessages.sort(
  (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
);

export function getDefaultInboxMessageId(): string {
  return inboxMessages.find((message) => message.unread)?.id ?? inboxMessages[0]?.id ?? '';
}

export const threadEmailsByThreadId: Record<string, ThreadEmail[]> =
  inboxThreadData.threadEmailsByThreadId;

export const aiSummaryByThreadId: Record<string, string> = inboxThreadData.aiSummaryByThreadId;

export const aiDraftByMessageId: Record<string, string> = inboxThreadData.aiDraftByMessageId;

export const agentDraftMetaByMessageId: Record<string, AgentDraftMeta> =
  inboxThreadData.agentDraftMetaByMessageId;

export const customerInboxContextByCustomerId: Record<string, CustomerInboxContext> = {
  'cust-1': {
    avgDsoDays: 44,
    lifetimeValueCents: 14200000,
    followUpsSent: 3,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight:
      'Northwind typically pays within 45 days after a reminder. Sarah’s credit memo question may delay release until resolved.'
  },
  'cust-3': {
    avgDsoDays: 36,
    lifetimeValueCents: 9800000,
    followUpsSent: 2,
    paymentTerms: 'Net-45',
    source: 'QuickBooks',
    aiInsight:
      'Harbor Foods disputes are usually documentation-driven. Providing shipping proof quickly has resolved similar cases in under a week.'
  },
  'cust-6': {
    avgDsoDays: 58,
    lifetimeValueCents: 18600000,
    followUpsSent: 4,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight: 'Typically pays 20-25 days late. Payment velocity slowing over last 3 months.',
    deepAnalysis:
      'Ridgeline has requested installment plans twice in the past year. Both times they honored the full schedule within 5 days of each due date. Approving the split is low risk. The 3-month timeline matches their cash flow cycle (Q2 is historically tight for construction firms).'
  },
  'cust-9': {
    avgDsoDays: 41,
    lifetimeValueCents: 22400000,
    followUpsSent: 5,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight:
      'Summit Retail often pays in partials before the full balance. Fee waiver requests are common but they usually remit the remainder within two weeks.'
  },
  'cust-18': {
    avgDsoDays: 52,
    lifetimeValueCents: 12100000,
    followUpsSent: 3,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight:
      'Cold-chain disputes require POD and temperature logs. Once docs are attached, this customer has historically paid within ten business days.',
    deepAnalysis:
      'Active dispute on cold-chain delivery. Customer requested POD and temperature logs before payment release.'
  },
  'cust-23': {
    avgDsoDays: 44,
    lifetimeValueCents: 15200000,
    followUpsSent: 3,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight: 'AP contact changes typically delay payment 2-3 weeks while new approver onboards.',
    deepAnalysis:
      'Escalation package sent to new AP contact after contact change. Resending with aging statement is low risk and may unblock overdue approvals without a call.'
  }
};

export const escalationInsightByCustomerId: Record<string, string> = {
  'cust-3':
    'Dispute opened on INV-3301. Customer is waiting on warehouse shipping docs before releasing payment.',
  'cust-6':
    'Escalation notice sent yesterday. Tom responded within 24 hours requesting a payment plan, which is a positive signal.',
  'cust-10':
    'PO mismatch is blocking payment. Internal escalation requested corrected PO from account owner.',
  'cust-16':
    '90+ day balance with installment request pending. Finance call booked to confirm payment plan.',
  'cust-18':
    'Active dispute on cold-chain delivery. Customer requested POD and temperature logs before payment release.',
  'cust-23':
    'Escalation package sent to new AP contact after contact change. Awaiting approval on overdue invoices.'
};

const rawTimelineByCustomerId: Record<string, TimelineEvent[]> = {
  'cust-1': [
    {
      id: 'tl-1',
      customerId: 'cust-1',
      type: 'email_received',
      title: 'Customer replied',
      description: 'Sarah asked about credit memo on INV-1042',
      occurredAt: '2026-05-27T09:14:00Z'
    },
    {
      id: 'tl-2',
      customerId: 'cust-1',
      type: 'email_sent',
      title: 'Reminder sent',
      description: 'Friendly overdue notice for INV-1042 and INV-1088',
      occurredAt: '2026-05-25T10:00:00Z'
    },
    {
      id: 'tl-3',
      customerId: 'cust-1',
      type: 'call',
      title: 'Call logged',
      description: 'Left voicemail with AP contact',
      occurredAt: '2026-05-22T15:30:00Z'
    }
  ],
  'cust-3': [
    {
      id: 'tl-4',
      customerId: 'cust-3',
      type: 'email_received',
      title: 'Dispute opened',
      description: 'Quantity mismatch on INV-3301',
      occurredAt: '2026-05-26T16:42:00Z'
    },
    {
      id: 'tl-5',
      customerId: 'cust-3',
      type: 'note',
      title: 'Internal note',
      description: 'Requested warehouse shipping docs',
      occurredAt: '2026-05-26T17:00:00Z'
    }
  ],
  'cust-4': [
    {
      id: 'tl-6',
      customerId: 'cust-4',
      type: 'promise',
      title: 'Payment promised',
      description: 'Committed to pay INV-4402 by May 30',
      occurredAt: '2026-05-26T11:05:00Z'
    }
  ],
  'cust-6': [
    {
      id: 'tl-7',
      customerId: 'cust-6',
      type: 'email_received',
      title: 'Tom replied',
      description: 'Requested installment plan',
      occurredAt: '2026-05-29T10:14:00Z'
    },
    {
      id: 'tl-7b',
      customerId: 'cust-6',
      type: 'email_sent',
      title: 'Escalation sent',
      description: 'Escalation notice with aging statement',
      occurredAt: '2026-05-28T09:00:00Z'
    },
    {
      id: 'tl-7c',
      customerId: 'cust-6',
      type: 'email_sent',
      title: '3rd reminder sent',
      description: 'Firm overdue notice for INV-5402',
      occurredAt: '2026-05-15T10:00:00Z'
    },
    {
      id: 'tl-7d',
      customerId: 'cust-6',
      type: 'email_sent',
      title: '2nd reminder sent',
      description: 'Friendly reminder for open balance',
      occurredAt: '2026-05-08T10:00:00Z'
    }
  ],
  'cust-9': [
    {
      id: 'tl-9',
      customerId: 'cust-9',
      type: 'email_received',
      title: 'Partial payment sent',
      description: 'David sent $5,000 toward INV-9103 with remittance advice',
      occurredAt: '2026-05-24T12:45:00Z'
    },
    {
      id: 'tl-10',
      customerId: 'cust-9',
      type: 'promise',
      title: 'Follow-up commitment',
      description: 'Customer requested fee waiver before remitting remainder',
      occurredAt: '2026-05-24T13:10:00Z'
    }
  ],
  'cust-10': [
    {
      id: 'tl-11',
      customerId: 'cust-10',
      type: 'email_received',
      title: 'PO mismatch flagged',
      description: 'Customer AP reported invalid PO on INV-10055',
      occurredAt: '2026-05-23T15:48:00Z'
    },
    {
      id: 'tl-12',
      customerId: 'cust-10',
      type: 'note',
      title: 'Internal escalation',
      description: 'Requested corrected PO from account owner',
      occurredAt: '2026-05-23T16:10:00Z'
    }
  ],
  'cust-16': [
    {
      id: 'tl-13',
      customerId: 'cust-16',
      type: 'email_received',
      title: 'Installment request',
      description: 'Customer requested three-part plan for 90+ balance',
      occurredAt: '2026-05-23T09:20:00Z'
    },
    {
      id: 'tl-14',
      customerId: 'cust-16',
      type: 'call',
      title: 'Finance call booked',
      description: 'Call set with controller for payment plan confirmation',
      occurredAt: '2026-05-23T11:00:00Z'
    }
  ],
  'cust-18': [
    {
      id: 'tl-15',
      customerId: 'cust-18',
      type: 'email_received',
      title: 'Proof requested',
      description: 'POD and temperature logs needed for INV-18021',
      occurredAt: '2026-05-22T18:11:00Z'
    },
    {
      id: 'tl-16',
      customerId: 'cust-18',
      type: 'note',
      title: 'Ops handoff',
      description: 'Warehouse team asked to provide signed records',
      occurredAt: '2026-05-22T18:40:00Z'
    }
  ],
  'cust-20': [
    {
      id: 'tl-17',
      customerId: 'cust-20',
      type: 'promise',
      title: 'Date revised',
      description: 'Payment commitment moved to June 3',
      occurredAt: '2026-05-22T10:52:00Z'
    },
    {
      id: 'tl-18',
      customerId: 'cust-20',
      type: 'email_sent',
      title: 'Commitment acknowledged',
      description: 'RevCollect accepted revised payment date',
      occurredAt: '2026-05-22T11:15:00Z'
    }
  ],
  'cust-23': [
    {
      id: 'tl-19',
      customerId: 'cust-23',
      type: 'email_received',
      title: 'AP contact change',
      description: 'New AP manager shared for overdue approvals',
      occurredAt: '2026-05-21T16:40:00Z'
    },
    {
      id: 'tl-20',
      customerId: 'cust-23',
      type: 'email_sent',
      title: 'Escalation package sent',
      description: 'Aging statement and invoice packet sent to new contact',
      occurredAt: '2026-05-21T17:05:00Z'
    }
  ],
  'cust-24': [
    {
      id: 'tl-21',
      customerId: 'cust-24',
      type: 'email_received',
      title: 'Short-pay explained',
      description: 'Freight overcharge cited as deduction reason',
      occurredAt: '2026-05-21T12:24:00Z'
    },
    {
      id: 'tl-22',
      customerId: 'cust-24',
      type: 'note',
      title: 'Credit review started',
      description: 'Finance team validating freight claim amount',
      occurredAt: '2026-05-21T13:00:00Z'
    }
  ],
  'cust-26': [
    {
      id: 'tl-23',
      customerId: 'cust-26',
      type: 'email_received',
      title: 'Legal hold notice',
      description: 'Counsel requested temporary hold on legacy invoices',
      occurredAt: '2026-05-20T18:02:00Z'
    },
    {
      id: 'tl-24',
      customerId: 'cust-26',
      type: 'note',
      title: 'Risk flagged',
      description: 'Account moved to legal review queue',
      occurredAt: '2026-05-20T18:20:00Z'
    }
  ],
  'cust-29': [
    {
      id: 'tl-25',
      customerId: 'cust-29',
      type: 'email_received',
      title: 'Credits requested',
      description: 'Customer requested updated statement with credits',
      occurredAt: '2026-05-20T09:18:00Z'
    },
    {
      id: 'tl-26',
      customerId: 'cust-29',
      type: 'email_sent',
      title: 'Credit memo summary sent',
      description: 'Sent itemized credit notes for April period',
      occurredAt: '2026-05-20T10:05:00Z'
    }
  ],
  'cust-30': [
    {
      id: 'tl-27',
      customerId: 'cust-30',
      type: 'email_received',
      title: 'Dispute triage requested',
      description: 'Customer requested meeting to close disputes',
      occurredAt: '2026-05-19T14:05:00Z'
    },
    {
      id: 'tl-28',
      customerId: 'cust-30',
      type: 'call',
      title: 'Triage call planned',
      description: 'Scheduled 30-minute dispute review with finance team',
      occurredAt: '2026-05-19T15:00:00Z'
    }
  ]
};

export const timelineByCustomerId = enrichTimelineWithThreads(
  rawTimelineByCustomerId,
  threadEmailsByThreadId,
  customers
);

export const agentConfig: AgentConfig = {
  tone: 'professional',
  autoSendEnabled: false,
  escalationRules:
    'Escalate to human review when balance exceeds $25,000, customer is in dispute, or no reply after 3 touches.',
  signature: 'Best regards,\nRevCollect Collections Team'
};

export const integrationStatus: IntegrationStatus = {
  quickbooks: { connected: false, label: 'QuickBooks', detail: 'Not connected' },
  gmail: { connected: false, label: 'Gmail', detail: 'Not connected' },
  stripe: { connected: true, label: 'Stripe', detail: 'Payments syncing' }
};

const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days'
};

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getInvoicesForCustomer(customerId: string): Invoice[] {
  return invoices.filter((i) => i.customerId === customerId);
}

export function getMessagesForCustomer(customerId: string): InboxMessage[] {
  return inboxMessages.filter((m) => m.customerId === customerId);
}

export function getTimelineForCustomer(customerId: string): TimelineEvent[] {
  return timelineByCustomerId[customerId] ?? [];
}

export function getEscalationInsightForCustomer(customerId: string): string | undefined {
  return escalationInsightByCustomerId[customerId];
}

export function getCustomerInboxContext(
  customerId: string,
  customer: Customer
): CustomerInboxContext {
  const stored = customerInboxContextByCustomerId[customerId];
  if (stored) return stored;

  const followUpsSent = (timelineByCustomerId[customerId] ?? []).filter((event) =>
    `${event.title} ${event.description}`.toLowerCase().includes('reminder')
  ).length;

  return {
    avgDsoDays: Math.max(customer.daysOverdue, 0),
    lifetimeValueCents: customer.balanceCents * 4,
    followUpsSent: followUpsSent || 1,
    paymentTerms: 'Net-30',
    source: 'QuickBooks',
    aiInsight: ''
  };
}

export function getAiDraftForMessage(messageId: string): string {
  return aiDraftByMessageId[messageId] ?? '';
}

export function getAgentDraftMetaForMessage(messageId: string): AgentDraftMeta | undefined {
  return agentDraftMetaByMessageId[messageId];
}

export function countAgentDraftsReady(): number {
  return inboxMessages.filter((message) => message.agentDraftReady).length;
}

export function getLastActionForCustomer(customerId: string): LastActionInsight | undefined {
  const events = getTimelineForCustomer(customerId);
  const outbound = events.find(
    (event) =>
      event.type === 'email_sent' ||
      event.title.toLowerCase().includes('escalation') ||
      event.title.toLowerCase().includes('reminder')
  );
  if (!outbound) return undefined;

  return {
    title: outbound.title,
    occurredAtLabel: formatRelativeDate(outbound.occurredAt)
  };
}

export function getOpenInvoiceNumbersForCustomer(customerId: string): string[] {
  return getInvoicesForCustomer(customerId)
    .filter((invoice) => invoice.status !== 'current')
    .map((invoice) => invoice.number);
}

const sortedThreadEmailsCache = new Map<string, ThreadEmail[]>();

export function getThreadEmails(threadId: string): ThreadEmail[] {
  const cached = sortedThreadEmailsCache.get(threadId);
  if (cached) return cached;

  const sorted = (threadEmailsByThreadId[threadId] ?? []).toSorted(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );
  sortedThreadEmailsCache.set(threadId, sorted);
  return sorted;
}

/** @deprecated Use getThreadEmails */
export const getThreadMessages = getThreadEmails;

export function getAiSummaryForThread(threadId: string): string {
  return aiSummaryByThreadId[threadId] ?? '';
}

export function getInboxThreadForCustomer(customerId: string): InboxMessage | undefined {
  return inboxMessages.find((message) => message.customerId === customerId);
}

export function getCustomerStatusSummary(): Record<CollectionStatus, number> {
  return customers.reduce<Record<CollectionStatus, number>>(
    (acc, customer) => {
      acc[customer.status] += 1;
      return acc;
    },
    {
      current: 0,
      due_soon: 0,
      overdue: 0,
      in_dispute: 0,
      promised: 0
    }
  );
}

export function getAgingBuckets(): AgingBucketSummary[] {
  const buckets: AgingBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];

  return buckets.map((bucket) => {
    const bucketInvoices = invoices.filter((i) => i.agingBucket === bucket);
    return {
      bucket,
      label: AGING_BUCKET_LABELS[bucket],
      invoiceCount: bucketInvoices.length,
      totalCents: bucketInvoices.reduce((sum, i) => sum + i.amountCents, 0)
    };
  });
}

export function getInvoicesByBucket(bucket: AgingBucket): Invoice[] {
  return invoices.filter((i) => i.agingBucket === bucket);
}

export function getAgingReportSummary(filters: AgingReportFilters): AgingReportSummary {
  return buildAgingReportSummary(invoices, filters);
}

export function getAgingChartBuckets(filters: AgingReportFilters): AgingChartBucketRow[] {
  return buildAgingChartBuckets(filterInvoicesForReport(invoices, filters));
}

export function getAgingCustomerBreakdown(
  filters: AgingReportFilters
): AgingCustomerBreakdownRow[] {
  return buildAgingCustomerRows(invoices, customers, filters);
}
