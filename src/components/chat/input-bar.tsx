'use client';

import {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  type ChangeEvent,
  type ReactNode,
  type KeyboardEvent,
  type MouseEvent
} from 'react';
import { cn } from '@/lib/utils';

export type ChatStatus = 'ready' | 'streaming' | 'submitted' | 'idle';

export type AttachedImage = {
  id: string;
  filename: string;
  url: string;
  size?: number;
};

export type AttachedFile = {
  id: string;
  filename: string;
  size?: number;
};

export type InputBarProps = {
  onSend?: (message: { role: 'user'; content: string }) => void;
  onStop?: () => void;
  status?: ChatStatus;
  placeholder?: string;
  className?: string;
  onAttach?: () => void;
  attachedImages?: AttachedImage[];
  attachedFiles?: AttachedFile[];
  onRemoveImage?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  /** When true, expands to the full width of the parent (default max 420px centered). */
  fillWidth?: boolean;
  /** Max textarea height in px before internal scroll. Default 280. */
  maxTextareaHeight?: number;
  /** When true, hides the textarea while keeping the action toolbar visible. */
  bodyCollapsed?: boolean;
};

const PaperclipIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48' />
  </svg>
);

const SendIcon = ({ className = 'w-[14px] h-[14px]' }) => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <line x1='12' y1='19' x2='12' y2='5' />
    <polyline points='5 12 12 5 19 12' />
  </svg>
);

const StopIcon = ({ className = 'w-[12px] h-[12px]' }) => (
  <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor' className={className}>
    <rect x='6' y='6' width='12' height='12' rx='1' />
  </svg>
);

const XIcon = ({ className = 'w-3 h-3' }) => (
  <svg
    width='12'
    height='12'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </svg>
);

const FileIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' />
    <polyline points='14 2 14 8 20 8' />
  </svg>
);

function AttachmentButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label='Attach'
      className='inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800'
    >
      <PaperclipIcon />
    </button>
  );
}

function SendButton({
  state,
  onClick
}: {
  state: 'idle' | 'typing' | 'streaming';
  onClick: () => void;
}) {
  const isStreaming = state === 'streaming';
  const isActive = state === 'typing' || isStreaming;
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={isStreaming ? 'Stop' : 'Send'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
        isActive
          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600'
      )}
    >
      {isStreaming ? <StopIcon /> : <SendIcon />}
    </button>
  );
}

function ImageChip({ url, onRemove }: { url: string; onRemove?: () => void }) {
  return (
    <div className='group relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800'>
      <img src={url} alt='' className='h-full w-full object-cover' />
      {onRemove ? (
        <button
          type='button'
          onClick={onRemove}
          aria-label='Remove image'
          className='absolute top-0.5 right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100'
        >
          <XIcon className='h-2.5 w-2.5' />
        </button>
      ) : null}
    </div>
  );
}

function FileChip({
  filename,
  size,
  onRemove
}: {
  filename: string;
  size?: number;
  onRemove?: () => void;
}) {
  const sizeText =
    size === undefined
      ? null
      : size < 1024
        ? `${size} B`
        : size < 1024 * 1024
          ? `${(size / 1024).toFixed(1)} KB`
          : `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return (
    <div className='group inline-flex items-center gap-2 rounded-md bg-neutral-100 px-2 py-1.5 dark:bg-neutral-800'>
      <span className='text-neutral-500 dark:text-neutral-400'>
        <FileIcon />
      </span>
      <div className='flex min-w-0 flex-col'>
        <span className='max-w-[140px] truncate text-xs font-medium text-neutral-900 dark:text-neutral-100'>
          {filename}
        </span>
        {sizeText ? (
          <span className='text-[10px] text-neutral-500 dark:text-neutral-400'>{sizeText}</span>
        ) : null}
      </div>
      {onRemove ? (
        <button
          type='button'
          onClick={onRemove}
          aria-label='Remove file'
          className='inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700'
        >
          <XIcon />
        </button>
      ) : null}
    </div>
  );
}

export const InputBar = memo(function InputBar({
  onSend,
  onStop,
  status = 'ready',
  placeholder = 'Send a message...',
  className,
  onAttach,
  attachedImages = [],
  attachedFiles = [],
  onRemoveImage,
  onRemoveFile,
  value: controlledValue,
  onChange: controlledOnChange,
  disabled,
  autoFocus,
  leftActions,
  rightActions,
  fillWidth = false,
  maxTextareaHeight = 280,
  bodyCollapsed = false
}: InputBarProps) {
  const [internalInput, setInternalInput] = useState('');
  const isControlled = controlledValue !== undefined;
  const input = isControlled ? controlledValue : internalInput;
  const setInput = useCallback(
    (v: string) => {
      if (isControlled) controlledOnChange?.(v);
      else setInternalInput(v);
    },
    [isControlled, controlledOnChange]
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === 'streaming' || status === 'submitted';
  const hasInput = input.trim().length > 0;
  const hasContextItems = attachedImages.length > 0 || attachedFiles.length > 0;

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scroll = el.scrollHeight;
    const next = Math.min(scroll, maxTextareaHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = scroll > maxTextareaHeight ? 'auto' : 'hidden';
  }, [maxTextareaHeight]);

  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [input, hasContextItems, syncTextareaHeight]);

  useEffect(() => {
    if (!autoFocus) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    });
  }, [autoFocus]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend?.({ role: 'user', content: trimmed });
    setInput('');
  }, [input, isStreaming, disabled, onSend, setInput]);

  const handleInput = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      setInput(el.value);
      el.style.height = 'auto';
      const scroll = el.scrollHeight;
      const next = Math.min(scroll, maxTextareaHeight);
      el.style.height = `${next}px`;
      el.style.overflowY = scroll > maxTextareaHeight ? 'auto' : 'hidden';
    },
    [setInput, maxTextareaHeight]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleContainerClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button, textarea')) {
      textareaRef.current?.focus();
    }
  }, []);

  const sendState: 'idle' | 'typing' | 'streaming' = isStreaming
    ? 'streaming'
    : hasInput && !disabled
      ? 'typing'
      : 'idle';

  return (
    <div className={cn('w-full shrink-0 px-3 pb-3', className)}>
      <div className={cn(fillWidth ? 'w-full' : 'mx-auto max-w-[420px]')}>
        <div
          className='relative cursor-text rounded-[16px] bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'
          onClick={handleContainerClick}
        >
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-out',
              hasContextItems ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className='overflow-hidden'>
              {hasContextItems ? (
                <div className='flex flex-wrap items-center gap-1.5 px-2.5 pt-2.5 pb-0.5'>
                  {attachedImages.map((img) => (
                    <ImageChip
                      key={img.id}
                      url={img.url}
                      onRemove={onRemoveImage ? () => onRemoveImage(img.id) : undefined}
                    />
                  ))}
                  {attachedFiles.map((file) => (
                    <FileChip
                      key={file.id}
                      filename={file.filename}
                      size={file.size}
                      onRemove={onRemoveFile ? () => onRemoveFile(file.id) : undefined}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-out',
              bodyCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
            )}
          >
            <div className='overflow-hidden'>
              <div className='pt-3 pr-3 pb-2 pl-3.5'>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={1}
                  className={cn(
                    'block w-full min-h-[1.6em] resize-none border-0 bg-transparent p-0 text-[14px] leading-[1.6] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500',
                    'overflow-hidden',
                    disabled && 'cursor-not-allowed opacity-50'
                  )}
                />
              </div>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center justify-between gap-3 px-2 pb-2',
              bodyCollapsed ? 'pt-2' : 'pt-1'
            )}
          >
            <div className='flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-0.5'>
              {onAttach ? <AttachmentButton onClick={onAttach} disabled={disabled} /> : null}
              {leftActions}
            </div>
            <div className='flex shrink-0 items-center gap-1'>
              {rightActions}
              <SendButton
                state={sendState}
                onClick={() => {
                  if (isStreaming) onStop?.();
                  else if (hasInput) handleSubmit();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InputBar;
