import { InboxContextRailSection } from './inbox-context-rail-section';

interface InboxContextDetailsCardProps {
  contactName: string;
  paymentTerms: string;
  followUpsSent: number;
  source: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3 py-1.5 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='text-right font-medium'>{value}</span>
    </div>
  );
}

export function InboxContextDetailsCard({
  contactName,
  paymentTerms,
  followUpsSent,
  source
}: InboxContextDetailsCardProps) {
  return (
    <InboxContextRailSection label='Details' contentClassName='px-4 py-2'>
      <DetailRow label='Contact' value={contactName} />
      <DetailRow label='Terms' value={paymentTerms} />
      <DetailRow label='Follow-ups' value={`${followUpsSent} sent`} />
      <DetailRow label='Source' value={source} />
    </InboxContextRailSection>
  );
}
