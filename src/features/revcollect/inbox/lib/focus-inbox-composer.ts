export function focusInboxComposer(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        '#inbox-thread-composer textarea:not(:disabled)'
      );
      textarea?.focus();
    });
  });
}
