import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { getDaysOverdueFromDueDate } from '../../src/features/revcollect/utils';
import {
  invoiceAmountDueCents,
  isOpenCanonicalInvoice
} from '../../src/features/revcollect/lib/invoice-open';
import { getCanonicalStore } from '../../src/lib/canonical/store';
import { getIntegrationTenantId } from '../../src/lib/integrations/tenant';

export default defineTool({
  description: 'List open receivables from the canonical store (not live Xero).',
  inputSchema: z.object({
    overdueOnly: z.boolean().optional()
  }),
  async execute({ overdueOnly }) {
    const tenantId = await getIntegrationTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const rows = snapshot.customers
      .filter((customer) => customer.balanceCents > 0)
      .filter((customer) => (overdueOnly === false ? true : customer.daysOverdue > 0))
      .map((customer) => {
        const invoices = snapshot.invoices
          .filter((invoice) => invoice.customerId === customer.id)
          .filter(isOpenCanonicalInvoice);
        return {
          customerId: customer.id,
          name: customer.name,
          company: customer.company,
          balanceCents: customer.balanceCents,
          daysOverdue: customer.daysOverdue,
          relationshipState: customer.relationshipState ?? 'normal',
          invoices: invoices.map((invoice) => ({
            number: invoice.number,
            amountCents: invoiceAmountDueCents(invoice),
            dueDate: invoice.dueDate,
            daysOverdue: getDaysOverdueFromDueDate(invoice.dueDate)
          }))
        };
      });
    return { tenantId, customers: rows };
  }
});
