'use client';

import type { ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { EmailAttachment, ThreadEmail } from '../../types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(mimeType: string): ComponentType<{ className?: string }> {
  if (mimeType.includes('pdf')) return Icons.fileTypePdf;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return Icons.fileTypeXls;
  if (mimeType.includes('word') || mimeType.includes('document')) return Icons.fileTypeDoc;
  return Icons.page;
}

function EmailAttachmentChip({ attachment }: { attachment: EmailAttachment }) {
  const Icon = attachmentIcon(attachment.mimeType);

  return (
    <div className='inline-flex max-w-full items-center gap-2 rounded-lg bg-neutral-100 px-2.5 py-1.5 dark:bg-neutral-800'>
      <Icon className='text-muted-foreground size-4 shrink-0' />
      <div className='min-w-0'>
        <p className='truncate text-xs font-medium'>{attachment.filename}</p>
        <p className='text-muted-foreground text-[10px]'>{formatFileSize(attachment.sizeBytes)}</p>
      </div>
    </div>
  );
}

interface EmailMessageCardProps {
  email: ThreadEmail;
  className?: string;
}

export function EmailMessageCard({ email, className }: EmailMessageCardProps) {
  const isCustomer = email.author === 'customer';

  return (
    <article className={cn('w-full min-w-0', className)}>
      <div
        className={cn(
          'w-full',
          isCustomer ? 'rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800' : 'py-3'
        )}
      >
        <div className='text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {email.body}
        </div>

        {email.attachments?.length ? (
          <div className='mt-3 flex w-full flex-wrap gap-2'>
            {email.attachments.map((attachment) => (
              <EmailAttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
