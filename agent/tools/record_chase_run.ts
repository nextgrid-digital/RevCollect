import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { recordChaseRun } from '../../src/lib/chase/record-chase-run';
import { getChaseWorkspaceTenantId } from '../../src/lib/integrations/tenant-ids';

export default defineTool({
  description: 'Persist overnight Chase bullets for the Dashboard. Does not send anything.',
  inputSchema: z.object({
    bullets: z.array(z.string()).min(1),
    digestHour: z.number().int().min(0).max(23).optional()
  }),
  async execute({ bullets, digestHour }) {
    const tenantId = await getChaseWorkspaceTenantId();
    const run = await recordChaseRun({ tenantId, bullets, digestHour });
    return run;
  }
});
