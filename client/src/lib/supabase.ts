import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo:
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined,
  },
});

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`public:${table}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, callback)
    .subscribe();
};

// File upload helper
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) throw error;
  return data;
};

// Get public URL for file
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};
