import { StatCard } from '../../components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsBillingView() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <StatCard title='Plan' value='Growth' description='Billed monthly' />
        <StatCard title='Seats' value='3' description='2 active users' />
        <StatCard title='AI drafts' value='248' description='This billing period' />
      </div>
      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Stripe is connected. Billing management will be available when Supabase auth is
            wired up.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
