#!/usr/bin/env node
// A tiny HTTP server around the shared mock backend (../mocks/backend.ts). Run: pnpm mock-api
// Used for local development without a real API, contract tests (13.13) and E2E (13.18).
// `POST /__reset` restores the seeded fixtures, so every E2E run starts from the same state.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Node runs the TypeScript backend directly (type stripping); it has type-only imports.
const { createMockBackend } = await import('../mocks/backend.ts');
const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, `${name}.json`), 'utf8'));

export function loadFixtures() {
  return {
    user: readJson('user'),
    credentials: readJson('credentials'),
    tokens: readJson('tokens'),
    greetingAnonymous: readJson('greeting-anonymous'),
    appConfig: readJson('app-config'),
    messages: readJson('messages'),
  };
}

export function startMockApi({
  port = Number(process.env.PORT ?? 4000),
  host = '127.0.0.1',
  quiet = false,
} = {}) {
  const backend = createMockBackend(loadFixtures());
  const server = http.createServer(async (req, res) => {
    // Credentialed CORS so the web app (another origin in dev) can use the refresh cookie (4.2).
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers':
          req.headers['access-control-request-headers'] ?? 'content-type,authorization',
        'Access-Control-Max-Age': '600',
      });
      return res.end();
    }

    let raw = '';
    for await (const chunk of req) raw += chunk;
    const url = new URL(req.url ?? '/', 'http://localhost');
    let body;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Invalid JSON' }));
    }
    const result = backend.handle({
      method: req.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      header: (name) => {
        const v = req.headers[name.toLowerCase()];
        return Array.isArray(v) ? v.join(', ') : (v ?? null);
      },
      body,
    });
    if (!quiet) console.log(`${req.method} ${url.pathname}${url.search} → ${result.status}`);
    res.writeHead(result.status, {
      ...(result.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...result.headers,
    });
    res.end(result.body !== undefined ? JSON.stringify(result.body) : undefined);
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const address = server.address();
      const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${typeof address === 'object' && address ? address.port : port}`;
      if (!quiet) console.log(`mock-api listening on ${url}`);
      resolve({ url, close: () => new Promise((r) => server.close(r)), backend });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('mock-api')) {
  await startMockApi({ host: process.env.HOST ?? '127.0.0.1' });
}
