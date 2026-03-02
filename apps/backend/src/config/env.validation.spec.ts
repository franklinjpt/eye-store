import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('should throw when WOMPI vars are missing outside test env', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        WOMPI_API_URL: 'https://api.example.com',
        WOMPI_PRIVATE_KEY: '',
      }),
    ).toThrow(
      'Missing required environment variables: WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_KEY',
    );
  });

  it('should pass when WOMPI vars are present outside test env', () => {
    const config = {
      NODE_ENV: 'production',
      WOMPI_API_URL: 'https://api.example.com',
      WOMPI_PRIVATE_KEY: 'prv_test',
      WOMPI_INTEGRITY_KEY: 'int_test',
    };

    expect(validateEnv(config)).toBe(config);
  });

  it('should skip WOMPI validation in test env', () => {
    const config = {
      NODE_ENV: 'test',
    };

    expect(validateEnv(config)).toBe(config);
  });
});
