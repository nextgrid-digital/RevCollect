import type { AgentFollowUpStyle } from '../../types';
import { FOLLOW_UP_STYLE_SAMPLES, followUpStyleLabel } from '../lib/follow-up-style';

interface AgentFollowUpPreviewProps {
  style: AgentFollowUpStyle;
  signature?: string;
}

export function AgentFollowUpPreview({ style, signature }: AgentFollowUpPreviewProps) {
  const sample = FOLLOW_UP_STYLE_SAMPLES[style];
  const signOff = signature?.trim() ? signature.trim() : 'Accounts receivable';

  return (
    <div className='bg-muted/40 rounded-lg border px-4 py-3'>
      <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        Sample {followUpStyleLabel(style).toLowerCase()} reminder
      </p>
      <p className='mt-2 text-sm font-medium'>{sample.subject}</p>
      <p className='text-muted-foreground mt-2 whitespace-pre-line text-sm leading-relaxed'>
        {sample.body}
      </p>
      <p className='text-muted-foreground mt-2 whitespace-pre-line text-sm leading-relaxed'>
        {signOff}
      </p>
    </div>
  );
}
