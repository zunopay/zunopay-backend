import { Request as ExpressRequest } from 'express';
import { GoogleUserPayload, UserPayload } from '../auth/dto/authorization.dto';
export interface Request extends ExpressRequest {
  user: UserPayload;
}

export interface GoogleUserRequest extends ExpressRequest {
  user: GoogleUserPayload;
}
