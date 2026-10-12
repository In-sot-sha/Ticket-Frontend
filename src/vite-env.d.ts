/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_NEON_AUTH_URL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly MODE: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
