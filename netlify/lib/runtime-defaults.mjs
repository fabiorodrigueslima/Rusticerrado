// Imported first by netlify/functions/api.mjs, so these defaults exist before the API reads
// its configuration. (Netlify bundles functions as CommonJS, which rules out top-level await.)
// Netlify does not set NODE_ENV for functions, and without "production" the API would skip its
// production protections (secure cookies, HSTS, shared rate limits, required settings).
// Requests always arrive through Netlify's proxy (one hop).
process.env.NODE_ENV ??= 'production'
process.env.TRUST_PROXY ??= '1'
