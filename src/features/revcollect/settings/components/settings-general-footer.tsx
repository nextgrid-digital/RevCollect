'use client';

import { Button } from '@/components/ui/button';

interface SettingsGeneralFooterProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function SettingsGeneralFooter({
  hasUnsavedChanges,
  isSaving,
  canSave,
  onCancel,
  onSave
}: SettingsGeneralFooterProps) {
  return (
    <div className='border-border/60 bg-background/95 sticky bottom-0 mt-6 border-t py-4 backdrop-blur-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
        {hasUnsavedChanges ? (
          <p className='text-muted-foreground mr-auto text-sm'>You have unsaved changes.</p>
        ) : null}
        <div className='flex shrink-0 items-center gap-2'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type='button'
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges || !canSave}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
