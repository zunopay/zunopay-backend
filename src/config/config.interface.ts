import { AwsCredentialIdentity } from '@aws-sdk/types';
export interface Config {
  client: ClientConfig;
  nest: NestConfig;
  cors: CorsConfig;
  swagger: SwaggerConfig;
  security: SecurityConfig;
  googleAuth: GoogleAuthConfig;
  spherePayAuth: SpherePayConfig;
  s3: S3Configuration;
}

export interface ClientConfig {
  webUrl: string;
}

export interface NestConfig {
  port: number;
  apiUrl: string;
}

export interface CorsConfig {
  enabled: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
  persistAuthorization: boolean;
}

export interface SecurityConfig {
  expiresIn: string;
  refreshIn: string;
  bcryptSaltOrRound: string | number;
}

interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
}

interface SpherePayConfig {
  token: string;
}

interface S3Configuration {
  region: string;
  bucket: string;
  cdn?: string;
  credentials: AwsCredentialIdentity;
}
