import { z } from 'zod'

export const adminLoginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.").max(200) }).strict()
export const adminListSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), q: z.string().trim().max(100).default(''), status: z.string().trim().max(30).optional() }).strict()
export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() }).strict()
const positiveMeasurement=z.number().positive().max(10000).nullable().optional()
export const productSchema = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), description: z.string().max(10000).default(''), materials: z.string().max(2000).nullable().optional(), dimensions: z.string().max(1000).nullable().optional(), weightGrams: positiveMeasurement, widthCm: positiveMeasurement, heightCm: positiveMeasurement, lengthCm: positiveMeasurement, care: z.string().max(3000).nullable().optional(), productionDays: z.number().int().min(0).max(365).default(0), categoryId: z.number().int().positive().nullable().optional(), status: z.enum(['DRAFT','ACTIVE','ARCHIVED']).default('DRAFT') }).strict()
export const variantSchema = z.object({ name: z.string().trim().min(1).max(120), sku: z.string().trim().min(1).max(64), price: z.string().regex(/^\d{1,10}(\.\d{2})$/), salePrice: z.string().regex(/^\d{1,10}(\.\d{2})$/).nullable().optional(), stock: z.number().int().min(0).max(32767), active: z.boolean(), attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}), weightGrams: positiveMeasurement, widthCm: positiveMeasurement, heightCm: positiveMeasurement, lengthCm: positiveMeasurement }).strict().refine((v) => v.salePrice == null || Number(v.salePrice) < Number(v.price), { path: ['salePrice'], message: 'Promoção deve ser menor que o preço.' })
// Optional first variant created in the same transaction as the product.
export const productCreateSchema = productSchema.extend({ initialVariant: variantSchema.optional() })
export const stockSchema = z.object({ delta: z.number().int().min(-32767).max(32767).refine((value) => value !== 0), reason: z.string().trim().min(3).max(240) }).strict()
// Tracking code: letters, digits and hyphens (Correios: AA123456789BR). Required when marking as SHIPPED.
const trackingCode = z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,40}$/, 'Código de rastreio inválido.')
const trackingUrl = z.string().trim().max(500).url().refine((value) => value.startsWith('https://'), 'O link de rastreio deve começar com https://')
export const statusSchema = z.object({ status: z.enum(['IN_PRODUCTION','READY_TO_SHIP','SHIPPED','DELIVERED','CANCELLED']), reason: z.string().trim().min(3).max(240), trackingCode: trackingCode.optional(), trackingUrl: trackingUrl.optional() }).strict().superRefine((value, ctx) => {
  if (value.status === 'SHIPPED' && !value.trackingCode) ctx.addIssue({ code: 'custom', path: ['trackingCode'], message: 'Informe o código de rastreio para marcar como enviado.' })
  if (value.status !== 'SHIPPED' && (value.trackingCode || value.trackingUrl)) ctx.addIssue({ code: 'custom', path: ['trackingCode'], message: 'O rastreio só é informado ao marcar como enviado.' })
})
export const settingSchema = z.object({ reservationMinutes: z.number().int().min(5).max(1440).optional(), checkoutEnabled: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0, 'Nada para alterar.')
export const imageUploadQuerySchema=z.object({productId:z.coerce.number().int().positive(),alt:z.string().trim().min(2).max(180),primary:z.enum(['true','false']).default('false').transform(v=>v==='true')}).strict()
export const categorySchema=z.object({name:z.string().trim().min(2).max(100),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),description:z.string().max(3000).nullable().optional(),active:z.boolean().default(true),order:z.number().int().min(-32768).max(32767).default(0)}).strict()
export const collectionSchema=z.object({name:z.string().trim().min(2).max(120),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(140),description:z.string().max(5000).nullable().optional(),active:z.boolean().default(true),featured:z.boolean().default(false)}).strict()
const inviteToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Convite inválido.')
export const inviteCreateSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().max(254), role: z.enum(['OWNER','MANAGER','FULFILLMENT']) }).strict()
export const inviteTokenSchema = z.object({ token: inviteToken }).strict()
// New administrators choose their own password; it is stricter than the login minimum.
export const inviteAcceptSchema = z.object({ token: inviteToken, password: z.string().min(10, 'A senha deve ter no mínimo 10 caracteres.').max(200) }).strict()
export const adminActiveSchema = z.object({ active: z.boolean() }).strict()
export const incidentListSchema=z.object({status:z.enum(['OPEN','RESOLVED']).optional()}).strict()
export const incidentResolutionSchema=z.object({resolution:z.string().trim().min(3).max(1000)}).strict()
export const privacyListSchema=z.object({status:z.enum(['OPEN','IN_REVIEW','COMPLETED','DENIED']).optional()}).strict()
// A note is mandatory: denials must state the reason to the data subject (LGPD art. 18, §4).
export const privacyStatusSchema=z.object({status:z.enum(['IN_REVIEW','COMPLETED','DENIED']),note:z.string().trim().min(3).max(2000)}).strict()
// "Esqueci a senha" do painel: mesma regra de senha do convite (mínimo 10 caracteres).
export const adminForgotSchema = z.object({ email: z.string().trim().email().max(254) }).strict()
export const adminResetSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Link inválido.'), password: z.string().min(10, 'A senha deve ter no mínimo 10 caracteres.').max(200) }).strict()
// Payment methods chosen in the panel. At least one must stay on.
export const paymentMethodsSchema = z.object({ pix: z.boolean(), credit: z.boolean(), debit: z.boolean(), boleto: z.boolean(), maxInstallments: z.number().int().min(1).max(12) }).strict().refine((value) => value.pix || value.credit || value.debit || value.boleto, { message: 'Deixe pelo menos uma forma de pagamento ligada.', path: ['pix'] })

// Course form in the panel. Workload is free text ("8 horas", "2 encontros de 4h").
export const courseSchema=z.object({name:z.string().trim().min(2).max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),summary:z.string().trim().max(300).default(''),description:z.string().trim().max(10000).default(''),workload:z.string().trim().max(60).default(''),certificate:z.boolean().default(false),status:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),featured:z.boolean().default(false)}).strict()