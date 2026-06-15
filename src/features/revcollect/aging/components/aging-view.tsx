'use client';

import { useState } from 'react';
import { AgingBucketCard } from './aging-bucket-card';
import { InvoicesTable } from '../../components/invoices-table';
import { useAgingBuckets, useInvoicesByBucket } from '../../api/queries';
import type { AgingBucket } from '../../types';

export function AgingView() {
  const { data: buckets = [] } = useAgingBuckets();
  const [selectedBucket, setSelectedBucket] = useState<AgingBucket>(
    buckets[0]?.bucket ?? 'current'
  );
  const { data: bucketInvoices = [] } = useInvoicesByBucket(selectedBucket);

  return (
    <div className='space-y-6'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        {buckets.map((bucket) => (
          <AgingBucketCard
            key={bucket.bucket}
            bucket={bucket}
            selected={selectedBucket === bucket.bucket}
            onSelect={() => setSelectedBucket(bucket.bucket)}
          />
        ))}
      </div>

      <section>
        <h3 className='mb-4 text-lg font-medium'>
          {buckets.find((b) => b.bucket === selectedBucket)?.label} invoices
        </h3>
        {bucketInvoices.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No invoices in this bucket.</p>
        ) : (
          <InvoicesTable invoices={bucketInvoices} showCustomer />
        )}
      </section>
    </div>
  );
}
