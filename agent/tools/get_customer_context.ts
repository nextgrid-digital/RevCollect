import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { assembleCustomerContext } from '../../src/features/revcollect/context/assemble-context';
import { getIntegrationTenantId } from '../../src/lib/integrations/tenant';

export default defineTool({
  description: 'Assemble Type 1–4 context for one customer. Facts are live SQL; do not invent any.',
  inputSchema: z.object({
    customerId: z.string().min(1)
  }),
  async execute({ customerId }) {
    const tenantId = await getIntegrationTenantId();
    const assembled = await assembleCustomerContext(tenantId, customerId);
    if (!assembled) return { ok: false, error: 'customer_not_found' };
    return {
      ok: true,
      customerId: assembled.customerId,
      customerName: assembled.customerName,
      relationshipState: assembled.relationshipState,
      promptBlock: assembled.promptBlock,
      facts: assembled.facts
    };
  }
});
