import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsAppearanceSection } from './settings-appearance-section';
import { SettingsInboxLayoutSection } from './settings-inbox-layout-section';
import { SettingsPrivacySection } from './settings-privacy-section';
import { SettingsSection } from './settings-section';

export function SettingsGeneralView() {
  return (
    <div className='divide-border divide-y'>
      <SettingsSection title='Workspace' className='pb-6'>
        <div className='space-y-4'>
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
        </div>
      </SettingsSection>

      <SettingsAppearanceSection />

      <SettingsInboxLayoutSection />

      <SettingsPrivacySection />
    </div>
  );
}
