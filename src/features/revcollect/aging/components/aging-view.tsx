'use client';

import { useState } from 'react';
import { StatCard } from '../../components/stat-card';
import { InvoiceCard } from '../../components/invoice-card';
import { formatCurrency } from '../../utils';
import { getAgingBuckets, getInvoicesByBucket } from '../../mock-data';
import type { AgingBucket } from '../../types';
import { cn } from '@/lib/utils';

export function AgingView() {
  const buckets = getAgingBuckets();
  const [selectedBucket, setSelectedBucket] = useState<AgingBucket>(
    buckets[0]?.bucket ?? 'current'
  );
  const bucketInvoices = getInvoicesByBucket(selectedBucket);

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {buckets.map((bucket) => (
          <button
            key={bucket.bucket}
            type='button'
            onClick={() => setSelectedBucket(bucket.bucket)}
            className={cn(
              'text-left',
              selectedBucket === bucket.bucket && 'ring-primary ring-2 rounded-xl'
            )}
          >
            <StatCard
              title={bucket.label}
              value={formatCurrency(bucket.totalCents)}
              description={`${bucket.invoiceCount} invoice${bucket.invoiceCount === 1 ? '' : 's'}`}
            />
          </button>
        ))}
      </div>

      <section>
        <h3 className='mb-4 text-lg font-medium'>
          {buckets.find((b) => b.bucket === selectedBucket)?.label} invoices
        </h3>
        <div className='space-y-2'>
          {bucketInvoices.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No invoices in this bucket.</p>
          ) : (
            bucketInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} showCustomer />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
