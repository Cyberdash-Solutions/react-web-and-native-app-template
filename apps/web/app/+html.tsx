import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * The static HTML shell for every pre-rendered page (7.4). Runs only in Node at build time.
 * Security headers (CSP, HSTS, frame-ancestors…) are set by the host — see vercel.json (4.3).
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="description" content="Hello World — a cross-platform Expo monorepo template." />
        <link rel="manifest" href="/manifest.json" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              'body{background-color:#F8FAFC}@media (prefers-color-scheme: dark){body{background-color:#020617}}',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
