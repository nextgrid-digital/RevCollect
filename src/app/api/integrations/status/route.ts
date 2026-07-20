import { getIntegrationStatus } from '@/lib/integrations/get-integration-status';

export async function GET() {
  const status = await getIntegrationStatus();
  return Response.json(status);
}
