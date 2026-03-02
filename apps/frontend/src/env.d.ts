interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WOMPI_PUBLIC_KEY: string;
  readonly VITE_WOMPI_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
