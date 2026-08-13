/// <reference types="vite/client" />

interface ImportMetaEnv {
  /* Both are absent in the standalone build, which runs offline by design.
     src/lib/db.ts treats "unset" as "no sync", so they stay optional. */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
