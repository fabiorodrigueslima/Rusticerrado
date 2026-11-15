import { imageService } from '../services/imageService.js';
import { env } from '../config/env.js';
import { currentSalesReadiness } from '../services/salesReadiness.js';
import { AppError } from '../utils/AppError.js';
import { adminRepository } from "../repositories/adminRepository.js";
import { adminAuthRepository } from "../repositories/adminAuthRepository.js";
import { adminTeamService } from "../services/adminTeamService.js";

async function audited(req, action, type, work) {
  try {
    const data = await work();
    await adminAuthRepository.audit({
      adminId: req.admin.admin_id,
      action,
      resourceType: type,
      resourceId: req.validated?.params?.id
        ? String(req.validated.params.id)
        : null,
      requestId: req.requestId,
    });
    return data;
  } catch (error) {
    await adminAuthRepository.audit({
      adminId: req.admin.admin_id,
      action,
      resourceType: type,
      result: "FAILED",
      requestId: req.requestId,
      metadata: { code: error.code ?? "INTERNAL" },
    });
    throw error;
  }
}
export async function dashboard(_req, res) {
  res.json({ data: await adminRepository.dashboard() });
}
export async function products(req, res) {
  res.json({ data: await adminRepository.products(req.validated.query) });
}
export async function product(req, res) {
  res.json({ data: await adminRepository.product(req.validated.params.id) });
}
export async function createProduct(req, res) {
  res.status(201).json({
    data: await audited(req, "PRODUCT_CREATE", "PRODUCT", () =>
      adminRepository.createProduct(req.validated.body),
    ),
  });
}
export async function updateProduct(req, res) {
  res.json({
    data: await audited(req, "PRODUCT_UPDATE", "PRODUCT", () =>
      adminRepository.updateProduct(
        req.validated.params.id,
        req.validated.body,
      ),
    ),
  });
}
export async function createVariant(req, res) {
  res.status(201).json({
    data: await audited(req, "VARIANT_CREATE", "VARIANT", () =>
      adminRepository.createVariant(
        req.validated.params.id,
        req.validated.body,
      ),
    ),
  });
}
export async function updateVariant(req, res) {
  res.json({
    data: await audited(req, "VARIANT_UPDATE", "VARIANT", () =>
      adminRepository.updateVariant(
        req.validated.params.id,
        req.validated.body,
      ),
    ),
  });
}
export async function archiveProduct(req, res) {
  res.json({
    data: await audited(req, "PRODUCT_ARCHIVE", "PRODUCT", () =>
      adminRepository.archiveProduct(req.validated.params.id),
    ),
  });
}
export async function deactivateVariant(req, res) {
  res.json({
    data: await audited(req, "VARIANT_DEACTIVATE", "VARIANT", () =>
      adminRepository.deactivateVariant(req.validated.params.id),
    ),
  });
}
export async function stock(_req, res) {
  res.json({ data: await adminRepository.stock() });
}
export async function adjustStock(req, res) {
  res.json({
    data: await audited(req, "STOCK_ADJUST", "VARIANT", () =>
      adminRepository.adjustStock(
        req.validated.params.id,
        req.validated.body.delta,
        req.validated.body.reason,
        req.admin.admin_id,
      ),
    ),
  });
}
export async function orders(req, res) {
  res.json({ data: await adminRepository.orders(req.validated.query) });
}
export async function order(req, res) {
  res.json({ data: await adminRepository.order(req.validated.params.id) });
}
export async function updateOrderStatus(req, res) {
  res.json({
    data: await audited(req, "ORDER_STATUS_UPDATE", "ORDER", () =>
      adminRepository.updateOrderStatus(
        req.validated.params.id,
        req.validated.body.status,
        req.validated.body.reason,
        req.admin.admin_id,
        { code: req.validated.body.trackingCode, url: req.validated.body.trackingUrl },
      ),
    ),
  });
}
export async function categories(_req, res) {
  res.json({ data: await adminRepository.categories() });
}
export async function createCategory(req, res) {
  res
    .status(201)
    .json({
      data: await audited(req, "CATEGORY_CREATE", "CATEGORY", () =>
        adminRepository.createCategory(req.validated.body),
      ),
    });
}
export async function updateCategory(req, res) {
  res.json({
    data: await audited(req, "CATEGORY_UPDATE", "CATEGORY", () =>
      adminRepository.updateCategory(
        req.validated.params.id,
        req.validated.body,
      ),
    ),
  });
}
export async function deactivateCategory(req, res) {
  res.json({
    data: await audited(req, "CATEGORY_DEACTIVATE", "CATEGORY", () =>
      adminRepository.deactivateCategory(req.validated.params.id),
    ),
  });
}
export async function collections(_req, res) {
  res.json({ data: await adminRepository.collections() });
}
export async function createCollection(req, res) {
  res
    .status(201)
    .json({
      data: await audited(req, "COLLECTION_CREATE", "COLLECTION", () =>
        adminRepository.createCollection(req.validated.body),
      ),
    });
}
export async function updateCollection(req, res) {
  res.json({
    data: await audited(req, "COLLECTION_UPDATE", "COLLECTION", () =>
      adminRepository.updateCollection(
        req.validated.params.id,
        req.validated.body,
      ),
    ),
  });
}
export async function deactivateCollection(req, res) {
  res.json({
    data: await audited(req, "COLLECTION_DEACTIVATE", "COLLECTION", () =>
      adminRepository.deactivateCollection(req.validated.params.id),
    ),
  });
}
export async function settings(_req, res) {
  res.json({
    data: await adminRepository.settings(),
    integrations: { shipping: env.SHIPPING_PROVIDER !== 'disabled', payment: env.PAYMENT_PROVIDER !== 'disabled', email: env.EMAIL_PROVIDER !== 'disabled', imageStorage: env.STORAGE_PROVIDER !== 'disabled' },
    sales: await currentSalesReadiness(),
  });
}
export async function updateSettings(req, res) {
  const { reservationMinutes, checkoutEnabled } = req.validated.body;
  if (checkoutEnabled === true) {
    const { ready, missing } = await currentSalesReadiness();
    if (!ready) throw new AppError(409, "SALES_NOT_READY", `Ainda não dá para ligar as vendas: ${missing.join(" ")}`);
  }
  res.json({
    data: await audited(req, "SETTINGS_UPDATE", "SETTINGS", async () => ({
      ...(reservationMinutes === undefined ? {} : await adminRepository.updateReservationMinutes(reservationMinutes, req.admin.admin_id)),
      ...(checkoutEnabled === undefined ? {} : await adminRepository.updateCheckoutEnabled(checkoutEnabled, req.admin.admin_id)),
    })),
  });
}

export async function uploadImage(req,res) { res.status(201).json({data:await audited(req,'IMAGE_UPLOAD','PRODUCT',()=>imageService.upload({...req.validated.query,mime:req.get('content-type'),buffer:req.body}))}); }
export async function setPrimaryImage(req,res) { res.json({data:await audited(req,'IMAGE_SET_PRIMARY','PRODUCT',()=>adminRepository.setPrimaryImage(req.validated.params.id))}); }
export async function deleteImage(req,res) { await audited(req,'IMAGE_DELETE','PRODUCT',()=>imageService.delete(req.validated.params.id));res.status(204).end(); }
export async function paymentIncidents(req,res) { res.json({data:await adminRepository.paymentIncidents(req.validated.query)}); }
export async function resolvePaymentIncident(req,res) { res.json({data:await audited(req,'PAYMENT_INCIDENT_RESOLVE','PAYMENT_INCIDENT',()=>adminRepository.resolvePaymentIncident(req.validated.params.id,req.validated.body.resolution,req.admin.admin_id))}); }
export async function privacyRequests(req,res) { res.json({data:await adminRepository.privacyRequests(req.validated.query)}); }
export async function updatePrivacyRequest(req,res) { res.json({data:await audited(req,'PRIVACY_REQUEST_UPDATE','PRIVACY_REQUEST',()=>adminRepository.updatePrivacyRequest(req.validated.params.id,req.validated.body.status,req.validated.body.note,req.admin.admin_id))}); }
export async function team(_req,res) { res.json({data:await adminTeamService.list()}); }
export async function createInvite(req,res) { res.status(201).json({data:await audited(req,'ADMIN_INVITE_CREATE','ADMIN_INVITE',()=>adminTeamService.createInvite({...req.validated.body,createdBy:req.admin.admin_id}))}); }
export async function revokeInvite(req,res) { res.json({data:await audited(req,'ADMIN_INVITE_REVOKE','ADMIN_INVITE',()=>adminTeamService.revokeInvite(req.validated.params.id))}); }
export async function setAdminActive(req,res) { res.json({data:await audited(req,req.validated.body.active?'ADMIN_ACTIVATE':'ADMIN_DEACTIVATE','ADMIN_USER',()=>adminTeamService.setActive(req.validated.params.id,req.validated.body.active,req.admin.admin_id))}); }
// Public: the invited person has no session yet; the single-use token is the credential.
export async function inspectInvite(req,res) { res.json({data:await adminTeamService.inspect(req.validated.body.token)}); }
export async function acceptInvite(req,res) {
  const admin = await adminTeamService.accept(req.validated.body);
  await adminAuthRepository.audit({ adminId: admin.id, action: 'ADMIN_INVITE_ACCEPT', resourceType: 'ADMIN_USER', resourceId: String(admin.id), requestId: req.requestId });
  res.status(201).json({ data: admin });
}
export async function removeAdmin(req,res) { res.json({data:await audited(req,'ADMIN_REMOVE','ADMIN_USER',()=>adminTeamService.remove(req.validated.params.id,req.admin.admin_id))}); }
