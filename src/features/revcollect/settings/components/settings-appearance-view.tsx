import { SettingsAppearanceSection } from './settings-appearance-section';
import { SettingsInboxLayoutSection } from './settings-inbox-layout-section';

export function SettingsAppearanceView() {
  return (
    <div className='divide-border divide-y'>
      <SettingsAppearanceSection />
      <SettingsInboxLayoutSection />
    </div>
  );
}
