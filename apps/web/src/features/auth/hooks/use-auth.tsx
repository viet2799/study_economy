'use client';

import * as React from 'react';

import { clientEnv } from '../../../shared/config/env';
import { userSchema, type User } from '../../../shared/schemas/user';
import { getKeycloakClient } from '../lib/keycloak-client';
import {
  readKeycloakSnapshot,
  writeKeycloakSnapshot,
  type KeycloakSnapshot
} from '../lib/keycloak-storage';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

type AuthContextValue = {
  mode: 'mock' | 'keycloak';
  status: AuthStatus;
  user: User | null;
  session: {
    getAccessToken: () => Promise<string | null>;
    refreshAccessToken: () => Promise<boolean>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
  };
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

const mockUser: User = userSchema.parse({
  id: 'user_demo_01',
  email: 'demo@studybase.local',
  name: 'Demo User',
  avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Studybase',
  roles: ['customer']
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading');
  const [user, setUser] = React.useState<User | null>(null);
  const authMode = clientEnv.NEXT_PUBLIC_AUTH_MODE;

  React.useEffect(() => {
    if (authMode === 'mock') {
      setUser(mockUser);
      setStatus('authenticated');
      return;
    }

    let disposed = false;
    const keycloak = getKeycloakClient();
    const snapshot = readKeycloakSnapshot();

    keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        token: snapshot?.token,
        refreshToken: snapshot?.refreshToken,
        idToken: snapshot?.idToken,
        timeSkew: snapshot?.timeSkew
      })
      .then((authenticated) => {
        if (disposed) {
          return;
        }

        if (!authenticated || !keycloak.token) {
          setStatus('anonymous');
          return;
        }

        setStatus('authenticated');
        setUser(
          userSchema.parse({
            id: keycloak.subject ?? 'keycloak-user',
            email: keycloak.tokenParsed?.email ?? 'unknown@studybase.local',
            name:
              keycloak.tokenParsed?.name ??
              keycloak.tokenParsed?.preferred_username ??
              'User',
            avatarUrl: undefined,
            roles: Array.isArray(keycloak.tokenParsed?.realm_access?.roles)
              ? keycloak.tokenParsed?.realm_access?.roles
              : []
          })
        );

        persistSnapshot(keycloak);
      })
      .catch(() => {
        if (!disposed) {
          setStatus('error');
        }
      });

    const refreshTimer = window.setInterval(async () => {
      if (!keycloak.authenticated) {
        return;
      }

      const refreshed = await keycloak.updateToken(30).catch(() => false);
      if (refreshed) {
        persistSnapshot(keycloak);
      }
    }, 15_000);

    function persistSnapshot(instance: typeof keycloak) {
      if (!instance.token || !instance.refreshToken || !instance.idToken) {
        return;
      }

      const nextSnapshot: KeycloakSnapshot = {
        token: instance.token,
        refreshToken: instance.refreshToken,
        idToken: instance.idToken,
        timeSkew: instance.timeSkew ?? 0
      };

      writeKeycloakSnapshot(nextSnapshot);
    }

    return () => {
      disposed = true;
      window.clearInterval(refreshTimer);
    };
  }, [authMode]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      mode: authMode,
      status,
      user,
      session:
        authMode === 'mock'
          ? {
              getAccessToken: async () => 'mock-access-token',
              refreshAccessToken: async () => true,
              login: async () => undefined,
              logout: async () => undefined
            }
          : {
              getAccessToken: async () => getKeycloakClient().token ?? null,
              refreshAccessToken: async () => getKeycloakClient().updateToken(30),
              login: async () => {
                await getKeycloakClient().login();
              },
              logout: async () => {
                writeKeycloakSnapshot(null);
                await getKeycloakClient().logout();
              }
            }
    }),
    [authMode, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
