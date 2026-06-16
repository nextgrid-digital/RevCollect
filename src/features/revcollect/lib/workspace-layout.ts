/** Shared layout classes for list + detail workspaces (inbox, customers, settings nav, etc.). */
export const workspaceListWidth = 'w-[22rem] shrink-0';
export const workspaceContextWidth = 'w-72 shrink-0';
export const workspaceCenterMaxWidth = 'mx-auto w-full max-w-3xl';
export const workspaceCanvasPadding = 'px-4 py-3 md:px-6 md:py-4';
export const workspaceCard = 'bg-card rounded-2xl border border-border/60';
export const workspaceContextCardSticky = 'sticky top-4 max-h-[calc(100%-1rem)] min-h-0';
export const workspaceListCard = [
  workspaceCard,
  workspaceContextCardSticky,
  'bg-sidebar text-sidebar-foreground flex min-h-0 flex-col'
].join(' ');
