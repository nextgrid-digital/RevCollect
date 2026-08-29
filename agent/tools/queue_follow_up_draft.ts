import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { queueFollowUpDraft } from '../../src/lib/chase/queue-follow-up-draft';
import { getChaseWorkspaceTenantId } from '../../src/lib/integrations/tenant-ids';

export default defineTool({
  description:
    'Queue a follow-up draft in the Inbox. Does not send email. Skips when relationship_state is not normal.',
  inputSchema: z.object({
    customerId: z.string().min(1),
    tone: z.enum(['professional', 'friendly', 'firm']).optional()
  }),
  async execute({ customerId, tone }) {
    const tenantId = await getChaseWorkspaceTenantId();
    return queueFollowUpDraft({ tenantId, customerId, tone });
  }
});
