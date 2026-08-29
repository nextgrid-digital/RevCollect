import { getIntegrationStatus } from '@/lib/integrations/get-integration-status';

export async function GET() {
  try {
    const status = await getIntegrationStatus();
    return Response.json(status);
  } catch (error) {
    console.error('[integrations/status] failed:', error);
    return Response.json({ error: 'Failed to load integration status' }, { status: 500 });
  }
}
