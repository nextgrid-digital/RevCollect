import { MetricBlock } from '../../components/metric-block';
import { SettingsSection } from './settings-section';

const billingStats = [
  { title: 'Plan', value: 'Growth', description: 'Billed monthly' },
  { title: 'Seats', value: '3', description: '2 active users' },
  { title: 'AI drafts', value: '248', description: 'This billing period' }
] as const;

export function SettingsBillingView() {
  return (
    <div className='divide-border divide-y'>
      <div className='grid gap-6 pb-6 sm:grid-cols-3'>
        {billingStats.map((stat) => (
          <MetricBlock
            key={stat.title}
            label={stat.title}
            value={stat.value}
            description={<p className='text-muted-foreground text-xs'>{stat.description}</p>}
          />
        ))}
      </div>

      <SettingsSection title='Payment method' className='pt-6'>
        <p className='text-muted-foreground text-sm'>
          Stripe is connected. Billing management will be available when Supabase auth is wired up.
        </p>
      </SettingsSection>
    </div>
  );
}
