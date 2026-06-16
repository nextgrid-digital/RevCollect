export type ChangelogTag = 'feature' | 'improvement' | 'fix';

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  items: Array<{ tag: ChangelogTag; text: string }>;
}

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.4.0',
    date: '2026-06-15',
    title: 'Aging dashboard & UX polish',
    summary: 'New AR aging report, marketing site foundations, and inbox improvements.',
    items: [
      { tag: 'feature', text: 'Aging dashboard with KPIs, bucket chart, and customer breakdown table' },
      { tag: 'feature', text: 'Floating reply composer on all inbox threads; AI prefill for agent-drafted emails' },
      { tag: 'feature', text: 'Dedicated settings pages and shared PageHeader / MetricBlock components' },
      { tag: 'improvement', text: 'Narrower inbox side peek and mobile-responsive aging layout' },
      { tag: 'improvement', text: 'Customer detail deep links to inbox threads' },
      { tag: 'fix', text: 'Table accessibility: row focus rings, scoped pagination, tailored empty states' }
    ]
  },
  {
    version: '0.3.0',
    date: '2026-06-01',
    title: 'Inbox redesign',
    summary: 'Multi-mode peek, agent composer, and conversation-first workflow.',
    items: [
      { tag: 'feature', text: 'Side, center, and full-page inbox peek modes' },
      { tag: 'feature', text: 'Agent draft panel with tone and playbook controls' },
      { tag: 'feature', text: 'Context rail with invoices, AI insight, and customer metrics' },
      { tag: 'improvement', text: 'Customers table with status filters and search' },
      { tag: 'improvement', text: 'Borderless settings sections and modal peek navigation' }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-05-15',
    title: 'Collections core',
    summary: 'Initial RevCollect surfaces wired to mock data layer.',
    items: [
      { tag: 'feature', text: 'Customers list and detail with invoices and activity timeline' },
      { tag: 'feature', text: 'Agent configuration for tone, escalation rules, and signature' },
      { tag: 'feature', text: 'Onboarding flows for QuickBooks and Gmail' },
      { tag: 'feature', text: 'Legal pages: privacy, terms, security, and DPA' }
    ]
  },
  {
    version: '0.1.0',
    date: '2026-05-01',
    title: 'Private alpha',
    summary: 'First internal build for bookkeeper workflows.',
    items: [
      { tag: 'feature', text: 'Collections inbox with mock threads and customer context' },
      { tag: 'feature', text: 'Aging bucket views and invoice status pills' },
      { tag: 'improvement', text: 'App shell with sidebar navigation and multi-theme support' }
    ]
  }
];
