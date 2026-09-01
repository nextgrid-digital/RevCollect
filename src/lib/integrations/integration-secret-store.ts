import { createAdminClient, hasSupabaseAdminEnv } from '@/lib/supabase/admin';
import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type IntegrationProvider = 'xero' | 'gmail';

const STORE_DIR = path.join(process.cwd(), '.data', 'integrations');

function filePath(provider: IntegrationProvider, tenantKey: string): string {
  return path.join(STORE_DIR, `${provider}-${tenantKey}.json`);
}

async function readFromFile<T>(
  provider: IntegrationProvider,
  tenantKey: string
): Promise<T | null> {
  try {
    const raw = await readFile(filePath(provider, tenantKey), 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeToFile<T>(
  provider: IntegrationProvider,
  tenantKey: string,
  value: T
): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(filePath(provider, tenantKey), JSON.stringify(value, null, 2), 'utf8');
}

async function deleteFromFile(provider: IntegrationProvider, tenantKey: string): Promise<void> {
  try {
    const { unlink } = await import('fs/promises');
    await unlink(filePath(provider, tenantKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function readFromSupabase<T>(
  provider: IntegrationProvider,
  tenantKey: string
): Promise<T | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('integration_secrets')
    .select('secret')
    .eq('tenant_key', tenantKey)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read ${provider} integration: ${error.message}`);
  }

  return (data?.secret as T | undefined) ?? null;
}

async function writeToSupabase<T>(
  provider: IntegrationProvider,
  tenantKey: string,
  value: T
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('integration_secrets').upsert(
    {
      tenant_key: tenantKey,
      provider,
      secret: value,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'tenant_key,provider' }
  );

  if (error) {
    throw new Error(`Failed to save ${provider} integration: ${error.message}`);
  }
}

async function deleteFromSupabase(provider: IntegrationProvider, tenantKey: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('integration_secrets')
    .delete()
    .eq('tenant_key', tenantKey)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to delete ${provider} integration: ${error.message}`);
  }
}

export async function readIntegrationSecret<T>(
  provider: IntegrationProvider,
  tenantKey: string
): Promise<T | null> {
  if (hasSupabaseAdminEnv()) {
    return readFromSupabase<T>(provider, tenantKey);
  }
  return readFromFile<T>(provider, tenantKey);
}

export async function writeIntegrationSecret<T>(
  provider: IntegrationProvider,
  tenantKey: string,
  value: T
): Promise<void> {
  if (hasSupabaseAdminEnv()) {
    await writeToSupabase(provider, tenantKey, value);
    return;
  }
  await writeToFile(provider, tenantKey, value);
}

export async function deleteIntegrationSecret(
  provider: IntegrationProvider,
  tenantKey: string
): Promise<void> {
  if (hasSupabaseAdminEnv()) {
    await deleteFromSupabase(provider, tenantKey);
  }
  await deleteFromFile(provider, tenantKey);
}

export async function copyIntegrationSecret(
  provider: IntegrationProvider,
  fromTenantKey: string,
  toTenantKey: string
): Promise<void> {
  if (fromTenantKey === toTenantKey) return;
  const existing = await readIntegrationSecret<unknown>(provider, toTenantKey);
  if (existing) return;
  const source = await readIntegrationSecret<unknown>(provider, fromTenantKey);
  if (!source) return;
  await writeIntegrationSecret(provider, toTenantKey, source);
}

async function listFromSupabase(provider: IntegrationProvider): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('integration_secrets')
    .select('tenant_key')
    .eq('provider', provider);

  if (error) {
    console.error(`[integrations] list ${provider} tenant keys failed:`, error.message);
    return [];
  }

  return [...new Set((data ?? []).map((row) => row.tenant_key).filter(Boolean))];
}

async function listFromFile(provider: IntegrationProvider): Promise<string[]> {
  const prefix = `${provider}-`;
  try {
    const names = await readdir(STORE_DIR);
    return names
      .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))
      .map((name) => name.slice(prefix.length, -'.json'.length));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function listProviderTenantKeys(provider: IntegrationProvider): Promise<string[]> {
  if (hasSupabaseAdminEnv()) {
    return listFromSupabase(provider);
  }
  return listFromFile(provider);
}
