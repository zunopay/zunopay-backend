import { Config } from './config.interface';

export const CONFIG: Config = {
  client: {
    webUrl: process.env.WEB_URL,
  },
  nest: {
    port: 3005,
    apiUrl: process.env.API_URL,
  },
  cors: {
    enabled: true,
  },
  swagger: {
    enabled: true,
    title: 'ZunoPay API',
    description: 'API endpoints for ZunoPay app',
    version: '1.0.0',
    path: 'api',
    persistAuthorization: true,
  },
  security: {
    expiresIn: '30d',
    refreshIn: '90d',
    bcryptSaltOrRound: 10,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_AUTH_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET ?? '',
  },
  spherePayAuth: {
    token: process.env.SPHERE_API_KEY ?? '',
  },
};

export default (): Config => CONFIG;
