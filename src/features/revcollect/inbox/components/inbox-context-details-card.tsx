import { cn } from '@/lib/utils';
import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextDetailsCardProps {
  contactName: string;
  paymentTerms: string;
  hideLabel?: boolean;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className='border-border/60 border-b last:border-b-0'>
      <th scope='row' className='text-muted-foreground py-2 pr-3 text-left text-[11px] font-medium'>
        {label}
      </th>
      <td className='py-2 text-right text-sm font-medium'>{value}</td>
    </tr>
  );
}

export function InboxContextDetailsCard({
  contactName,
  paymentTerms,
  hideLabel = false
}: InboxContextDetailsCardProps) {
  const table = (
    <table className='w-full border-collapse'>
      <tbody>
        <DetailRow label='Contact' value={contactName} />
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
