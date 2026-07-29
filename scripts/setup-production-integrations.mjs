#!/usr/bin/env node
/**
 * Verify production integration prerequisites.
 * Usage: node scripts/setup-production-integrations.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_VERCEL_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_REV_COLLECT_DATA_SOURCE',
  'XERO_CLIENT_ID',
  'XERO_CLIENT_SECRET',
  'XERO_OAUTH_REDIRECT_URI',
  'EMAIL_ENCRYPTION_KEY',
  'SUPABASE_SECRET_KEY'
];

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return {};

  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const local = loadEnvLocal();
const missingLocal = REQUIRED_VERCEL_VARS.filter((key) => !local[key]);

console.log('RevCollect integration setup checklist\n');

console.log('1. Supabase migration');
console.log('   integration_secrets table should exist in project ejcfsuhejbsvnxktjjae');
console.log('   (already applied if you ran this after the agent setup)\n');

console.log('2. Local .env.local');
if (missingLocal.length === 0) {
  console.log('   OK — all required keys present locally\n');
} else {
  console.log('   Missing locally:');
  for (const key of missingLocal) {
    console.log(`   - ${key}`);
  }
  if (missingLocal.includes('SUPABASE_SECRET_KEY')) {
    console.log('\n   Get SUPABASE_SECRET_KEY from:');
    console.log('   Supabase → Project Settings → API → service_role (secret)\n');
  }
}

console.log('3. Vercel production env');
console.log('   Run: vercel env ls');
console.log('   Ensure SUPABASE_SECRET_KEY is set for Production');
console.log('   Add with:');
console.log(
  '   vercel env add SUPABASE_SECRET_KEY production'
);
console.log('   Then redeploy: vercel --prod\n');

console.log('4. Reconnect Xero on production');
console.log('   https://app.revcollect.ai/onboarding/connect-xero\n');

console.log('5. Cursor Xero MCP');
console.log('   Config: .cursor/mcp.json (gitignored)');
console.log('   Restart Cursor → Settings → MCP → enable xero server');
console.log('   For MCP, create a Xero Custom Connection if OAuth web app creds fail.\n');
