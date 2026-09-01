import type { CollectionStatus, Customer } from '../types';

export type CollectionDecisionAction = 'promised' | 'dispute' | 'chase_again';

export interface CollectionDecisionInput {
  customerId: string;
  action: CollectionDecisionAction;
  promisedDate?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isCollectionOverrideStatus(status: CollectionStatus): boolean {
  return status === 'promised' || status === 'in_dispute';
}

export function deriveCustomerStatus(balanceCents: number, daysOverdue: number): CollectionStatus {
  if (balanceCents <= 0) return 'current';
  if (daysOverdue > 0) return 'overdue';
  return 'due_soon';
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIsoDate(days: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return todayIsoDate(date);
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function formatPromisedDateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(parseIsoDate(isoDate));
}

export function applyCollectionDecisionToCustomer(
  customer: Customer,
  input: CollectionDecisionInput
): Customer {
  switch (input.action) {
    case 'promised': {
      const promisedDate = input.promisedDate?.slice(0, 10);
      if (!promisedDate || !ISO_DATE.test(promisedDate)) {
        throw new Error('promisedDate required');
      }
      return { ...customer, status: 'promised', promisedDate };
    }
    case 'dispute':
      return { ...customer, status: 'in_dispute', promisedDate: undefined };
    case 'chase_again':
      return {
        ...customer,
        status: deriveCustomerStatus(customer.balanceCents, customer.daysOverdue),
        promisedDate: undefined
      };
    default: {
      const _exhaustive: never = input.action;
      return _exhaustive;
    }
  }
}

export function restoreCollectionOverrides(
  customers: Customer[],
  previous: Customer[]
): Customer[] {
  const previousById = new Map(previous.map((customer) => [customer.id, customer]));
  return customers.map((customer) => {
    if (customer.balanceCents <= 0) {
      return customer.promisedDate ? { ...customer, promisedDate: undefined } : customer;
    }
    const prev = previousById.get(customer.id);
    if (!prev || !isCollectionOverrideStatus(prev.status)) return customer;
    return {
      ...customer,
      status: prev.status,
      promisedDate: prev.status === 'promised' ? prev.promisedDate : undefined
    };
  });
}

export function collectionFollowUpSkipReason(customer: Customer): string | undefined {
  if (customer.status === 'in_dispute') return 'in_dispute';
  if (customer.status !== 'promised') return undefined;
  if (!customer.promisedDate) return 'promised';
  if (customer.promisedDate >= todayIsoDate()) return 'promised';
  return undefined;
}
