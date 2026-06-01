import { memo } from 'react';
import type { Customer, CustomerInboxContext, Invoice } from '../../types';
import { getInvoicesForCustomer } from '../../mock-data';
import { InboxContextDetailsCard } from './inbox-context-details-card';
import { InboxContextInvoiceCard } from './inbox-context-invoice-card';
import { InboxContextMetricsGrid } from './inbox-context-metrics-grid';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextRailBodyProps {
  customer: Customer;
  context: CustomerInboxContext;
}

function sortInvoicesForRail(invoices: Invoice[]): Invoice[] {
  return [...invoices].sort((a, b) => {
    const statusOrder = { overdue: 0, in_dispute: 1, due_soon: 2, promised: 3, current: 4 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

function InboxContextRailBodyComponent({ customer, context }: InboxContextRailBodyProps) {
  const openInvoices = sortInvoicesForRail(
    getInvoicesForCustomer(customer.id).filter((invoice) => invoice.status !== 'current')
  ).slice(0, 3);

  return (
    <div className='flex w-full shrink-0 flex-col gap-3'>
      <InboxContextRailSection unstyled contentClassName='px-0.5'>
        <InboxContextMetricsGrid
          outstandingCents={customer.balanceCents}
          avgDsoDays={context.avgDsoDays}
          followUpsSent={context.followUpsSent}
          lifetimeValueCents={context.lifetimeValueCents}
        />
      </InboxContextRailSection>

      <InboxContextRailSection label='Invoices' unstyled contentClassName='space-y-2'>
        {openInvoices.length === 0 ? (
          <p className='text-muted-foreground px-1 text-sm'>No open invoices.</p>
        ) : (
          openInvoices.map((invoice) => (
            <InboxContextInvoiceCard key={invoice.id} invoice={invoice} />
          ))
        )}
      </InboxContextRailSection>

      <InboxContextDetailsCard
        contactName={customer.name}
        paymentTerms={context.paymentTerms}
        followUpsSent={context.followUpsSent}
        source={context.source}
      />
    </div>
  );
}

export const InboxContextRailBody = memo(InboxContextRailBodyComponent);
