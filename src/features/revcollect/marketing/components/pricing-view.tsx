import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const plans = [
  {
    name: 'Early access',
    price: 'Free during beta',
    description: 'Core collections workflow for waitlist firms invited to the private beta.',
    features: [
      'Collections inbox and customer context',
      'Aging report and risk view',
      'On-demand AI draft generation',
      'QuickBooks & Gmail connections',
      'Up to 3 team seats'
    ],
    highlighted: true
  },
  {
    name: 'Agent add-on',
    price: 'Coming soon',
    description: 'Proactive collections operator that prepares work for your approval.',
    features: [
      'Everything in Early access',
      'Collections Agent add-on (proactive drafts, digests, alerts)',
      'Risk thresholds and customer overrides',
      'Advanced escalation rules',
      'Priority support'
    ],
    highlighted: false
  }
] as const;

export function PricingView() {
  return (
    <div className='mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24'>
      <div className='mx-auto max-w-2xl text-center'>
        <p className='text-primary text-sm font-medium tracking-wide uppercase'>Pricing</p>
        <h1 className='text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl'>
          Simple pricing when we launch
        </h1>
        <p className='text-muted-foreground mt-4 text-lg leading-relaxed'>
          Join the waitlist for free early access. Paid plans will be straightforward — per firm,
          not per email sent.
        </p>
      </div>

      <div className='mt-14 grid gap-6 md:grid-cols-2'>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.highlighted
                ? 'bg-card border-primary/40 relative rounded-2xl border-2 p-8 shadow-sm'
                : 'bg-card border-border/60 rounded-2xl border p-8 shadow-sm'
            }
          >
            {plan.highlighted ? (
              <span className='bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-medium'>
                Waitlist
              </span>
            ) : null}
            <h2 className='text-foreground text-xl font-semibold'>{plan.name}</h2>
            <p className='text-foreground mt-2 text-2xl font-semibold tabular-nums'>{plan.price}</p>
            <p className='text-muted-foreground mt-2 text-sm'>{plan.description}</p>
            <ul className='mt-6 space-y-3'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex gap-2 text-sm'>
                  <Icons.badgeCheck className='text-primary mt-0.5 size-4 shrink-0' />
                  <span className='text-muted-foreground'>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.highlighted ? (
              <Button asChild className='mt-8 w-full'>
                <Link href='/waitlist'>Join waitlist</Link>
              </Button>
            ) : (
              <Button variant='outline' className='mt-8 w-full' disabled>
                Available after launch
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className='text-muted-foreground mx-auto mt-10 max-w-xl text-center text-sm leading-relaxed'>
        Core works on its own. The Agent add-on is optional and prepares work for your approval — it
        never sends automatically.
      </p>

      <p className='text-muted-foreground mt-6 text-center text-sm'>
        Questions about firm pricing?{' '}
        <a href='mailto:nextgrid.digital@gmail.com' className='text-primary hover:underline'>
          Email us
        </a>
      </p>
    </div>
  );
}
