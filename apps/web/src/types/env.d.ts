/// <reference types="vite/client" />

declare const __MOCK_MODE__: boolean;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_NASA_API_KEY?: string;
  readonly NASA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
