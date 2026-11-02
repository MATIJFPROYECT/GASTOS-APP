import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = (process.env.WEB_BASE_PATH ?? '').replace(/\/$/, '');
  if (baseUrl && !/^\/[A-Za-z0-9_-]+$/.test(baseUrl)) {
    throw new Error('WEB_BASE_PATH debe ser una ruta como /GASTOS-APP');
  }
  return {
    ...config,
    name: config.name ?? 'A cuenta',
    slug: config.slug ?? 'a-cuenta-gastos',
    experiments: { ...config.experiments, baseUrl },
  };
};
