import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsGeneralView() {
  return (
    <Card className='max-w-2xl'>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='workspace-name'>Workspace name</Label>
          <Input id='workspace-name' defaultValue='RevCollect' disabled />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='workspace-email'>Collections email</Label>
          <Input
            id='workspace-email'
            defaultValue='collections@revcollect.app'
            disabled
          />
        </div>
        <p className='text-muted-foreground text-sm'>
          Workspace settings will sync from Supabase when connected.
        </p>
      </CardContent>
    </Card>
  );
}
