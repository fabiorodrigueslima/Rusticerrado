import { createHash } from 'node:crypto';
import { query } from '../config/database.js';

// Expired rows are swept opportunistically because catalog mode runs no scheduled jobs.
// A bounded batch keeps the extra cost per sampled request small and predictable.
const SWEEP_PROBABILITY = 0.01;
const SWEEP_BATCH = 500;

export class PostgresRateLimitStore {
  constructor(prefix, db = query, random = Math.random) { this.prefix = prefix; this.db = db; this.random = random; this.localKeys = false; }
  init({ windowMs }) { this.windowMs = windowMs; }
  key(key) { return createHash('sha256').update(`${this.prefix}:${key}`).digest('hex'); }
  async sweep() {
    try {
      await this.db(`DELETE FROM app.rate_limits WHERE key_hash IN (SELECT key_hash FROM app.rate_limits WHERE expires_at<now() LIMIT ${SWEEP_BATCH} FOR UPDATE SKIP LOCKED)`);
    } catch {
      // Cleanup is best effort and must never block or fail the request itself.
    }
  }
  async increment(key) {
    if (this.random() < SWEEP_PROBABILITY) await this.sweep();
    const result = await this.db(`INSERT INTO app.rate_limits(key_hash,hits,expires_at) VALUES($1,1,now()+($2::text||' milliseconds')::interval)
      ON CONFLICT(key_hash) DO UPDATE SET
      hits=CASE WHEN app.rate_limits.expires_at<=now() THEN 1 ELSE app.rate_limits.hits+1 END,
      expires_at=CASE WHEN app.rate_limits.expires_at<=now() THEN EXCLUDED.expires_at ELSE app.rate_limits.expires_at END
      RETURNING hits,expires_at`, [this.key(key),this.windowMs]);
    return { totalHits: result.rows[0].hits, resetTime: new Date(result.rows[0].expires_at) };
  }
  async decrement(key) { await this.db('UPDATE app.rate_limits SET hits=GREATEST(1,hits-1) WHERE key_hash=$1', [this.key(key)]); }
  async resetKey(key) { await this.db('DELETE FROM app.rate_limits WHERE key_hash=$1', [this.key(key)]); }
}
