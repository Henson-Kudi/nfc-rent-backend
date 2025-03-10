import envConf from '@/config/env.conf';
import { OAuth2Client } from 'google-auth-library';

// Manually inject this as a service so other clients can use the same instance.
export const oAuthClient = new OAuth2Client(
  envConf.google.oauthClientId,
  envConf.google.oauthClientSecret
);
