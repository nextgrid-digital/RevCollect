import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { recordAriRun } from '../../src/lib/ari/record-ari-run';
import { getAriWorkspaceTenantId } from '../../src/lib/integrations/tenant-ids';

export default defineTool({
  description: 'Persist overnight ARI bullets for the Dashboard. Does not send anything.',
  inputSchema: z.object({
    bullets: z.array(z.string()).min(1),
    digestHour: z.number().int().min(0).max(23).optional()
  }),
  async execute({ bullets, digestHour }) {
    const tenantId = await getAriWorkspaceTenantId();
    const run = await recordAriRun({ tenantId, bullets, digestHour });
    return run;
  }
});
