import { createJobRouter } from './routes/jobRoutes.js';
import { webhookRouter } from './routes/webhookRoutes.js';
import express from 'express'
import { resolve } from 'node:path'
import { env } from './config/env.js'
import { catalogMode } from './middlewares/catalogMode.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFound } from './middlewares/notFound.js'
import { requestContext } from './middlewares/requestContext.js'
import { apiRouter } from './routes/index.js'
import { sharePreviewService } from './services/sharePreviewService.js'
import { sitemapService } from './services/sitemapService.js'
import { corsPolicy, jobsRateLimit, publicRateLimit, securityHeaders, webhookRateLimit } from './security/httpSecurity.js'

export const app = express()
export default app
app.disable('x-powered-by')
app.set('trust proxy', env.TRUST_PROXY)
app.set('adminOrigins', env.frontendOrigins)
app.use(requestContext)
app.use(securityHeaders)
app.use(corsPolicy)
app.use(express.json({ limit: '100kb', strict: true }))
app.use(['/api/v1/cart', '/api/v1/checkout', '/api/v1/orders', '/api/v1/customers', '/api/v1/webhooks', '/api/internal/jobs'], catalogMode)
if (env.STORAGE_PROVIDER === 'local' && env.NODE_ENV !== 'production') app.use('/uploads', express.static(resolve(process.cwd(),'uploads'),{fallthrough:false,index:false,maxAge:'1h'}))
app.use('/api/internal/jobs', jobsRateLimit, createJobRouter())
app.use('/api/v1/webhooks', webhookRateLimit, webhookRouter)
app.use('/api/v1', publicRateLimit, apiRouter)
// Served at the site root through a Netlify redirect, so search engines find it at /sitemap.xml.
app.get('/sitemap.xml', publicRateLimit, async (_req, res, next) => {
  try {
    const xml = await sitemapService.build(env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.type('application/xml').send(xml)
  } catch (error) { next(error) }
})
// Only link-preview robots reach this (the Netlify edge function routes them by user-agent): see sharePreviewService.
app.get('/produto/:slug', publicRateLimit, async (req, res, next) => {
  try {
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug) && req.params.slug.length <= 180 ? req.params.slug : ''
    const preview = await sharePreviewService.product(slug, env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173')
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.status(preview.status).type('html').send(preview.html)
  } catch (error) { next(error) }
})
app.use(notFound)
app.use(errorHandler)
