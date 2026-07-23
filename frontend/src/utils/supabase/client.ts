import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wrabcfmvyfzvdpudawvl.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_5CtKIzvsjZ-FSXthGaf_tA_484h8zgF';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!
  );
