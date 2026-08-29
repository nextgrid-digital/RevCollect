import {
  DISCONNECTED_INTEGRATION_STATUS,
  getIntegrationStatus
} from '@/lib/integrations/get-integration-status';

export async function GET() {
  try {
    const status = await getIntegrationStatus();
    return Response.json(status);
  } catch (error) {
    console.error('[integrations/status] failed:', error);
    return Response.json(DISCONNECTED_INTEGRATION_STATUS);
  }
}
