import { randomBytes } from "node:crypto";
import { storageProvider } from "../providers/storageProvider.js";
import { adminRepository } from "../repositories/adminRepository.js";
import { AppError } from "../utils/AppError.js";
import { IMAGE_TYPES as types } from "../utils/imageFormat.js";

export const imageService = {
  async upload({ productId, alt, mime, buffer, primary }) {
    const type = types[mime];
    if (!type || !buffer?.length || !type.magic(buffer))
      throw new AppError(400, "IMAGE_INVALID", "Imagem inválida.");
    const key = `${randomBytes(24).toString("hex")}.${type.ext}`;
    const stored = await storageProvider.put({ key, buffer, mime });
    try {
      return await adminRepository.addImage({
        productId,
        alt,
        mime,
        key: stored.providerAssetId ?? key,
        url: stored.url,
        primary,
      });
    } catch (error) {
      const cleanupKey = stored.providerAssetId ?? key;
      try {
        await storageProvider.delete(cleanupKey);
      } catch (cleanupError) {
        console.error({
          event: "IMAGE_UPLOAD_COMPENSATION_FAILED",
          providerAssetId: cleanupKey,
          errorCode: cleanupError.code ?? "STORAGE_PROVIDER_ERROR",
        });
      }
      throw error;
    }
  },
  async delete(id) {
    const image = await adminRepository.findImage(id);
    if (image?.storage_key) await storageProvider.delete(image.storage_key);
    await adminRepository.deleteImage(id);
  },
};
