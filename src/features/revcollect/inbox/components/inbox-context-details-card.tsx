import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextDetailsCardProps {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  paymentTerms: string;
  hideLabel?: boolean;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <th scope='row' className='text-muted-foreground py-2 pr-3 text-left text-[11px] font-medium'>
        {label}
      </th>
      <td className='py-2 text-right text-xs font-medium'>{value}</td>
    </tr>
  );
}

function DetailRowLink({ label, href, value }: { label: string; href: string; value: string }) {
  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <th scope='row' className='text-muted-foreground py-2 pr-3 text-left text-[11px] font-medium'>
        {label}
      </th>
      <td className='py-2 text-right text-xs font-medium'>
        <a
          href={href}
          className='hover:text-foreground/80 truncate underline-offset-2 hover:underline'
        >
          {value}
        </a>
      </td>
    </tr>
  );
}

function DetailRowPhone({ phone }: { phone: string }) {
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <th scope='row' className='text-muted-foreground py-2 pr-3 text-left text-[11px] font-medium'>
        Phone
      </th>
      <td className='py-2 text-right'>
        <div className='flex items-center justify-end gap-1.5'>
          <span className='text-xs font-medium tabular-nums'>{phone}</span>
          <Button
            asChild
            variant='outline'
            className='h-6 shrink-0 rounded-md px-2 text-[10px] font-medium'
          >
            <a href={telHref}>Call</a>
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function InboxContextDetailsCard({
  contactName,
  contactEmail,
  contactPhone,
  paymentTerms,
  hideLabel = false
}: InboxContextDetailsCardProps) {
  const table = (
    <table className='w-full border-collapse'>
      <tbody>
        <DetailRow label='Contact' value={contactName} />
        <DetailRowLink label='Email' href={`mailto:${contactEmail}`} value={contactEmail} />
        {contactPhone ? <DetailRowPhone phone={contactPhone} /> : null}
        <DetailRow label='Terms' value={paymentTerms} />
      </tbody>
    </table>
  );

  if (hideLabel) {
    return <div className={cn('px-3 py-1')}>{table}</div>;
  }

  return (
    <InboxContextRailSection label='Details' contentClassName={cn('px-3 py-1')}>
      {table}
    </InboxContextRailSection>
  );
}
