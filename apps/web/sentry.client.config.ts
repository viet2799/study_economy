import * as Sentry from '@sentry/nextjs';

import { clientEnv } from './src/shared/config/env';

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1
});
