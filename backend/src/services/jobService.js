import { directUploadService } from './directUploadService.js';
import { randomUUID } from 'node:crypto';
import { query } from '../config/database.js';
import { emailProvider } from '../providers/emailProvider.js';
import { emailOutboxRepository } from '../repositories/emailOutboxRepository.js';
import { orderRepository } from '../repositories/orderRepository.js';
import { enqueuePrivacyDeadlineAlerts } from './opsAlerts.js';
import { PRIVACY_REMINDER_DAYS } from './privacyDeadlines.js';

// Removes credentials that can no longer be used. A grace period keeps recent rows
// available for incident investigation. Audit logs, orders and webhooks are kept.
export const RETENTION_QUERIES = {
  adminSessions: "DELETE FROM app.sessoes WHERE COALESCE(revogada_em,expira_em) < now()-interval '30 days'",
  customerSessions: "DELETE FROM app.cliente_sessoes WHERE COALESCE(revogada_em,expira_em) < now()-interval '30 days'",
  resetTokens: "DELETE FROM app.cliente_password_reset_tokens WHERE COALESCE(usado_em,expira_em) < now()-interval '7 days'",
  activationTokens: "DELETE FROM app.cliente_activation_tokens WHERE COALESCE(usado_em,expira_em) < now()-interval '7 days'",
  idempotencyKeys: "DELETE FROM app.idempotency_keys WHERE expira_em < now()-interval '7 days'",
  loginThrottle: "DELETE FROM app.login_throttle WHERE atualizado_em < now()-interval '7 days' AND (bloqueado_ate IS NULL OR bloqueado_ate < now())",
};

export async function purgeExpiredCredentials(db = query) {
  const removed = {};
  for (const [name, sql] of Object.entries(RETENTION_QUERIES)) removed[name] = (await db(sql)).rowCount;
  return removed;
}

export function createJobService({ db = query, email = emailProvider, outbox = emailOutboxRepository, orders = orderRepository } = {}) {
  return {
    async run(name) {
      if (!['expire-orders', 'send-emails'].includes(name)) throw new Error('UNKNOWN_JOB');
      const owner = randomUUID();
      const lease = await db(`INSERT INTO app.job_leases(name,owner,expires_at) VALUES($1,$2,now()+interval '10 minutes')
        ON CONFLICT(name) DO UPDATE SET owner=EXCLUDED.owner,expires_at=EXCLUDED.expires_at
        WHERE app.job_leases.expires_at<now() RETURNING owner`, [name,owner]);
      if (!lease.rowCount) return { skipped: true };
      try {
        if (name === 'expire-orders') {
          const result = await orders.expireReservations();
          await db('DELETE FROM app.rate_limits WHERE expires_at<now()');
          const retention = await purgeExpiredCredentials(db);
          await directUploadService.cleanup();
          return { ...result, retention };
        }
        // Deadline reminders are queued first so they go out in this same run.
        const privacyAlerts = await enqueuePrivacyDeadlineAlerts(db, PRIVACY_REMINDER_DAYS);
        let sent = 0, failed = 0;
        for (const message of await outbox.claim()) {
          try {
            await email.send({ template: message.template, to: message.recipient, variables: message.variables, idempotencyKey: message.event_key });
            await outbox.sent(message.id);
            sent++;
          } catch (error) {
            await outbox.failed(message.id, error.code ?? error.name);
            failed++;
          }
        }
        return { sent, failed, privacyAlerts };
      } finally {
        await db('DELETE FROM app.job_leases WHERE name=$1 AND owner=$2', [name,owner]);
      }
    },
  };
}
export const jobService = createJobService();
