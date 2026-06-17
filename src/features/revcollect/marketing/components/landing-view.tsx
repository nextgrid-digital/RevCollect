import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { WaitlistForm } from './waitlist-form';

const modes = [
  {
    icon: Icons.inbox,
    title: 'Core',
    badge: 'Included',
    description:
      'Open invoices, see full customer context, and follow up on your terms. Request an AI draft at the moment of action — or write your own. Core works fully without the agent.'
  },
  {
    icon: Icons.agent,
    title: 'Collections Agent add-on',
    badge: 'Optional',
    description:
      'Watches invoice state, email replies, promised dates, risk thresholds, and customer behavior. Prepares drafts, digests, alerts, and recommendations before you ask. Never auto-sends.'
  }
] as const;

const contextPillars = [
  {
    icon: Icons.teams,
    title: 'Customer context',
    description:
      'Full thread and invoice history at the point of action. Tone, promises, and risk surfaced in context — not as separate feature buttons.'
  },
  {
    icon: Icons.inbox,
    title: 'Collections inbox',
    description:
      'One place for customer replies, overdue status, and next actions — without scattered email threads.'
  },
  {
    icon: Icons.aging,
    title: 'Aging & risk',
    description:
      'See AR by bucket and per-customer risk so your team prioritizes the right accounts first.'
  },
  {
    icon: Icons.integrations,
    title: 'QuickBooks & Gmail',
    description:
      'Connect accounting and email to sync open invoices and send from your real mailbox — no duplicate data entry.'
  }
] as const;

const steps = [
  {
    step: '01',
    title: 'Connect when invited',
    description:
      'Link QuickBooks and Gmail in minutes. Open invoices and threads flow into RevCollect automatically.'
  },
  {
    step: '02',
    title: 'Work in Core',
    description:
      'Review invoices and customer context. Draft or send follow-ups when you are ready — on your schedule.'
  },
  {
    step: '03',
    title: 'Enable the agent',
    description:
      'Optionally turn on the Collections Agent add-on. It prepares work overnight; you approve every send from Inbox.'
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
            Early access · Context-rich collections
          </p>
          <h1 className='text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl'>
            Collections workflow with context at every step
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl'>
            RevCollect gives finance teams one inbox, full customer context, and on-demand AI drafts
            — with an optional agent that prepares next actions before you ask. You approve every
            message before it reaches a customer.
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

      <section id='product' className='border-border/60 border-t px-4 py-20 sm:px-6'>
        <div className='mx-auto max-w-6xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-foreground text-3xl font-semibold tracking-tight'>
              Two ways to work
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              Core handles collections on its own. The agent add-on reduces work by preparing the
              right action — you still approve every send.
            </p>
          </div>
          <ul className='mt-14 grid gap-6 md:grid-cols-2'>
            {modes.map((mode) => {
              const Icon = mode.icon;
              return (
                <li
                  key={mode.title}
                  className='bg-card border-border/60 rounded-2xl border p-6 shadow-sm'
                >
                  <div className='mb-4 flex items-center justify-between gap-3'>
                    <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
                      <Icon className='size-5' />
                    </div>
                    <span className='bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-medium'>
                      {mode.badge}
                    </span>
                  </div>
                  <h3 className='text-foreground text-lg font-semibold'>{mode.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {mode.description}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className='text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed'>
            Set up the agent in about 2 minutes — risk thresholds, follow-up tone, customer
            overrides, and behavior toggles. No automation builder.
          </p>
        </div>
      </section>

      <section id='features' className='border-border/60 bg-muted/30 border-t px-4 py-20 sm:px-6'>
        <div className='mx-auto max-w-6xl'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-foreground text-3xl font-semibold tracking-tight'>
              Context, not more buttons
            </h2>
            <p className='text-muted-foreground mt-4 text-lg'>
              Promise tracking, tone, and escalation are communication-context problems — surfaced
              where you act, not as standalone features.
            </p>
          </div>
          <ul className='mt-14 grid gap-6 sm:grid-cols-2'>
            {contextPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.title}
                  className='bg-card border-border/60 rounded-2xl border p-6 shadow-sm'
                >
                  <div className='bg-primary/10 text-primary mb-4 flex size-10 items-center justify-center rounded-lg'>
                    <Icon className='size-5' />
                  </div>
                  <h3 className='text-foreground text-lg font-semibold'>{pillar.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                    {pillar.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id='how-it-works' className='border-border/60 border-t px-4 py-20 sm:px-6'>
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

      <section className='border-border/60 bg-muted/30 border-t px-4 py-12 sm:px-6'>
        <div className='mx-auto flex max-w-3xl flex-col items-center gap-4 text-center'>
          <div className='text-primary flex items-center gap-2'>
            <Icons.checks className='size-5 shrink-0' aria-hidden />
            <p className='text-foreground text-sm font-medium'>
              You approve every message before it reaches a customer
            </p>
          </div>
          <div className='text-primary flex items-center gap-2'>
            <Icons.lock className='size-5 shrink-0' aria-hidden />
            <p className='text-muted-foreground text-sm leading-relaxed'>
              Customer intelligence stays in your workspace — inference only, never used to train
              models.{' '}
              <Link href='/security' className='text-primary font-medium hover:underline'>
                Security practices
              </Link>
            </p>
          </div>
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
