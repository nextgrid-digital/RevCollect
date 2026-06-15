'use client';

import Link from 'next/link';
import { useAppForm } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PageHeader } from '../../components/page-header';
import { useAgentConfig } from '../../api/queries';
import type { AgentConfig } from '../../types';

function AgentConfigFormInner({ defaultAgentConfig }: { defaultAgentConfig: AgentConfig }) {
  const autoSendId = 'agent-auto-send';
  const form = useAppForm({
    defaultValues: defaultAgentConfig,
    onSubmit: async () => {
      toast.success('Agent settings saved (mock)');
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className='max-w-2xl space-y-6'
    >
      <Card>
        <CardHeader>
          <CardTitle>Collection agent</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <form.Field name='tone'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor='agent-tone'>Default tone</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as AgentConfig['tone'])}
                >
                  <SelectTrigger id='agent-tone'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='professional'>Professional</SelectItem>
                    <SelectItem value='friendly'>Friendly</SelectItem>
                    <SelectItem value='firm'>Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='autoSendEnabled'>
            {(field) => (
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <Label htmlFor={autoSendId}>Auto-send drafts</Label>
                  <p className='text-muted-foreground text-sm'>
                    Automatically send agent-approved drafts without manual review.
                  </p>
                </div>
                <Switch
                  id={autoSendId}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='escalationRules'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor='agent-escalation'>Escalation rules</Label>
                <Textarea
                  id='agent-escalation'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  placeholder='e.g. Escalate to finance after 60 days overdue or when customer disputes an invoice.'
                />
              </div>
            )}
          </form.Field>

          <form.Field name='signature'>
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor='agent-signature'>Email signature</Label>
                <Textarea
                  id='agent-signature'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      <Button type='submit'>Save settings</Button>
    </form>
  );
}

export function AgentConfigForm() {
  const { data: defaultAgentConfig, isPending } = useAgentConfig();

  if (isPending || !defaultAgentConfig) {
    return <p className='text-muted-foreground text-sm'>Loading agent settings…</p>;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Agent'
        description='Configure how RevCollect drafts collection emails. Per-thread tone and playbook can be adjusted in the inbox composer.'
        actions={
          <Button asChild variant='outline' size='sm'>
            <Link href='/settings'>Workspace settings</Link>
          </Button>
        }
      />
      <AgentConfigFormInner
        key={defaultAgentConfig.signature}
        defaultAgentConfig={defaultAgentConfig}
      />
    </div>
  );
}
