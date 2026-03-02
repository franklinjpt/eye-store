const WOMPI_REQUIRED_KEYS = [
  'WOMPI_API_URL',
  'WOMPI_PRIVATE_KEY',
  'WOMPI_INTEGRITY_KEY',
] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV ?? '').trim();
  if (nodeEnv === 'test') {
    return config;
  }

  const missingKeys = WOMPI_REQUIRED_KEYS.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}`,
    );
  }

  return config;
}
