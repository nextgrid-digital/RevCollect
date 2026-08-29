import { defineTool } from 'eve/tools';
import { z } from 'zod';
import {
  DEFAULT_AGENT_CONFIG,
  defaultWorkspaceAgentConfig
} from '../../src/lib/canonical/defaults';
import { getCanonicalStore } from '../../src/lib/canonical/store';
import { getChaseWorkspaceTenantId } from '../../src/lib/integrations/tenant-ids';

export default defineTool({
  description:
    'Read the workspace agent_config. Chase only reads this; humans write it in Agent settings.',
  inputSchema: z.object({}),
  async execute() {
    const tenantId = await getChaseWorkspaceTenantId();
    const snapshot = await (await getCanonicalStore()).read(tenantId);
    const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
    return {
      tenantId,
      currentHourUtc: new Date().getUTCHours(),
      ...config
    };
  }
});
