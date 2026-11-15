import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SITE_MODE: z.enum(['commerce', 'catalog']).default('commerce'),
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    CRON_SECRET: z.string().min(32).optional(),
    WEBHOOK_MAX_AGE_SECONDS: z.coerce.number().int().min(60).max(86400).default(600),
    RATE_LIMIT_STORE: z.enum(['memory','postgres']).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    FRONTEND_ORIGINS: z.string().default("http://localhost:5173"),
    TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(process.env.VERCEL ? 1 : 0),
    DATABASE_URL: z.string().min(1).optional(),
    DB_SSL: booleanString,
    DB_SSL_CA: z.string().optional(),
    DB_SSL_CA_FILE: z.string().optional(),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(30).default(3),
    DB_IDLE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(60000)
      .default(10000),
    DB_CONNECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(500)
      .max(30000)
      .default(3000),
    POSTAL_CODE_PROVIDER_URL: z
      .string()
      .url()
      .default("https://brasilapi.com.br/api/cep/v2"),
    EXTERNAL_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(500)
      .max(15000)
      .default(4000),
    SHIPPING_PROVIDER: z.enum(["disabled", "configurable", "superfrete"]).default("configurable"),
    SHIPPING_FIXED_PRICE: z
      .string()
      .regex(/^\d+\.\d{2}$/)
      .default("0.00"),
    SHIPPING_FREE_ABOVE: z
      .string()
      .regex(/^\d+\.\d{2}$/)
      .optional()
      .or(z.literal("")),
    SHIPPING_ESTIMATED_DAYS: z.coerce.number().int().min(0).max(90).default(7),
    SHIPPING_ALLOWED_STATES: z.string().default(""),
    SHIPPING_LOCAL_PICKUP: booleanString,
    SHIPPING_LOCAL_PICKUP_LABEL: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .default("Retirada no ateliê"),
    SUPERFRETE_API_BASE_URL: z.string().url().default("https://sandbox.superfrete.com/api/v0"),
    SUPERFRETE_TOKEN: z.string().trim().min(1).optional(),
    SUPERFRETE_ORIGIN_CEP: z
      .string()
      .trim()
      .regex(/^\d{8}$/)
      .optional(),
    SUPERFRETE_SERVICES: z.string().trim().min(1).default("1,2"),
    PAYMENT_PROVIDER: z.enum(["disabled", "mercado-pago"]).default("disabled"),
    MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).optional(),
    MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(16).optional(),
    // "Conectar Mercado Pago" (OAuth): the developer's application plus the key that encrypts
    // the store's tokens in the database. With these, no store credential is needed here.
    MERCADO_PAGO_CLIENT_ID: z.string().trim().regex(/^\d{6,30}$/).optional(),
    MERCADO_PAGO_CLIENT_SECRET: z.string().trim().min(16).optional(),
    MERCADO_PAGO_AUTH_URL: z.string().url().default("https://auth.mercadopago.com/authorization"),
    PAYMENT_TOKEN_KEY: z.string().trim().refine((value) => Buffer.from(value, 'base64').length === 32, 'deve ter 32 bytes em base64').optional(),
    MERCADO_PAGO_API_URL: z
      .string()
      .url()
      .default("https://api.mercadopago.com"),
    PUBLIC_BACKEND_URL: z.string().url().optional(),
    PUBLIC_FRONTEND_URL: z.string().url().optional(),
    CUSTOMER_SESSION_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(720)
      .default(168),
    ADMIN_SESSION_HOURS: z.coerce.number().int().min(1).max(24).default(8),
    EMAIL_PROVIDER: z.enum(["disabled", "http", "resend"]).default("disabled"),
    RESEND_API_KEY: z.string().trim().min(1).optional(),
    // Sender shown to customers, e.g. "RustiCerrado <pedidos@rusticerrado.com.br>".
    EMAIL_FROM: z.string().trim().min(3).max(200).optional(),
    EMAIL_REPLY_TO: z.string().trim().email().max(254).optional(),
    EMAIL_WEBHOOK_URL: z.string().url().optional(),
    EMAIL_WEBHOOK_TOKEN: z.string().min(1).optional(),
    // Cloudflare Turnstile (anti-robot). Optional and never required at boot: the check only
    // runs when both keys are set (security/turnstile.js).
    TURNSTILE_SITE_KEY: z.string().max(200).optional(),
    TURNSTILE_SECRET_KEY: z.string().max(200).optional(),
    // Store inbox for operational alerts (payment incidents, LGPD deadlines).
    OPS_ALERT_EMAIL: z.string().trim().email().max(254).optional(),
    STORAGE_PROVIDER: z
      .enum(["disabled", "local", "http", "supabase"])
      .default("disabled"),
    STORAGE_HTTP_URL: z.string().url().optional(),
    STORAGE_HTTP_TOKEN: z.string().min(1).optional(),
    STORAGE_PUBLIC_URL: z.string().url().optional(),
    // Supabase Storage: project URL and secret key (server only, never in the browser).
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SECRET_KEY: z.string().trim().min(1).optional(),
    SUPABASE_STORAGE_BUCKET: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,62}$/).default("rusticerrado"),
    SUPABASE_STORAGE_FOLDER: z.string().trim().regex(/^[a-z0-9_-]+$/).default("produtos"),
  })
  // Catalog mode keeps commerce providers off; product photos may still use Supabase Storage
  // so the store can be prepared before sales open. E-mail stays as configured: the panel's
  // password recovery needs it even without sales (order e-mails only exist in commerce mode).
  .transform(value => value.SITE_MODE === 'catalog' ? { ...value, PAYMENT_PROVIDER: 'disabled', SHIPPING_PROVIDER: 'disabled', STORAGE_PROVIDER: value.STORAGE_PROVIDER === 'supabase' ? 'supabase' : 'disabled' } : value)
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      const issue = (field) => context.addIssue({ code: 'custom', path: [field], message: 'configuração de produção inválida' });
      // Only the services actually in use must point to real HTTPS endpoints.
      const commerceUrls = ['MERCADO_PAGO_API_URL', ...(value.SHIPPING_PROVIDER === 'superfrete' ? ['SUPERFRETE_API_BASE_URL'] : []), ...(value.EMAIL_PROVIDER === 'http' ? ['EMAIL_WEBHOOK_URL'] : [])];
      for (const field of ['PUBLIC_BACKEND_URL','PUBLIC_FRONTEND_URL', ...(value.SITE_MODE === 'catalog' ? [] : commerceUrls)]) {
        try { const url = new URL(value[field]); if (url.protocol !== 'https:' || url.username || url.password || /localhost|127\.0\.0\.1|\[::1\]/.test(url.hostname) || (value.VERCEL_ENV !== 'preview' && /sandbox/.test(url.hostname))) issue(field); } catch { issue(field); }
      }
      for (const origin of value.FRONTEND_ORIGINS.split(',')) {
        try { const url = new URL(origin.trim()); if (url.protocol !== 'https:' || url.origin !== origin.trim() || /localhost|127\.0\.0\.1|\[::1\]/.test(url.hostname)) issue('FRONTEND_ORIGINS'); } catch { issue('FRONTEND_ORIGINS'); }
      }
      if (value.SITE_MODE !== 'catalog' && (!value.CRON_SECRET || /^CHANGEME/i.test(value.CRON_SECRET))) issue('CRON_SECRET');
      if (value.RATE_LIMIT_STORE === 'memory') issue('RATE_LIMIT_STORE');
      if (value.SITE_MODE !== 'catalog' && value.EMAIL_PROVIDER === 'disabled') issue('EMAIL_PROVIDER');
      // Selling without anyone being alerted about payment incidents is not allowed.
      if (value.SITE_MODE !== 'catalog' && !value.OPS_ALERT_EMAIL) issue('OPS_ALERT_EMAIL');
    }
    if (value.NODE_ENV === "production" && !value.DATABASE_URL) {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "obrigatória em produção",
      });
    }
    if (value.NODE_ENV === "production" && value.SITE_MODE !== 'catalog' && value.PAYMENT_PROVIDER !== "mercado-pago") {
      context.addIssue({
        code: "custom",
        path: ["PAYMENT_PROVIDER"],
        message: "deve ser 'mercado-pago' em produção",
      });
    }
    // Fixed-price shipping ("configurable") or SuperFrete quotes; never no shipping at all.
    if (value.NODE_ENV === "production" && value.SITE_MODE !== 'catalog' && value.SHIPPING_PROVIDER === "disabled") {
      context.addIssue({
        code: "custom",
        path: ["SHIPPING_PROVIDER"],
        message: "deve ser 'configurable' ou 'superfrete' em produção",
      });
    }
    const requireField = (enabled, field, message) => {
      if (enabled && !value[field])
        context.addIssue({ code: "custom", path: [field], message });
    };
    const superFrete = value.SHIPPING_PROVIDER === "superfrete";
    requireField(superFrete, "SUPERFRETE_TOKEN", "obrigatória para SuperFrete");
    requireField(superFrete, "SUPERFRETE_ORIGIN_CEP", "obrigatória para SuperFrete");
    const mercadoPago = value.PAYMENT_PROVIDER === "mercado-pago";
    // A partly configured OAuth application must never stop the site: the panel just shows
    // "not prepared yet" (paymentConnectionService.configured) until all three exist.
    const oauthFields = ["MERCADO_PAGO_CLIENT_ID", "MERCADO_PAGO_CLIENT_SECRET", "PAYMENT_TOKEN_KEY"];
    const oauthSet = oauthFields.filter((field) => value[field]);
    // Mercado Pago needs either a fixed token or the OAuth application (the store connects in the panel).
    requireField(
      mercadoPago && oauthSet.length < oauthFields.length,
      "MERCADO_PAGO_ACCESS_TOKEN",
      "obrigatória para Mercado Pago sem Conectar Mercado Pago",
    );
    requireField(
      mercadoPago,
      "MERCADO_PAGO_WEBHOOK_SECRET",
      "obrigatória para Mercado Pago",
    );
    requireField(
      mercadoPago,
      "PUBLIC_BACKEND_URL",
      "obrigatória para Mercado Pago",
    );
    requireField(
      mercadoPago,
      "PUBLIC_FRONTEND_URL",
      "obrigatória para Mercado Pago",
    );
    requireField(value.EMAIL_PROVIDER === "resend", "RESEND_API_KEY", "obrigatória para Resend");
    requireField(value.EMAIL_PROVIDER === "resend", "EMAIL_FROM", "obrigatória para Resend");
    requireField(
      value.EMAIL_PROVIDER === "http",
      "EMAIL_WEBHOOK_URL",
      "obrigatória para e-mail HTTP",
    );
    requireField(
      value.EMAIL_PROVIDER === "http",
      "EMAIL_WEBHOOK_TOKEN",
      "obrigatória para e-mail HTTP",
    );
    requireField(
      value.STORAGE_PROVIDER === "http",
      "STORAGE_HTTP_URL",
      "obrigatória para storage HTTP",
    );
    requireField(
      value.STORAGE_PROVIDER === "http",
      "STORAGE_HTTP_TOKEN",
      "obrigatória para storage HTTP",
    );
    requireField(
      value.STORAGE_PROVIDER === "http",
      "STORAGE_PUBLIC_URL",
      "obrigatória para storage HTTP",
    );
    const supabase = value.STORAGE_PROVIDER === "supabase";
    requireField(supabase, "SUPABASE_URL", "obrigatória para Supabase Storage");
    requireField(supabase, "SUPABASE_SECRET_KEY", "obrigatória para Supabase Storage");
    if (value.NODE_ENV === "production" && value.SITE_MODE !== 'catalog' && value.STORAGE_PROVIDER !== "supabase")
      context.addIssue({
        code: "custom",
        path: ["STORAGE_PROVIDER"],
        message: "deve ser 'supabase' em produção",
      });
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(`Configuração de ambiente inválida: ${fields}`);
}

export const env = {
  ...parsed.data,
  frontendOrigins: parsed.data.FRONTEND_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
