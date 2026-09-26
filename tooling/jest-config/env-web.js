// jsdom doesn't implement the Fetch API family; MSW (13.10) and the api-client need it. Expose
// Node's implementations inside the jsdom realm (same approach as jest-fixed-jsdom).
const { TestEnvironment } = require('jest-environment-jsdom');

const NODE_GLOBALS = [
  'fetch',
  'Request',
  'Response',
  'Headers',
  'FormData',
  'Blob',
  'File',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextEncoder',
  'TextDecoder',
  'TextEncoderStream',
  'TextDecoderStream',
  'BroadcastChannel',
  'AbortController',
  'AbortSignal',
  'URL',
  'URLSearchParams',
  'structuredClone',
  'WebSocket',
];

class WebEnvironment extends TestEnvironment {
  constructor(...args) {
    super(...args);
    for (const key of NODE_GLOBALS) {
      if (key in globalThis) this.global[key] = globalThis[key];
    }
  }
}

module.exports = WebEnvironment;
