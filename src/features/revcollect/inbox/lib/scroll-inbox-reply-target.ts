interface ScrollInboxReplyTargetOptions {
  behavior?: ScrollBehavior;
}

function hasAgentDraftPanel(): boolean {
  return Boolean(document.getElementById('agent-draft-panel'));
}

export function scrollInboxThreadToBottom(
  container: HTMLElement,
  behavior: ScrollBehavior = 'auto'
): void {
  const top = Math.max(0, container.scrollHeight - container.clientHeight);
  if (behavior === 'smooth') {
    container.scrollTo({ top, behavior });
  } else {
    container.scrollTop = top;
  }
}

function getElementScrollBounds(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const scrollMarginTop = parseFloat(style.scrollMarginTop) || 0;
  const scrollMarginBottom = parseFloat(style.scrollMarginBottom) || 0;

  const top = elementRect.top - containerRect.top + container.scrollTop - scrollMarginTop;
  const height = element.offsetHeight + scrollMarginTop + scrollMarginBottom;

  return { top, bottom: top + height };
}

export function scrollInboxThreadEmailIntoView(
  container: HTMLElement,
  emailId: string,
  options: { behavior?: ScrollBehavior; block?: 'start' | 'center' | 'end' } = {}
): void {
  const { behavior = 'auto', block = 'start' } = options;
  const target = container.querySelector(
    `[data-thread-email-id="${emailId}"]`
  ) as HTMLElement | null;
  if (!target) return;

  const { top, bottom } = getElementScrollBounds(container, target);
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);

  let nextScrollTop: number;
  switch (block) {
    case 'end':
      nextScrollTop = bottom - container.clientHeight;
      break;
    case 'center':
      nextScrollTop = top - (container.clientHeight - target.offsetHeight) / 2;
      break;
    case 'start':
    default:
      nextScrollTop = top;
      break;
  }

  nextScrollTop = Math.max(0, Math.min(nextScrollTop, maxScroll));

  if (behavior === 'smooth') {
    container.scrollTo({ top: nextScrollTop, behavior });
  } else {
    container.scrollTop = nextScrollTop;
  }
}

export function scrollInboxThreadToBottomAfterLayout(
  container: HTMLElement,
  options: ScrollInboxReplyTargetOptions = {}
): Promise<boolean> {
  const { behavior = 'auto' } = options;
  const scrolledToDraft = hasAgentDraftPanel();

  return new Promise((resolve) => {
    let resizeObserver: ResizeObserver | null = null;
    let settleTimer: ReturnType<typeof setTimeout>;

    const scroll = () => scrollInboxThreadToBottom(container, behavior);

    const finish = () => {
      resizeObserver?.disconnect();
      clearTimeout(settleTimer);
      scroll();
      resolve(scrolledToDraft);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scroll();

        resizeObserver = new ResizeObserver(() => {
          scroll();
        });
        resizeObserver.observe(container);

        settleTimer = setTimeout(finish, 500);
      });
    });
  });
}

export function findInboxThreadScrollContainer(from?: HTMLElement | null): HTMLElement | null {
  const anchor =
    from ??
    document.getElementById('agent-draft-panel') ??
    document.getElementById('inbox-thread-composer');
  const pane = anchor?.closest('[data-inbox-thread-pane]');
  const scroller = pane?.querySelector('[data-inbox-thread-scroll]');
  return scroller instanceof HTMLElement ? scroller : null;
}

export function scrollInboxReplyTargetIntoView(
  options: ScrollInboxReplyTargetOptions & { container?: HTMLElement | null } = {}
): boolean {
  const container = options.container ?? findInboxThreadScrollContainer();
  if (container) {
    scrollInboxThreadToBottom(container, options.behavior ?? 'auto');
  }
  return hasAgentDraftPanel();
}

export function scrollInboxReplyTargetAfterLayout(
  options: ScrollInboxReplyTargetOptions & { container?: HTMLElement | null } = {}
): Promise<boolean> {
  const container = options.container ?? findInboxThreadScrollContainer();
  if (container) {
    return scrollInboxThreadToBottomAfterLayout(container, options);
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve(scrollInboxReplyTargetIntoView(options));
      });
    });
  });
}
