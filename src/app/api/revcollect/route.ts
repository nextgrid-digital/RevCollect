import { NextResponse, type NextRequest } from 'next/server';
import { getXeroRevCollectService } from '@/features/revcollect/api/xero-service';
import { extractSituation } from '@/features/revcollect/extract/extract-situation';
import { applyPreferencesFromEdit } from '@/features/revcollect/extract/preferences-from-edit';
import { getIntegrationTenantId } from '@/lib/integrations/tenant';
import { GmailNotConnectedError } from '@/lib/integrations/gmail-api';
import { getAuthUserId } from '@/lib/supabase/get-auth-user';
import { clearXeroArCache } from '@/lib/integrations/xero-api';
import type {
  AgingBucket,
  AgingReportFilters,
  AgingReportPeriod,
  AgingReportSort
} from '@/features/revcollect/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function parseAgingFilters(request: NextRequest): AgingReportFilters {
  const period = (request.nextUrl.searchParams.get('period') ?? 'all_time') as AgingReportPeriod;
  const sort = (request.nextUrl.searchParams.get('sort') ?? 'amount_desc') as AgingReportSort;
  const customerId = request.nextUrl.searchParams.get('customerId') ?? undefined;
  return { period, sort, customerId: customerId || undefined };
}

export async function GET(request: NextRequest) {
  const op = request.nextUrl.searchParams.get('op');
  if (!op) {
    return NextResponse.json({ error: 'Missing op' }, { status: 400 });
  }

  if (request.nextUrl.searchParams.get('refresh') === '1') {
    clearXeroArCache();
  }

  const service = getXeroRevCollectService();

  try {
    switch (op) {
      case 'listInboxMessages':
        return NextResponse.json(await service.listInboxMessages());
      case 'getDefaultInboxMessageId':
        return NextResponse.json({ id: await service.getDefaultInboxMessageId() });
      case 'getInboxThreadForCustomer': {
        const customerId = request.nextUrl.searchParams.get('customerId');
        if (!customerId)
          return NextResponse.json({ error: 'customerId required' }, { status: 400 });
        return NextResponse.json(await service.getInboxThreadForCustomer(customerId));
      }
      case 'getInboxSelectionData': {
        const messageId = request.nextUrl.searchParams.get('messageId');
        if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });
        return NextResponse.json(await service.getInboxSelectionData(messageId));
      }
      case 'listCustomers':
        return NextResponse.json(await service.listCustomers());
      case 'getCustomerById': {
        const id = request.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        return NextResponse.json(await service.getCustomerById(id));
      }
      case 'getCustomerContext': {
        const customerId = request.nextUrl.searchParams.get('customerId');
        if (!customerId)
          return NextResponse.json({ error: 'customerId required' }, { status: 400 });
        return NextResponse.json(await service.getCustomerContext(customerId));
      }
      case 'getCustomerStatusSummary':
        return NextResponse.json(await service.getCustomerStatusSummary());
      case 'listInvoices':
        return NextResponse.json(await service.listInvoices());
      case 'getInvoicesForCustomer': {
        const customerId = request.nextUrl.searchParams.get('customerId');
        if (!customerId)
          return NextResponse.json({ error: 'customerId required' }, { status: 400 });
        return NextResponse.json(await service.getInvoicesForCustomer(customerId));
      }
      case 'getInvoicesByBucket': {
        const bucket = request.nextUrl.searchParams.get('bucket') as AgingBucket | null;
        if (!bucket) return NextResponse.json({ error: 'bucket required' }, { status: 400 });
        return NextResponse.json(await service.getInvoicesByBucket(bucket));
      }
      case 'getAgingBuckets':
        return NextResponse.json(await service.getAgingBuckets());
      case 'getAgingReport': {
        const filters = parseAgingFilters(request);
        return NextResponse.json(await service.getAgingReport(filters));
      }
      case 'getTimelineForCustomer': {
        const customerId = request.nextUrl.searchParams.get('customerId');
        if (!customerId)
          return NextResponse.json({ error: 'customerId required' }, { status: 400 });
        return NextResponse.json(await service.getTimelineForCustomer(customerId));
      }
      case 'getAgentConfig':
        return NextResponse.json(await service.getAgentConfig());
      case 'getLatestAriRun':
        return NextResponse.json(await service.getLatestAriRun());
      case 'getAgentAddonStatus':
        return NextResponse.json(await service.getAgentAddonStatus());
      case 'countAgentDraftsReady':
        return NextResponse.json({ count: await service.countAgentDraftsReady() });
      case 'getWorkspaceGeneralSettings':
        return NextResponse.json(await service.getWorkspaceGeneralSettings());
      default:
        return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xero data request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { op?: string; payload?: unknown };
  const op = body.op;
  if (!op) {
    return NextResponse.json({ error: 'Missing op' }, { status: 400 });
  }

  const service = getXeroRevCollectService();

  try {
    switch (op) {
      case 'updateAgentConfig':
        return NextResponse.json(
          await service.updateAgentConfig(
            body.payload as Parameters<typeof service.updateAgentConfig>[0]
          )
        );
      case 'subscribeAgentAddon':
        return NextResponse.json(await service.subscribeAgentAddon());
      case 'activateAgent':
        return NextResponse.json(await service.activateAgent());
      case 'updateWorkspaceGeneralSettings':
        return NextResponse.json(
          await service.updateWorkspaceGeneralSettings(
            body.payload as Parameters<typeof service.updateWorkspaceGeneralSettings>[0]
          )
        );
      case 'recordInboxSend': {
        const userId = await getAuthUserId();
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const payload = body.payload as {
          customerId?: string;
          originalBody?: string;
          sentBody?: string;
          kind?: 'reply' | 'draft_edit';
          messageId?: string;
        };
        if (!payload?.customerId || !payload.sentBody) {
          return NextResponse.json({ error: 'customerId and sentBody required' }, { status: 400 });
        }
        const tenantId = await getIntegrationTenantId();
        const kind = payload.kind ?? 'reply';
        const result = await service.sendInboxFollowUp({
          customerId: payload.customerId,
          sentBody: payload.sentBody,
          originalBody: payload.originalBody,
          kind,
          messageId: payload.messageId
        });
        try {
          if (payload.originalBody) {
            await applyPreferencesFromEdit(
              tenantId,
              payload.customerId,
              payload.originalBody,
              payload.sentBody
            );
          }
          await extractSituation({
            tenantId,
            customerId: payload.customerId,
            kind: kind === 'draft_edit' ? 'draft_edit' : 'reply',
            text: payload.sentBody
          });
        } catch (error) {
          console.error('[recordInboxSend] post-send extract failed:', error);
        }
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof GmailNotConnectedError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Xero mutation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
