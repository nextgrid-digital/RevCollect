import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsAppearanceSection } from './settings-appearance-section';
import { SettingsPrivacySection } from './settings-privacy-section';

export function SettingsGeneralView() {
  return (
    <div className='space-y-6'>
      <Card>
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
            <Input id='workspace-email' defaultValue='collections@revcollect.app' disabled />
          </div>
          <p className='text-muted-foreground text-sm'>
            Workspace settings will sync from Supabase when connected.
          </p>
        </CardContent>
      </Card>

      <SettingsAppearanceSection />

      <SettingsPrivacySection />
    </div>
  );
}
