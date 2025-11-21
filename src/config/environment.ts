const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://vxprxdargzqvlxdjffak.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_7BZWpcl5boBluRjdFa6R0g_NIaK4CSu';

export const environment = {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
};
