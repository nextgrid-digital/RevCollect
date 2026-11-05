/** Private test page. Production builds leave this unset. */
export function isPlaygroundEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLAYGROUND_ENABLED === 'true';
}
