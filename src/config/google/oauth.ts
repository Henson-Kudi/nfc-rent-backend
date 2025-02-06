import envConf from '@/config/env.conf';
import { OAuth2Client } from 'google-auth-library';

export const oAuthClient = new OAuth2Client(
  envConf.google.oauthClientId,
  envConf.google.oauthClientSecret
);
