import { oAuthClient as authClient } from './oauth';
import { Service, Token } from 'typedi';

export const GoogleServicesManagerToken = new Token<IGoogleServicesManager>()
@Service({
  id: GoogleServicesManagerToken,
  global: true
})
export class GoogleServicesManager implements IGoogleServicesManager {
  oAuthClient = authClient;
}
