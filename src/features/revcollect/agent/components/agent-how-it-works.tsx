import Link from 'next/link';
import { Icons } from '@/components/icons';

const STEPS = [
  {
    step: '1',
    title: 'Agent drafts overnight',
    description: 'Uses invoice age and the settings below to prepare follow-up emails.'
  },
  {
    step: '2',
    title: 'You review in Inbox',
    description: 'Drafts appear with an AI label so you can scan what needs attention.'
  },
  {
    step: '3',
    title: 'You edit and send',
    description: 'Your default tone and signature apply to every draft before you approve.'
  }
] as const;

export function AgentHowItWorks() {
  return (
    <section className='space-y-4' aria-labelledby='agent-how-it-works-heading'>
      <div>
        <h2 id='agent-how-it-works-heading' className='text-base font-semibold'>
          How it works
        </h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          <Link
            href='/inbox?filter=drafts'
            className='text-foreground hover:text-primary font-medium underline-offset-4 hover:underline'
          >
            See example drafts in Inbox
          </Link>
        </p>
      </div>
      <ol className='grid gap-3 sm:grid-cols-3'>
        {STEPS.map((item) => (
          <li key={item.step} className='bg-muted/30 flex flex-col gap-2 rounded-lg border p-4'>
            <span className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase'>
              <Icons.sparkles className='size-3.5 shrink-0' aria-hidden />
              Step {item.step}
            </span>
            <p className='text-sm font-medium'>{item.title}</p>
            <p className='text-muted-foreground text-sm leading-relaxed'>{item.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
