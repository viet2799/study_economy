import Keycloak from 'keycloak-js';

import { clientEnv } from '../../../shared/config/env';

let keycloakInstance: Keycloak | null = null;

export function getKeycloakClient() {
  if (!keycloakInstance) {
    if (
      !clientEnv.NEXT_PUBLIC_KEYCLOAK_URL ||
      !clientEnv.NEXT_PUBLIC_KEYCLOAK_REALM ||
      !clientEnv.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    ) {
      throw new Error('Missing Keycloak environment variables');
    }

    keycloakInstance = new Keycloak({
      url: clientEnv.NEXT_PUBLIC_KEYCLOAK_URL,
      realm: clientEnv.NEXT_PUBLIC_KEYCLOAK_REALM,
      clientId: clientEnv.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
    });
  }

  return keycloakInstance;
}
