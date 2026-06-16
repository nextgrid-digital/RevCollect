import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from './waitlist-form';

const features = [
  {
    icon: Icons.inbox,
    title: 'Collections inbox',
    description:
      'Review customer replies, filter by overdue or dispute status, and act from one thread view with full customer context.'
  },
  {
    icon: Icons.sparkles,
    title: 'AI-drafted follow-ups',
    description:
      'RevCollect drafts collection emails overnight. You review, edit tone and playbook, then send — nothing goes out without approval.'
  },
  {
    icon: Icons.aging,
    title: 'Aging & risk',
    description:
      'See AR by bucket, weighted DSO, and per-customer risk so your team prioritizes the right accounts first.'
  },
  {
    icon: Icons.agent,
    title: 'Configurable agent',
    description:
      'Set default tone, escalation rules, and signature once. Per-thread overrides stay in the composer when you need them.'
  },
  {
    icon: Icons.integrations,
    title: 'QuickBooks & Gmail',
    description:
      'Connect accounting and email to sync open invoices and send from your real mailbox — no duplicate data entry.'
  },
  {
    icon: Icons.badgeCheck,
    title: 'Built for finance teams',
    description:
      'Tenant isolation, access logging, and encryption designed for bookkeepers handling sensitive client AR.'
  }
] as const;

const steps = [
  {
    step: '01',
    title: 'Join the waitlist',
    description:
      "Tell us you're on a finance or bookkeeping team. We'll invite firms in batches as we expand access."
  },
  {
    step: '02',
    title: 'Connect when invited',
    description:
      'Link QuickBooks and Gmail in minutes. Open invoices and threads flow into RevCollect automatically.'
  },
  {
    step: '03',
    title: 'Review drafts & collect',
    description:
      'The agent prepares follow-ups overnight. You approve, send, and track aging until cash is in the bank.'
  }
] as const;

export function LandingView() {
  return (
    <>
      <section className='relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28'>
        <div
          className='pointer-events-none absolute inset-0 -z-10 opacity-40'
          aria-hidden
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--primary), transparent)'
          }}
        />
        <div className='mx-auto max-w-4xl text-center'>
          <p className='text-primary mb-4 text-sm font-medium tracking-wide uppercase'>
            Early access · AI-powered AR
          </p>
          <h1 className='text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
            Collect faster without chasing invoices
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl'>
            RevCollect turns overdue AR into a managed workflow: one inbox for customer replies,
            AI-drafted follow-ups you control, and aging reports your team actually uses.
          </p>
          <div className='mx-auto mt-10 flex max-w-lg flex-col items-center gap-4'>
            <WaitlistForm compact idPrefix='hero' />
            <Button asChild variant='link' className='text-muted-foreground h-auto p-0 text-sm'>
              <Link href='/inbox'>Or explore the interactive demo →</Link>
            </Button>
          </div>
          <p className='text-muted-foreground mt-4 text-sm'>
            Private beta · Bookkeepers and finance teams only
          </p>
        </div>
      </section>

      <section id='features' className='border-border/60 border-t px-4 py-20 sm:px-6'>
        <div className='mx-auto max-w-6xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-foreground text-3xl font-semibold tracking-tight'>
              Everything finance teams need to run collections
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              From first overdue notice to dispute resolution — without spreadsheets or scattered
              email threads.
            </p>
          </div>
          <ul className='mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className='bg-card border-border/60 rounded-2xl border p-6 shadow-sm'
                >
                  <div className='bg-primary/10 text-primary mb-4 flex size-10 items-center justify-center rounded-lg'>
                    <Icon className='size-5' />
                  </div>
                  <h3 className='text-foreground text-lg font-semibold'>{feature.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        id='how-it-works'
        className='border-border/60 bg-muted/30 border-t px-4 py-20 sm:px-6'
      >
        <div className='mx-auto max-w-6xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-foreground text-3xl font-semibold tracking-tight'>How it works</h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              We&apos;re onboarding firms gradually while we polish the product.
            </p>
          </div>
          <ol className='mt-14 grid gap-8 md:grid-cols-3'>
            {steps.map((item) => (
              <li key={item.step} className='relative'>
                <span className='text-primary/30 text-5xl font-bold tabular-nums'>{item.step}</span>
                <h3 className='text-foreground mt-2 text-xl font-semibold'>{item.title}</h3>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='border-border/60 border-t px-4 py-20 sm:px-6'>
        <div className='bg-primary text-primary-foreground mx-auto max-w-4xl rounded-3xl px-8 py-14 text-center sm:px-12'>
          <h2 className='text-3xl font-semibold tracking-tight text-balance sm:text-4xl'>
            Get early access to RevCollect
          </h2>
          <p className='text-primary-foreground/80 mx-auto mt-4 max-w-xl text-lg'>
            Join the waitlist and we&apos;ll reach out when your workspace is ready.
          </p>
          <div className='mx-auto mt-8 flex max-w-md justify-center'>
            <Button asChild size='lg' variant='secondary' className='w-full sm:w-auto'>
              <Link href='/waitlist'>Join waitlist</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
