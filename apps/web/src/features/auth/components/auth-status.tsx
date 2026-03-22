'use client';

import { Button } from '../../../shared/ui/button';
import { Card, CardContent } from '../../../shared/ui/card';
import { useAuth } from '../hooks/use-auth';

export function AuthStatusCard() {
  const auth = useAuth();

  return (
    <Card className="border-brand/10 bg-white/90">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Session</p>
          <h3 className="text-lg font-semibold text-slate-950">
            {auth.user?.name ?? 'Guest'}
          </h3>
          <p className="text-sm text-slate-500">
            {auth.status} · {auth.mode === 'mock' ? 'Mock Auth' : 'Keycloak'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => auth.session.refreshAccessToken()}
            type="button"
          >
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => auth.session.logout()} type="button">
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
