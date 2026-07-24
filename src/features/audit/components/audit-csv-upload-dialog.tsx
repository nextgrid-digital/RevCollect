'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { AUDIT_ERRORS, AUDIT_UPLOAD } from '@/features/audit/lib/ui-copy';
import { cn } from '@/lib/utils';

interface AuditCsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onFileAccepted: (file: File) => void;
}

const ACCEPT = {
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'application/vnd.ms-excel': ['.xls', '.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
} as const;

export function AuditCsvUploadDialog({
  open,
  onOpenChange,
  isPending,
  onFileAccepted
}: AuditCsvUploadDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setLocalError(null);
      if (rejected.length > 0) {
        setLocalError(AUDIT_ERRORS.wrongType);
        return;
      }
      const file = accepted[0];
      if (!file) return;
      onFileAccepted(file);
      onOpenChange(false);
    },
    [onFileAccepted, onOpenChange]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker
  } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isPending,
    accept: ACCEPT,
    noClick: true,
    noKeyboard: true
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setLocalError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className='audit-shell gap-5 border-[var(--audit-rule)] bg-[var(--audit-canvas)] sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='font-audit-serif text-audit-ink text-2xl font-normal'>
            {AUDIT_UPLOAD.title}
          </DialogTitle>
          <DialogDescription className='font-audit-sans text-audit-charcoal text-[14px]'>
            {AUDIT_UPLOAD.formats}
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={cn(
            'audit-panel-keylime flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-[var(--audit-rule)] px-6 py-10 text-center transition-colors',
            isDragActive && 'border-[var(--audit-ink)] bg-[var(--audit-mint)]',
            isPending && 'pointer-events-none opacity-60'
          )}
          onClick={() => openFilePicker()}
        >
          <input {...getInputProps()} />
          <Icons.upload className='text-audit-ink size-8' />
          <p className='font-audit-sans text-audit-ink text-[14px] font-medium'>
            {isDragActive ? AUDIT_UPLOAD.zoneActive : AUDIT_UPLOAD.zoneLabel}
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <p className='font-audit-sans text-audit-charcoal text-[13px] leading-[1.5]'>
            {AUDIT_UPLOAD.columnsHelper}
          </p>
          <p className='font-audit-sans text-audit-muted text-[12px] leading-[1.5]'>
            {AUDIT_UPLOAD.privacy}
          </p>
        </div>

        {localError ? (
          <p className='font-audit-sans text-[14px] text-[var(--audit-forest-shadow)]'>
            {localError}
          </p>
        ) : null}

        <DialogFooter className='gap-2 sm:justify-between'>
          <Button
            type='button'
            className='audit-btn-outline'
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            className='audit-btn-forest'
            disabled={isPending}
            onClick={() => openFilePicker()}
          >
            Choose file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
