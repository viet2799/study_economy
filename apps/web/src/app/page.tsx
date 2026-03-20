'use client';

import { useEffect, useState } from 'react';

import { ChatRoom } from '../components/chat-room';
import { getKeycloak } from '../lib/keycloak';

export default function HomePage() {
  const [token, setToken] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const keycloak = getKeycloak();

    keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false
      })
      .then((authenticated) => {
        if (!authenticated || !keycloak.token) {
          return;
        }

        setToken(keycloak.token);
        setIsReady(true);
      });
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Studybase</p>
        <h1>NestJS + NextJS base for auth, realtime chat and infra services.</h1>
        <p className="lead">
          Prisma + Postgres, Redis cache, Kafka events, Socket.IO chat and
          Keycloak auth are already wired together.
        </p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Infra checklist</h2>
          <ul>
            <li>Postgres via Prisma schema</li>
            <li>Redis service wrapper</li>
            <li>Kafka producer base</li>
            <li>Socket chat gateway</li>
            <li>Keycloak login flow</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Realtime chat demo</h2>
          {isReady && token ? (
            <ChatRoom token={token} />
          ) : (
            <p>Waiting for Keycloak login...</p>
          )}
        </article>
      </section>
    </main>
  );
}
