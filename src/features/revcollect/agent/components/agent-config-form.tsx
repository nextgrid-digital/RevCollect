'use client';

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
import { agentConfig as defaultAgentConfig } from '../../mock-data';
import type { AgentConfig } from '../../types';

export function AgentConfigForm() {
  const form = useAppForm({
    defaultValues: defaultAgentConfig as AgentConfig,
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
                <Label>Tone</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as AgentConfig['tone'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select tone' />
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
                  <Label>Auto-send drafts</Label>
                  <p className='text-muted-foreground text-sm'>
                    Send AI drafts without manual approval (not recommended).
                  </p>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='escalationRules'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Escalation rules</Label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className='min-h-[100px]'
                />
              </div>
            )}
          </form.Field>

          <form.Field name='signature'>
            {(field) => (
              <div className='space-y-2'>
                <Label>Email signature</Label>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className='min-h-[80px]'
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
