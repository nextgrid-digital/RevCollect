'use client';

import type { ComponentType } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
    <div className='inline-flex max-w-full items-center gap-2 rounded-lg bg-black/5 px-2.5 py-1.5 dark:bg-white/10'>
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
  senderName: string;
  senderCompany?: string;
  intentLabel?: string;
  className?: string;
}

export function EmailMessageCard({
  email,
  senderName,
  senderCompany,
  intentLabel,
  className
}: EmailMessageCardProps) {
  const isCustomer = email.author === 'customer';

  return (
    <article
      className={cn('flex w-full min-w-0', isCustomer ? 'justify-start' : 'justify-end', className)}
    >
      <div
        className={cn(
          'flex w-full max-w-[min(85%,42rem)] min-w-0 flex-col gap-1',
          isCustomer ? 'items-start' : 'items-end'
        )}
      >
        <div
          className={cn(
            'flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5',
            isCustomer ? 'justify-start' : 'justify-end'
          )}
        >
          <span className='text-xs font-medium'>{senderName}</span>
          {senderCompany ? (
            <span className='text-muted-foreground truncate text-[11px]'>{senderCompany}</span>
          ) : null}
          {intentLabel ? (
            <Badge variant='outline' className='border-0 bg-muted text-[10px] font-medium'>
              {intentLabel}
            </Badge>
          ) : null}
        </div>

        <div
          className={cn(
            'w-full text-sm leading-relaxed whitespace-pre-wrap break-words',
            isCustomer
              ? 'bg-muted/70 rounded-2xl rounded-tl-md px-3.5 py-2.5 dark:bg-neutral-800/80'
              : 'bg-primary/10 rounded-2xl rounded-tr-md px-3.5 py-2.5 dark:bg-primary/15'
          )}
        >
          {email.body}

          {email.attachments?.length ? (
            <div className='mt-2.5 flex w-full flex-wrap gap-2'>
              {email.attachments.map((attachment) => (
                <EmailAttachmentChip key={attachment.id} attachment={attachment} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
