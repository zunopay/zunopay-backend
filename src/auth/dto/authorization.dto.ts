import { User } from '@prisma/client';

export type BaseJwtPayload = {
  /** Issued at */
  iat: number;
  /** Expiration time */
  exp: number;
};

export type GoogleUserPayload = {
  type: 'google';
  id?: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

export type UserPayload = {
  id: User['id'];
  email: User['email'];
  username: User['username'];
  role: User['role'];
};

export type JwtPayload = UserPayload;
export type JwtDto = JwtPayload & BaseJwtPayload;
