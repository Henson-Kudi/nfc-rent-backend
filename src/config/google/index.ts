import { OAuth2Client } from 'google-auth-library';
import IGoogleServicesManager from '@/types/global';
import { oAuthClient as authClient } from './oauth';

class GoogleServicesManager implements IGoogleServicesManager {
  oAuthClient: OAuth2Client = authClient;
}

const googleservicesManager = new GoogleServicesManager();

export default googleservicesManager;
