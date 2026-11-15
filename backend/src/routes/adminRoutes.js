import { z } from 'zod';
import { directUploadService } from '../services/directUploadService.js';
import express, { Router } from "express";
import { forgotPassword, login, logout, me, resetPassword } from "../controllers/adminAuthController.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { requireAdmin, requireCsrf, sensitiveNoStore } from "../middlewares/adminSecurity.js";
import { adminLoginRateLimit } from "../security/httpSecurity.js";
import { requireHuman } from "../security/turnstile.js";
import { adminForgotSchema, adminLoginSchema, adminResetSchema, paymentMethodsSchema } from "../validators/adminValidators.js";
import { disconnectMercadoPago, mercadoPagoCallback, paymentSettings, startMercadoPagoConnection, updatePaymentMethods } from "../controllers/adminPaymentController.js";
import { requireRole } from "../middlewares/adminSecurity.js";
import {
  adjustStock,
  categories,
  collections,
  courses,
  createProduct,
  product,
  setPrimaryImage,
  team,
  createInvite,
  revokeInvite,
  setAdminActive,
  removeAdmin,
  inspectInvite,
  acceptInvite,
  createVariant,
  dashboard,
  order,
  orders,
  products,
  settings,
  stock,
  updateOrderStatus,
  updateProduct,
  updateSettings,
  updateVariant,
  archiveProduct,
  deactivateVariant,
  createCategory,
  updateCategory,
  deactivateCategory,
  createCollection,
  updateCollection,
  deactivateCollection,
  uploadImage,
  deleteImage,
  paymentIncidents,
  resolvePaymentIncident,
  privacyRequests,
  updatePrivacyRequest,
  createCourse,
  updateCourse,
} from "../controllers/adminController.js";
import {
  adminListSchema,
  idParamsSchema,
  productSchema,
  productCreateSchema,
  settingSchema,
  statusSchema,
  stockSchema,
  variantSchema,
  categorySchema,
  collectionSchema,
  imageUploadQuerySchema,
  incidentListSchema,
  incidentResolutionSchema,
  privacyListSchema,
  privacyStatusSchema,
  inviteCreateSchema,
  inviteTokenSchema,
  inviteAcceptSchema,
  adminActiveSchema,
  courseSchema,
} from "../validators/adminValidators.js";

export const adminRouter = Router();
adminRouter.use(sensitiveNoStore);
adminRouter.post(
  "/auth/login",
  adminLoginRateLimit,
  validateRequest(adminLoginSchema, "body"),
  login,
);
adminRouter.get("/auth/me", requireAdmin, me);
adminRouter.post("/auth/logout", requireAdmin, requireCsrf, logout);
// Mercado Pago sends the browser back here after the owner authorizes; the admin cookie
// (SameSite=strict) does not come along, so the single-use state identifies who connected.
adminRouter.get("/payments/mercado-pago/callback", adminLoginRateLimit, mercadoPagoCallback);
// Password recovery works without a session; it shares the login rate limit.
adminRouter.post("/auth/forgot", adminLoginRateLimit, validateRequest(adminForgotSchema, "body"), requireHuman("admin-forgot"), forgotPassword);
adminRouter.post("/auth/reset", adminLoginRateLimit, validateRequest(adminResetSchema, "body"), resetPassword);
// Invite links work without a session; they share the login rate limit.
adminRouter.post("/invites/inspect", adminLoginRateLimit, validateRequest(inviteTokenSchema, "body"), inspectInvite);
adminRouter.post("/invites/accept", adminLoginRateLimit, validateRequest(inviteAcceptSchema, "body"), acceptInvite);
adminRouter.use(requireAdmin);
// Team management is restricted to store owners.
adminRouter.get("/team", requireRole("OWNER"), team);
adminRouter.post("/team/invites", requireCsrf, requireRole("OWNER"), validateRequest(inviteCreateSchema, "body"), createInvite);
adminRouter.delete("/team/invites/:id", requireCsrf, requireRole("OWNER"), validateRequest(idParamsSchema, "params"), revokeInvite);
adminRouter.post("/team/:id/active", requireCsrf, requireRole("OWNER"), validateRequest(idParamsSchema, "params"), validateRequest(adminActiveSchema, "body"), setAdminActive);
adminRouter.delete("/team/:id", requireCsrf, requireRole("OWNER"), validateRequest(idParamsSchema, "params"), removeAdmin);
adminRouter.get("/dashboard", dashboard);
adminRouter.get(
  "/products",
  validateRequest(adminListSchema, "query"),
  products,
);
adminRouter.get("/products/:id", validateRequest(idParamsSchema, "params"), product);
adminRouter.post(
  "/products",
  requireCsrf,
  requireRole("OWNER", "MANAGER"),
  validateRequest(productCreateSchema, "body"),
  createProduct,
);
adminRouter.put(
  "/products/:id",
  requireCsrf,
  requireRole("OWNER", "MANAGER"),
  validateRequest(idParamsSchema, "params"),
  validateRequest(productSchema, "body"),
  updateProduct,
);
adminRouter.post(
  "/products/:id/variants",
  requireCsrf,
  requireRole("OWNER", "MANAGER"),
  validateRequest(idParamsSchema, "params"),
  validateRequest(variantSchema, "body"),
  createVariant,
);
adminRouter.put("/variants/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(variantSchema,"body"),updateVariant);
adminRouter.delete("/variants/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),deactivateVariant);
adminRouter.delete("/products/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),archiveProduct);
adminRouter.get("/stock", stock);
adminRouter.post(
  "/stock/:id/adjust",
  requireCsrf,
  requireRole("OWNER", "MANAGER", "FULFILLMENT"),
  validateRequest(idParamsSchema, "params"),
  validateRequest(stockSchema, "body"),
  adjustStock,
);
adminRouter.get("/orders", validateRequest(adminListSchema, "query"), orders);
adminRouter.get(
  "/orders/:id",
  validateRequest(idParamsSchema, "params"),
  order,
);
adminRouter.post(
  "/orders/:id/status",
  requireCsrf,
  requireRole("OWNER", "MANAGER", "FULFILLMENT"),
  validateRequest(idParamsSchema, "params"),
  validateRequest(statusSchema, "body"),
  updateOrderStatus,
);
adminRouter.get("/courses", courses);
adminRouter.post("/courses",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(courseSchema,"body"),createCourse);
adminRouter.put("/courses/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(courseSchema,"body"),updateCourse);
adminRouter.get("/categories", categories);
adminRouter.get("/collections", collections);
adminRouter.post("/categories",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(categorySchema,"body"),createCategory);
adminRouter.put("/categories/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(categorySchema,"body"),updateCategory);
adminRouter.delete("/categories/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),deactivateCategory);
adminRouter.post("/collections",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(collectionSchema,"body"),createCollection);
adminRouter.put("/collections/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(collectionSchema,"body"),updateCollection);
adminRouter.delete("/collections/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),deactivateCollection);
adminRouter.post("/images",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(imageUploadQuerySchema,"query"),express.raw({type:["image/jpeg","image/png","image/webp"],limit:"4mb"}),uploadImage);
adminRouter.post("/images/:id/primary",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),setPrimaryImage);
adminRouter.delete("/images/:id",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),deleteImage);
// Financial and personal-data queues: not available to the FULFILLMENT role.
adminRouter.get("/payment-incidents",requireRole("OWNER","MANAGER"),validateRequest(incidentListSchema,"query"),paymentIncidents);
adminRouter.post("/payment-incidents/:id/resolve",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(incidentResolutionSchema,"body"),resolvePaymentIncident);
adminRouter.get("/privacy-requests",requireRole("OWNER","MANAGER"),validateRequest(privacyListSchema,"query"),privacyRequests);
adminRouter.post("/privacy-requests/:id/status",requireCsrf,requireRole("OWNER","MANAGER"),validateRequest(idParamsSchema,"params"),validateRequest(privacyStatusSchema,"body"),updatePrivacyRequest);
adminRouter.get("/settings", requireRole("OWNER", "MANAGER"), settings);
// Payments: only the store owner connects accounts or changes how customers pay.
adminRouter.get("/payments", requireRole("OWNER"), paymentSettings);
adminRouter.post("/payments/mercado-pago/connect", requireCsrf, requireRole("OWNER"), startMercadoPagoConnection);
adminRouter.delete("/payments/mercado-pago", requireCsrf, requireRole("OWNER"), disconnectMercadoPago);
adminRouter.put("/payments/methods", requireCsrf, requireRole("OWNER"), validateRequest(paymentMethodsSchema, "body"), updatePaymentMethods);
adminRouter.put(
  "/settings",
  requireCsrf,
  requireRole("OWNER"),
  validateRequest(settingSchema, "body"),
  updateSettings,
);

// A photo for a product (productId) or the cover of a course (courseId): exactly one of them.
const directImageSchema = z.object({productId:z.number().int().positive().optional(),courseId:z.number().int().positive().optional(),mime:z.enum(['image/jpeg','image/png','image/webp']),bytes:z.number().int().positive().max(5242880),alt:z.string().trim().min(2).max(180),primary:z.boolean().default(false)}).strict().refine((value)=>Boolean(value.productId)!==Boolean(value.courseId),{message:'Informe a peça ou o curso.'});
adminRouter.post('/images/sign',requireCsrf,requireRole('OWNER','MANAGER'),validateRequest(directImageSchema,'body'),async(req,res)=>res.status(201).json({data:await directUploadService.prepare(req.validated.body)}));
adminRouter.post('/images/complete',requireCsrf,requireRole('OWNER','MANAGER'),validateRequest(z.object({id:z.string().uuid()}).strict(),'body'),async(req,res)=>res.json({data:await directUploadService.complete(req.validated.body.id)}));
