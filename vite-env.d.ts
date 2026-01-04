// Manually define the environment variables interface since vite/client types are missing or not found.
// This fixes the "Cannot find type definition file for 'vite/client'" and "Property 'env' does not exist on type 'ImportMeta'" errors.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
