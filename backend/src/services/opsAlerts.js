import { env } from '../config/env.js'

// Operational alerts for the store team, delivered through the transactional email
// outbox (same retries and idempotency as customer emails). Call inside the transaction
// that records the event, so an alert exists if and only if the event was committed.
// Alerts carry references only (order code, request number), never customer data.
export async function enqueueOpsAlert(client, { key, kind, title, reference, adminSection }, recipient = env.OPS_ALERT_EMAIL) {
  if (!recipient) return false
  const result = await client.query({
    text: `INSERT INTO app.email_outbox(event_key,template,recipient,variables) VALUES($1,'ops-alert',$2,$3) ON CONFLICT(event_key) DO NOTHING RETURNING id`,
    values: [`ops-alert:${key}`, recipient, { kind, title, reference, adminSection }],
  })
  return result.rowCount === 1
}

// Reminders for privacy requests close to (or past) their deadline. Idempotent per
// request and stage, so it is safe to run on every job execution.
export async function enqueuePrivacyDeadlineAlerts(db, reminderDays, recipient = env.OPS_ALERT_EMAIL) {
  if (!recipient) return { dueSoon: 0, overdue: 0 }
  const stage = async (name, condition, title) => (await db({
    text: `INSERT INTO app.email_outbox(event_key,template,recipient,variables)
      SELECT 'ops-alert:privacy-${name}:'||id,'ops-alert',$1,jsonb_build_object('kind','PRIVACY_${name.toUpperCase().replace('-', '_')}','title',$2::text,'reference','LGPD-'||id,'adminSection','privacy-requests')
      FROM app.privacy_requests WHERE status IN ('OPEN','IN_REVIEW') AND ${condition}
      ON CONFLICT(event_key) DO NOTHING`,
    values: [recipient, title],
  })).rowCount
  return {
    dueSoon: await stage('due-soon', `prazo_em >= now() AND prazo_em < now() + make_interval(days => ${Number(reminderDays)})`, 'Solicitação LGPD vence em breve'),
    overdue: await stage('overdue', 'prazo_em < now()', 'Solicitação LGPD com prazo vencido'),
  }
}
