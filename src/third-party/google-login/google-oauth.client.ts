import { google } from 'google';
import config from '../../config/config';

export const getGoogleOAuthClient = () => {
  const OAuth2 = google.auth.OAuth2;
  const { clientId, clientSecret } = config().googleAuth;
  return new OAuth2({
    clientId,
    clientSecret,
  });
};
