import type {
  AgentConfig,
  AgingBucket,
  AgingBucketSummary,
  CollectionStatus,
  Customer,
  InboxMessage,
  IntegrationStatus,
  Invoice,
  TimelineEvent
} from './types';

type CustomerSeed = Omit<Customer, 'balanceCents'>;

const customerSeeds: CustomerSeed[] = [
  { id: 'cust-1', name: 'Sarah Chen', email: 'sarah@northwindlogistics.com', company: 'Northwind Logistics', status: 'overdue', daysOverdue: 42 },
  { id: 'cust-2', name: 'Marcus Webb', email: 'marcus@brightstudio.io', company: 'Bright Studio', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-3', name: 'Elena Rodriguez', email: 'elena@harborfoods.co', company: 'Harbor Foods Co.', status: 'in_dispute', daysOverdue: 18 },
  { id: 'cust-4', name: 'James Okonkwo', email: 'james@apexmechanical.com', company: 'Apex Mechanical', status: 'promised', daysOverdue: 12 },
  { id: 'cust-5', name: 'Priya Nair', email: 'priya@cloudstack.dev', company: 'CloudStack Dev', status: 'current', daysOverdue: 0 },
  { id: 'cust-6', name: 'Tom Bradley', email: 'tom@ridgelinebuilders.com', company: 'Ridgeline Builders', status: 'overdue', daysOverdue: 67 },
  { id: 'cust-7', name: 'Liam Patel', email: 'liam@quantumbio.ai', company: 'QuantumBio Labs', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-8', name: 'Nora Schmidt', email: 'nora@eurofreight.de', company: 'EuroFreight GmbH', status: 'overdue', daysOverdue: 29 },
  { id: 'cust-9', name: 'David Kim', email: 'david@signalforge.com', company: 'SignalForge', status: 'promised', daysOverdue: 9 },
  { id: 'cust-10', name: 'Maya Singh', email: 'maya@orchardretail.co', company: 'Orchard Retail', status: 'in_dispute', daysOverdue: 21 },
  { id: 'cust-11', name: 'Felix Adler', email: 'felix@alpineparts.ch', company: 'Alpine Parts AG', status: 'current', daysOverdue: 0 },
  { id: 'cust-12', name: 'Ava Johnson', email: 'ava@metroprint.us', company: 'MetroPrint', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-13', name: 'Omar Hassan', email: 'omar@novaenergy.ae', company: 'Nova Energy', status: 'overdue', daysOverdue: 54 },
  { id: 'cust-14', name: 'Sofia Rossi', email: 'sofia@bellacucina.it', company: 'Bella Cucina Imports', status: 'promised', daysOverdue: 6 },
  { id: 'cust-15', name: 'Noah Williams', email: 'noah@pinnaclelegal.io', company: 'Pinnacle Legal Ops', status: 'current', daysOverdue: 0 },
  { id: 'cust-16', name: 'Iris Tan', email: 'iris@harborline.sg', company: 'Harborline Shipping', status: 'overdue', daysOverdue: 73 },
  { id: 'cust-17', name: 'Mateo Alvarez', email: 'mateo@solarspark.mx', company: 'SolarSpark', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-18', name: 'Chloe Martin', email: 'chloe@finedine.fr', company: 'FineDine Group', status: 'in_dispute', daysOverdue: 14 },
  { id: 'cust-19', name: 'Yuki Sato', email: 'yuki@tokyofabric.jp', company: 'Tokyo Fabric Mills', status: 'overdue', daysOverdue: 35 },
  { id: 'cust-20', name: 'Ethan Brown', email: 'ethan@vertexsystems.ca', company: 'Vertex Systems', status: 'promised', daysOverdue: 11 },
  { id: 'cust-21', name: 'Anika Bose', email: 'anika@medisphere.in', company: 'MediSphere Health', status: 'current', daysOverdue: 0 },
  { id: 'cust-22', name: 'Gabriel Costa', email: 'gabriel@portofoods.br', company: 'Porto Foods', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-23', name: 'Hannah Lee', email: 'hannah@blueridgehotels.com', company: 'BlueRidge Hotels', status: 'overdue', daysOverdue: 46 },
  { id: 'cust-24', name: 'Oliver Grant', email: 'oliver@timberlineworks.com', company: 'Timberline Works', status: 'in_dispute', daysOverdue: 24 },
  { id: 'cust-25', name: 'Riya Kapoor', email: 'riya@atlasfashion.co.uk', company: 'Atlas Fashion', status: 'promised', daysOverdue: 8 },
  { id: 'cust-26', name: 'Lucas Meyer', email: 'lucas@rheinsteel.de', company: 'Rhein Steel', status: 'overdue', daysOverdue: 91 },
  { id: 'cust-27', name: 'Zara Ahmed', email: 'zara@greenleafpackaging.com', company: 'GreenLeaf Packaging', status: 'current', daysOverdue: 0 },
  { id: 'cust-28', name: 'Benjamin Cole', email: 'benjamin@aurorasoft.io', company: 'AuroraSoft', status: 'due_soon', daysOverdue: 0 },
  { id: 'cust-29', name: 'Mina Park', email: 'mina@seoulpharma.kr', company: 'Seoul Pharma', status: 'overdue', daysOverdue: 58 },
  { id: 'cust-30', name: 'Jacob Reed', email: 'jacob@cascadewholesale.com', company: 'Cascade Wholesale', status: 'in_dispute', daysOverdue: 19 }
];

type InvoiceSeed = Omit<Invoice, 'id'> & { id: string };

const invoiceSeeds: InvoiceSeed[] = [
  { id: 'inv-1', customerId: 'cust-1', number: 'INV-1042', amountCents: 945000, dueDate: '2026-03-15', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-2', customerId: 'cust-1', number: 'INV-1088', amountCents: 900000, dueDate: '2026-04-01', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-3', customerId: 'cust-2', number: 'INV-2011', amountCents: 620000, dueDate: '2026-05-20', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-4', customerId: 'cust-2', number: 'INV-2019', amountCents: 180000, dueDate: '2026-06-10', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-5', customerId: 'cust-3', number: 'INV-3301', amountCents: 2310000, dueDate: '2026-04-28', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-6', customerId: 'cust-3', number: 'INV-3308', amountCents: 490000, dueDate: '2026-05-02', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-7', customerId: 'cust-4', number: 'INV-4402', amountCents: 975000, dueDate: '2026-05-05', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-8', customerId: 'cust-4', number: 'INV-4410', amountCents: 265000, dueDate: '2026-05-07', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-9', customerId: 'cust-5', number: 'INV-5101', amountCents: 220000, dueDate: '2026-06-24', status: 'current', agingBucket: 'current' },
  { id: 'inv-10', customerId: 'cust-5', number: 'INV-5107', amountCents: 145000, dueDate: '2026-07-02', status: 'current', agingBucket: 'current' },
  { id: 'inv-11', customerId: 'cust-6', number: 'INV-5501', amountCents: 2100000, dueDate: '2026-02-10', status: 'overdue', agingBucket: '61-90' },
  { id: 'inv-12', customerId: 'cust-6', number: 'INV-5520', amountCents: 2020000, dueDate: '2026-01-20', status: 'overdue', agingBucket: '90+' },
  { id: 'inv-13', customerId: 'cust-7', number: 'INV-7005', amountCents: 520000, dueDate: '2026-06-09', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-14', customerId: 'cust-7', number: 'INV-7012', amountCents: 340000, dueDate: '2026-06-15', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-15', customerId: 'cust-8', number: 'INV-8022', amountCents: 690000, dueDate: '2026-04-29', status: 'overdue', agingBucket: '1-30' },
  { id: 'inv-16', customerId: 'cust-8', number: 'INV-8031', amountCents: 475000, dueDate: '2026-03-30', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-17', customerId: 'cust-9', number: 'INV-9103', amountCents: 810000, dueDate: '2026-05-12', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-18', customerId: 'cust-9', number: 'INV-9114', amountCents: 220000, dueDate: '2026-05-09', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-19', customerId: 'cust-10', number: 'INV-10041', amountCents: 1110000, dueDate: '2026-04-26', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-20', customerId: 'cust-10', number: 'INV-10055', amountCents: 640000, dueDate: '2026-04-10', status: 'in_dispute', agingBucket: '31-60' },
  { id: 'inv-21', customerId: 'cust-11', number: 'INV-11021', amountCents: 205000, dueDate: '2026-06-28', status: 'current', agingBucket: 'current' },
  { id: 'inv-22', customerId: 'cust-11', number: 'INV-11034', amountCents: 178000, dueDate: '2026-07-04', status: 'current', agingBucket: 'current' },
  { id: 'inv-23', customerId: 'cust-12', number: 'INV-12011', amountCents: 380000, dueDate: '2026-06-02', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-24', customerId: 'cust-12', number: 'INV-12017', amountCents: 315000, dueDate: '2026-06-16', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-25', customerId: 'cust-13', number: 'INV-13002', amountCents: 1280000, dueDate: '2026-03-18', status: 'overdue', agingBucket: '61-90' },
  { id: 'inv-26', customerId: 'cust-13', number: 'INV-13013', amountCents: 720000, dueDate: '2026-04-01', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-27', customerId: 'cust-14', number: 'INV-14022', amountCents: 450000, dueDate: '2026-05-13', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-28', customerId: 'cust-14', number: 'INV-14027', amountCents: 190000, dueDate: '2026-05-18', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-29', customerId: 'cust-15', number: 'INV-15009', amountCents: 165000, dueDate: '2026-06-25', status: 'current', agingBucket: 'current' },
  { id: 'inv-30', customerId: 'cust-15', number: 'INV-15015', amountCents: 145000, dueDate: '2026-06-30', status: 'current', agingBucket: 'current' },
  { id: 'inv-31', customerId: 'cust-16', number: 'INV-16001', amountCents: 1620000, dueDate: '2026-02-01', status: 'overdue', agingBucket: '90+' },
  { id: 'inv-32', customerId: 'cust-16', number: 'INV-16008', amountCents: 970000, dueDate: '2026-03-05', status: 'overdue', agingBucket: '61-90' },
  { id: 'inv-33', customerId: 'cust-17', number: 'INV-17014', amountCents: 310000, dueDate: '2026-06-07', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-34', customerId: 'cust-17', number: 'INV-17019', amountCents: 285000, dueDate: '2026-06-12', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-35', customerId: 'cust-18', number: 'INV-18003', amountCents: 780000, dueDate: '2026-05-01', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-36', customerId: 'cust-18', number: 'INV-18021', amountCents: 560000, dueDate: '2026-04-26', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-37', customerId: 'cust-19', number: 'INV-19007', amountCents: 920000, dueDate: '2026-04-03', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-38', customerId: 'cust-19', number: 'INV-19014', amountCents: 470000, dueDate: '2026-04-18', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-39', customerId: 'cust-20', number: 'INV-20006', amountCents: 540000, dueDate: '2026-05-10', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-40', customerId: 'cust-20', number: 'INV-20015', amountCents: 250000, dueDate: '2026-05-16', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-41', customerId: 'cust-21', number: 'INV-21002', amountCents: 110000, dueDate: '2026-06-22', status: 'current', agingBucket: 'current' },
  { id: 'inv-42', customerId: 'cust-21', number: 'INV-21011', amountCents: 95000, dueDate: '2026-06-29', status: 'current', agingBucket: 'current' },
  { id: 'inv-43', customerId: 'cust-22', number: 'INV-22004', amountCents: 305000, dueDate: '2026-06-03', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-44', customerId: 'cust-22', number: 'INV-22010', amountCents: 275000, dueDate: '2026-06-08', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-45', customerId: 'cust-23', number: 'INV-23001', amountCents: 1400000, dueDate: '2026-03-22', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-46', customerId: 'cust-23', number: 'INV-23009', amountCents: 330000, dueDate: '2026-04-01', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-47', customerId: 'cust-24', number: 'INV-24005', amountCents: 910000, dueDate: '2026-04-20', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-48', customerId: 'cust-24', number: 'INV-24012', amountCents: 520000, dueDate: '2026-04-11', status: 'in_dispute', agingBucket: '31-60' },
  { id: 'inv-49', customerId: 'cust-25', number: 'INV-25003', amountCents: 420000, dueDate: '2026-05-15', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-50', customerId: 'cust-25', number: 'INV-25011', amountCents: 240000, dueDate: '2026-05-20', status: 'promised', agingBucket: '1-30' },
  { id: 'inv-51', customerId: 'cust-26', number: 'INV-26002', amountCents: 1720000, dueDate: '2026-01-09', status: 'overdue', agingBucket: '90+' },
  { id: 'inv-52', customerId: 'cust-26', number: 'INV-26014', amountCents: 980000, dueDate: '2026-02-15', status: 'overdue', agingBucket: '90+' },
  { id: 'inv-53', customerId: 'cust-27', number: 'INV-27006', amountCents: 180000, dueDate: '2026-06-24', status: 'current', agingBucket: 'current' },
  { id: 'inv-54', customerId: 'cust-27', number: 'INV-27013', amountCents: 150000, dueDate: '2026-07-01', status: 'current', agingBucket: 'current' },
  { id: 'inv-55', customerId: 'cust-28', number: 'INV-28008', amountCents: 460000, dueDate: '2026-06-05', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-56', customerId: 'cust-28', number: 'INV-28016', amountCents: 350000, dueDate: '2026-06-14', status: 'due_soon', agingBucket: 'current' },
  { id: 'inv-57', customerId: 'cust-29', number: 'INV-29004', amountCents: 1250000, dueDate: '2026-03-13', status: 'overdue', agingBucket: '61-90' },
  { id: 'inv-58', customerId: 'cust-29', number: 'INV-29017', amountCents: 670000, dueDate: '2026-04-05', status: 'overdue', agingBucket: '31-60' },
  { id: 'inv-59', customerId: 'cust-30', number: 'INV-30001', amountCents: 990000, dueDate: '2026-04-22', status: 'in_dispute', agingBucket: '1-30' },
  { id: 'inv-60', customerId: 'cust-30', number: 'INV-30012', amountCents: 410000, dueDate: '2026-04-16', status: 'in_dispute', agingBucket: '31-60' }
];

export const invoices: Invoice[] = invoiceSeeds;

const balanceByCustomerId = invoices.reduce<Record<string, number>>((acc, invoice) => {
  acc[invoice.customerId] = (acc[invoice.customerId] ?? 0) + invoice.amountCents;
  return acc;
}, {});

export const customers: Customer[] = customerSeeds.map((seed) => ({
  ...seed,
  balanceCents: balanceByCustomerId[seed.id] ?? 0
}));

export const inboxMessages: InboxMessage[] = [
  {
    id: 'msg-1',
    customerId: 'cust-1',
    subject: 'Re: Invoice INV-1042 — payment timing',
    preview: 'We received your reminder. AP is reviewing the March shipment dispute...',
    body: 'Hi,\n\nWe received your reminder. AP is reviewing the March shipment dispute before releasing payment on INV-1042. Can you confirm the credit memo was applied?\n\nThanks,\nSarah',
    receivedAt: '2026-05-27T09:14:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-2',
    customerId: 'cust-3',
    subject: 'Dispute on INV-3301',
    preview: 'The quantity on the packing slip does not match what we received...',
    body: 'Hello,\n\nThe quantity on the packing slip does not match what we received. We are holding payment until this is reconciled.\n\nElena',
    receivedAt: '2026-05-26T16:42:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-3',
    customerId: 'cust-4',
    subject: 'Payment scheduled for next week',
    preview: 'I can commit to paying INV-4402 by Friday May 30...',
    body: 'James here — I can commit to paying INV-4402 by Friday May 30. Please send the updated statement.',
    receivedAt: '2026-05-26T11:05:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-4',
    customerId: 'cust-6',
    subject: 'Need payment plan options',
    preview: 'Cash flow is tight this quarter. Can we split the overdue balance...',
    body: 'Tom from Ridgeline — cash flow is tight this quarter. Can we split the overdue balance into three installments?',
    receivedAt: '2026-05-25T14:20:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-5',
    customerId: 'cust-2',
    subject: 'Confirming receipt of invoice',
    preview: 'Invoice INV-2011 is in our system for the May 20 due date.',
    body: 'Marcus — invoice INV-2011 is in our system for the May 20 due date. No issues on our end.',
    receivedAt: '2026-05-24T08:30:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-6',
    customerId: 'cust-9',
    subject: 'Partial payment sent for INV-9103',
    preview: 'We processed a partial payment today and need confirmation on remaining balance...',
    body: 'Hi team,\n\nWe have processed a partial payment of $5,000 toward INV-9103 today. Please confirm the remaining balance and whether late fees can be waived.\n\nThanks,\nDavid',
    receivedAt: '2026-05-24T13:10:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-7',
    customerId: 'cust-10',
    subject: 'PO mismatch on INV-10055',
    preview: 'Our AP team says the PO number on the invoice is invalid.',
    body: 'Hello,\n\nOur AP team cannot process INV-10055 because the PO number listed does not match our records. Please send corrected documentation.\n\nMaya',
    receivedAt: '2026-05-23T15:48:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-8',
    customerId: 'cust-16',
    subject: 'Request for installment plan on legacy balance',
    preview: 'Can we split the oldest invoices over a 6-week payment schedule?',
    body: 'Hi,\n\nCan we split the oldest invoices into three installments over the next six weeks? We need a payment plan approved by finance.\n\nRegards,\nIris',
    receivedAt: '2026-05-23T09:20:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-9',
    customerId: 'cust-18',
    subject: 'Need delivery proof for disputed invoice',
    preview: 'Please share signed POD and temperature logs to close the dispute.',
    body: 'Hi collections,\n\nTo release payment for INV-18021, we need signed proof of delivery and temperature compliance logs.\n\nThanks,\nChloe',
    receivedAt: '2026-05-22T18:11:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-10',
    customerId: 'cust-20',
    subject: 'Promised payment date moved by 3 days',
    preview: 'Treasury cycle slipped; we can pay by June 3 instead of May 31.',
    body: 'Hi,\n\nOur treasury cycle slipped this week. We can honor payment for INV-20006 and INV-20015 by June 3.\n\nEthan',
    receivedAt: '2026-05-22T10:52:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-11',
    customerId: 'cust-23',
    subject: 'Escalation contact for aged invoices',
    preview: 'Please route this to our new AP manager for approval.',
    body: 'Hello,\n\nPlease route all invoice follow-ups for BlueRidge Hotels to our new AP manager, Laura Kent. She can approve release of overdue payments this week.\n\nHannah',
    receivedAt: '2026-05-21T16:40:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-12',
    customerId: 'cust-24',
    subject: 'Short-pay explanation for INV-24012',
    preview: 'We deducted freight overcharge from the payment amount.',
    body: 'Hi team,\n\nWe short-paid INV-24012 by $1,250 due to a freight overcharge identified in April. Please send a revised statement reflecting the deduction.\n\nOliver',
    receivedAt: '2026-05-21T12:24:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-13',
    customerId: 'cust-26',
    subject: 'Legal hold notice on oldest invoices',
    preview: 'Our counsel requested temporary hold while contract terms are reviewed.',
    body: 'Dear RevCollect,\n\nOur legal counsel asked us to place a temporary hold on invoices dated before February while service-level terms are reviewed.\n\nRegards,\nLucas',
    receivedAt: '2026-05-20T18:02:00Z',
    unread: true,
    channel: 'email'
  },
  {
    id: 'msg-14',
    customerId: 'cust-29',
    subject: 'Need revised statement with applied credits',
    preview: 'Please include April credit notes before we release payment.',
    body: 'Hi,\n\nBefore Seoul Pharma releases payment for INV-29004 and INV-29017, please issue a revised statement including all April credits.\n\nMina',
    receivedAt: '2026-05-20T09:18:00Z',
    unread: false,
    channel: 'email'
  },
  {
    id: 'msg-15',
    customerId: 'cust-30',
    subject: 'Dispute review meeting request',
    preview: 'Can we schedule a triage call this week to close open dispute items?',
    body: 'Hi,\n\nCan we schedule a 30-minute triage call this week to review open dispute items on INV-30001 and INV-30012?\n\nThanks,\nJacob',
    receivedAt: '2026-05-19T14:05:00Z',
    unread: false,
    channel: 'email'
  }
];

export const timelineByCustomerId: Record<string, TimelineEvent[]> = {
  'cust-1': [
    { id: 'tl-1', customerId: 'cust-1', type: 'email_received', title: 'Customer replied', description: 'Sarah asked about credit memo on INV-1042', occurredAt: '2026-05-27T09:14:00Z' },
    { id: 'tl-2', customerId: 'cust-1', type: 'email_sent', title: 'Reminder sent', description: 'Friendly overdue notice for INV-1042 and INV-1088', occurredAt: '2026-05-25T10:00:00Z' },
    { id: 'tl-3', customerId: 'cust-1', type: 'call', title: 'Call logged', description: 'Left voicemail with AP contact', occurredAt: '2026-05-22T15:30:00Z' }
  ],
  'cust-3': [
    { id: 'tl-4', customerId: 'cust-3', type: 'email_received', title: 'Dispute opened', description: 'Quantity mismatch on INV-3301', occurredAt: '2026-05-26T16:42:00Z' },
    { id: 'tl-5', customerId: 'cust-3', type: 'note', title: 'Internal note', description: 'Requested warehouse shipping docs', occurredAt: '2026-05-26T17:00:00Z' }
  ],
  'cust-4': [{ id: 'tl-6', customerId: 'cust-4', type: 'promise', title: 'Payment promised', description: 'Committed to pay INV-4402 by May 30', occurredAt: '2026-05-26T11:05:00Z' }],
  'cust-6': [
    { id: 'tl-7', customerId: 'cust-6', type: 'email_received', title: 'Payment plan requested', description: 'Asked to split balance into installments', occurredAt: '2026-05-25T14:20:00Z' },
    { id: 'tl-8', customerId: 'cust-6', type: 'email_sent', title: 'Final notice sent', description: 'Escalation email for 60+ day balance', occurredAt: '2026-05-20T09:00:00Z' }
  ],
  'cust-9': [
    { id: 'tl-9', customerId: 'cust-9', type: 'payment', title: 'Partial payment received', description: 'Received $5,000 toward INV-9103', occurredAt: '2026-05-24T12:45:00Z' },
    { id: 'tl-10', customerId: 'cust-9', type: 'promise', title: 'Follow-up commitment', description: 'Customer requested fee waiver before remitting remainder', occurredAt: '2026-05-24T13:10:00Z' }
  ],
  'cust-10': [
    { id: 'tl-11', customerId: 'cust-10', type: 'email_received', title: 'PO mismatch flagged', description: 'Customer AP reported invalid PO on INV-10055', occurredAt: '2026-05-23T15:48:00Z' },
    { id: 'tl-12', customerId: 'cust-10', type: 'note', title: 'Internal escalation', description: 'Requested corrected PO from account owner', occurredAt: '2026-05-23T16:10:00Z' }
  ],
  'cust-16': [
    { id: 'tl-13', customerId: 'cust-16', type: 'email_received', title: 'Installment request', description: 'Customer requested three-part plan for 90+ balance', occurredAt: '2026-05-23T09:20:00Z' },
    { id: 'tl-14', customerId: 'cust-16', type: 'call', title: 'Finance call booked', description: 'Call set with controller for payment plan confirmation', occurredAt: '2026-05-23T11:00:00Z' }
  ],
  'cust-18': [
    { id: 'tl-15', customerId: 'cust-18', type: 'email_received', title: 'Proof requested', description: 'POD and temperature logs needed for INV-18021', occurredAt: '2026-05-22T18:11:00Z' },
    { id: 'tl-16', customerId: 'cust-18', type: 'note', title: 'Ops handoff', description: 'Warehouse team asked to provide signed records', occurredAt: '2026-05-22T18:40:00Z' }
  ],
  'cust-20': [
    { id: 'tl-17', customerId: 'cust-20', type: 'promise', title: 'Date revised', description: 'Payment commitment moved to June 3', occurredAt: '2026-05-22T10:52:00Z' },
    { id: 'tl-18', customerId: 'cust-20', type: 'email_sent', title: 'Commitment acknowledged', description: 'RevCollect accepted revised payment date', occurredAt: '2026-05-22T11:15:00Z' }
  ],
  'cust-23': [
    { id: 'tl-19', customerId: 'cust-23', type: 'email_received', title: 'AP contact change', description: 'New AP manager shared for overdue approvals', occurredAt: '2026-05-21T16:40:00Z' },
    { id: 'tl-20', customerId: 'cust-23', type: 'email_sent', title: 'Escalation package sent', description: 'Aging statement and invoice packet sent to new contact', occurredAt: '2026-05-21T17:05:00Z' }
  ],
  'cust-24': [
    { id: 'tl-21', customerId: 'cust-24', type: 'email_received', title: 'Short-pay explained', description: 'Freight overcharge cited as deduction reason', occurredAt: '2026-05-21T12:24:00Z' },
    { id: 'tl-22', customerId: 'cust-24', type: 'note', title: 'Credit review started', description: 'Finance team validating freight claim amount', occurredAt: '2026-05-21T13:00:00Z' }
  ],
  'cust-26': [
    { id: 'tl-23', customerId: 'cust-26', type: 'email_received', title: 'Legal hold notice', description: 'Counsel requested temporary hold on legacy invoices', occurredAt: '2026-05-20T18:02:00Z' },
    { id: 'tl-24', customerId: 'cust-26', type: 'note', title: 'Risk flagged', description: 'Account moved to legal review queue', occurredAt: '2026-05-20T18:20:00Z' }
  ],
  'cust-29': [
    { id: 'tl-25', customerId: 'cust-29', type: 'email_received', title: 'Credits requested', description: 'Customer requested updated statement with credits', occurredAt: '2026-05-20T09:18:00Z' },
    { id: 'tl-26', customerId: 'cust-29', type: 'email_sent', title: 'Credit memo summary sent', description: 'Sent itemized credit notes for April period', occurredAt: '2026-05-20T10:05:00Z' }
  ],
  'cust-30': [
    { id: 'tl-27', customerId: 'cust-30', type: 'email_received', title: 'Dispute triage requested', description: 'Customer requested meeting to close disputes', occurredAt: '2026-05-19T14:05:00Z' },
    { id: 'tl-28', customerId: 'cust-30', type: 'call', title: 'Triage call planned', description: 'Scheduled 30-minute dispute review with finance team', occurredAt: '2026-05-19T15:00:00Z' }
  ]
};

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

export const aiDraftByMessageId: Record<string, string> = {
  'msg-1':
    'Hi Sarah,\n\nThank you for the update. I have asked our billing team to confirm whether credit memo CM-204 was applied to INV-1042. I will follow up within one business day with a revised statement.\n\nBest regards,\nRevCollect Collections Team',
  'msg-2':
    'Hi Elena,\n\nThank you for flagging the quantity discrepancy on INV-3301. We are pulling the packing slip and delivery receipt now and will respond with a resolution within 48 hours.\n\nBest regards,\nRevCollect Collections Team',
  'msg-3':
    'Hi James,\n\nThank you for confirming payment by May 30. I have noted the commitment on INV-4402 and attached an updated statement for your records.\n\nBest regards,\nRevCollect Collections Team',
  'msg-4':
    'Hi Tom,\n\nThank you for reaching out. We can offer a three-installment plan on the overdue balance. I will send proposed dates and amounts for your approval shortly.\n\nBest regards,\nRevCollect Collections Team',
  'msg-5':
    'Hi Marcus,\n\nThank you for confirming INV-2011 is scheduled for May 20. No further action is needed at this time.\n\nBest regards,\nRevCollect Collections Team',
  'msg-6':
    'Hi David,\n\nThank you for confirming the partial payment. We have applied the $5,000 remittance and the remaining balance is $3,300 across INV-9103 and INV-9114. We can review fee waiver options once the remaining principal is scheduled.\n\nBest regards,\nRevCollect Collections Team',
  'msg-7':
    'Hi Maya,\n\nThank you for flagging the PO mismatch. We are validating the PO reference with our account team and will send a corrected invoice packet for INV-10055 within one business day.\n\nBest regards,\nRevCollect Collections Team',
  'msg-8':
    'Hi Iris,\n\nThanks for the payment-plan request. We can offer a 3-installment structure over six weeks for INV-16001 and INV-16008. I will send a schedule with proposed due dates today for approval.\n\nBest regards,\nRevCollect Collections Team',
  'msg-9':
    'Hi Chloe,\n\nUnderstood. We are collecting the signed POD and temperature logs for INV-18021 and will share the complete evidence package within 24 hours so payment can be released.\n\nBest regards,\nRevCollect Collections Team',
  'msg-10':
    'Hi Ethan,\n\nThank you for the update. We have revised the commitment date to June 3 for INV-20006 and INV-20015. Please confirm once treasury has queued both payments.\n\nBest regards,\nRevCollect Collections Team',
  'msg-11':
    'Hi Hannah,\n\nThanks for sharing the new AP contact. We have updated our records and sent Laura Kent the full aging statement and invoice backup for immediate approval.\n\nBest regards,\nRevCollect Collections Team',
  'msg-12':
    'Hi Oliver,\n\nThank you for detailing the short-pay reason. We are reviewing the $1,250 freight deduction with billing and will issue either a revised statement or supporting charge backup by tomorrow.\n\nBest regards,\nRevCollect Collections Team',
  'msg-13':
    'Hi Lucas,\n\nThank you for the legal hold notice. We have paused automated outreach on the affected invoices and moved this account to managed review. Please share expected timing for counsel feedback.\n\nBest regards,\nRevCollect Collections Team',
  'msg-14':
    'Hi Mina,\n\nAbsolutely - we will send a revised statement that includes all April credit memos and net balances for INV-29004 and INV-29017 by end of day.\n\nBest regards,\nRevCollect Collections Team',
  'msg-15':
    'Hi Jacob,\n\nA triage call works well. I have proposed Thursday at 11:00 AM with our collections and billing leads to close all open items on INV-30001 and INV-30012.\n\nBest regards,\nRevCollect Collections Team'
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

export function getAiDraftForMessage(messageId: string): string {
  return aiDraftByMessageId[messageId] ?? '';
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
