interface ScrollInboxReplyTargetOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
}

export function scrollInboxReplyTargetIntoView(
  options: ScrollInboxReplyTargetOptions = {}
): boolean {
  const { behavior = 'auto', block = 'end' } = options;

  const draftPanel = document.getElementById('agent-draft-panel');
  if (draftPanel) {
    draftPanel.scrollIntoView({ behavior, block });
    return true;
  }

  document.getElementById('inbox-thread-composer')?.scrollIntoView({ behavior, block });
  return false;
}

export function scrollInboxReplyTargetAfterLayout(
  options?: ScrollInboxReplyTargetOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve(scrollInboxReplyTargetIntoView(options));
      });
    });
  });
}
