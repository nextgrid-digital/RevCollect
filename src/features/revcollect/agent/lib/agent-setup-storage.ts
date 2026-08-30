export const AGENT_SETUP_DONE_STORAGE_KEY = 'revcollect:agent-setup-done';

export function readAgentSetupDone(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AGENT_SETUP_DONE_STORAGE_KEY) === 'true';
}

export function writeAgentSetupDone(done: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AGENT_SETUP_DONE_STORAGE_KEY, done ? 'true' : 'false');
}
