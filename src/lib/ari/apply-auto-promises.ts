import { stripQuotedReply } from '@/lib/email/strip-quoted-reply';
import { DEFAULT_AGENT_CONFIG, defaultWorkspaceAgentConfig } from '@/lib/canonical/defaults';
import { getCanonicalStore } from '@/lib/canonical/store';
import type { Customer, ThreadEmail } from '@/features/revcollect/types';
import {
  addDaysIsoDate,
  applyCollectionDecisionToCustomer,
  todayIsoDate
} from '@/features/revcollect/lib/collection-decision';
import { classifyReply, extractPromiseDate, replyLooksLikePromise } from './classify';
import { parsePromisedDateFromText } from './parse-promise-date';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isUsablePromiseDate(iso: string, now: Date): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const today = todayIsoDate(now);
  const max = addDaysIsoDate(180, now);
  return iso >= today && iso <= max;
}

async function resolvePromiseDate(text: string, now: Date): Promise<string | null> {
  const heuristic = parsePromisedDateFromText(text, now);
  if (heuristic && isUsablePromiseDate(heuristic, now)) return heuristic;

  const extracted = await extractPromiseDate(text);
  const iso = extracted.promiseDate?.slice(0, 10) ?? null;
  if (iso && isUsablePromiseDate(iso, now)) return iso;

  return null;
}

function latestCustomerReply(emails: ThreadEmail[], customerId: string): ThreadEmail | undefined {
  let latest: ThreadEmail | undefined;
  for (const email of emails) {
    if (email.author !== 'customer' || email.customerId !== customerId) continue;
    if (!latest || email.sentAt > latest.sentAt) latest = email;
  }
  return latest;
}

export async function applyAutoPromises(tenantId: string, now = new Date()): Promise<boolean> {
  const store = await getCanonicalStore();
  const snapshot = await store.read(tenantId);
  const config = snapshot.agentConfig ?? defaultWorkspaceAgentConfig(DEFAULT_AGENT_CONFIG);
  if (!config.behaviors.autoClassifyEmails) return false;

  const emails = snapshot.sentEmails ?? [];
  let changed = false;
  const customers: Customer[] = snapshot.customers.map((customer) => customer);

  for (let index = 0; index < customers.length; index += 1) {
    const customer = customers[index];
    if (customer.balanceCents <= 0) continue;
    const latest = latestCustomerReply(emails, customer.id);
    if (!latest) continue;
    if (customer.classifiedReplyId === latest.id) continue;

    const text = stripQuotedReply(latest.body);
    if (!text) continue;

    const classified = replyLooksLikePromise(text)
      ? { intent: 'promise' as const }
      : await classifyReply(text);
    if (classified.intent !== 'promise') {
      customers[index] = { ...customer, classifiedReplyId: latest.id };
      changed = true;
      continue;
    }

    const promisedDate = (await resolvePromiseDate(text, now)) ?? addDaysIsoDate(7, now);
    if (!isUsablePromiseDate(promisedDate, now)) {
      customers[index] = { ...customer, classifiedReplyId: latest.id };
      changed = true;
      continue;
    }

    customers[index] = {
      ...applyCollectionDecisionToCustomer(customer, {
        customerId: customer.id,
        action: 'promised',
        promisedDate
      }),
      classifiedReplyId: latest.id
    };
    changed = true;
  }

  if (!changed) return false;
  snapshot.customers = customers;
  await store.write(tenantId, snapshot);
  return true;
}
