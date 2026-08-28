import { createClient } from '@supabase/supabase-js';
import { eveChannel } from 'eve/channels/eve';
import { localDev, vercelOidc, type AuthFn } from 'eve/channels/auth';

function supabaseSession(): AuthFn<Request> {
  return async (request) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !key) return null;

    const authorization = request.headers.get('authorization');
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const cookie = request.headers.get('cookie') ?? '';
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: bearer ? { Authorization: `Bearer ${bearer}` } : { cookie }
      }
    });
    const { data } = await supabase.auth.getUser(bearer);
    if (!data.user) return null;

    return {
      authenticator: 'supabase',
      principalId: data.user.id,
      principalType: 'user',
      attributes: { email: data.user.email ?? '' }
    };
  };
}

export default eveChannel({
  auth: [supabaseSession(), vercelOidc(), localDev()]
});
