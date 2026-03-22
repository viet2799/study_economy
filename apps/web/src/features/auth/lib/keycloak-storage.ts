const STORAGE_KEY = 'studybase:keycloak';

export type KeycloakSnapshot = {
  token: string;
  refreshToken: string;
  idToken: string;
  timeSkew: number;
};

export function readKeycloakSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as KeycloakSnapshot;
  } catch {
    return null;
  }
}

export function writeKeycloakSnapshot(snapshot: KeycloakSnapshot | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!snapshot) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
