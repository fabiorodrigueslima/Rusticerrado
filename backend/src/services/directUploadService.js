import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { query, transaction } from '../config/database.js';
import { storageProvider } from '../providers/storageProvider.js';
import { AppError } from '../utils/AppError.js';

const formats = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp' };

// Photos go straight from the browser to Cloudinary with a one-time signed authorization.
// Each authorization belongs to a product photo or to a course's cover photo.
export function createDirectUploadService({ db = query, tx = transaction, storage = storageProvider } = {}) {
  return {
    async prepare(input) {
      if (env.STORAGE_PROVIDER !== 'cloudinary' && !storage.signUpload) throw new AppError(503,'STORAGE_NOT_CONFIGURED','Upload direto não configurado.');
      const id = randomUUID();
      const signed = storage.signUpload(id);
      if (input.courseId) {
        const course = await db('SELECT id FROM app.cursos WHERE id=$1', [input.courseId]);
        if (!course.rowCount) throw new AppError(404,'COURSE_NOT_FOUND','Curso não encontrado.');
      } else {
        const product = await db('SELECT id FROM app.produtos WHERE id=$1', [input.productId]);
        if (!product.rowCount) throw new AppError(404,'PRODUCT_NOT_FOUND','Produto não encontrado.');
      }
      await db(`INSERT INTO app.image_upload_intents(id,product_id,curso_id,public_id,mime,bytes,alt,is_primary,expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '1 hour')`, [id,input.courseId ? null : input.productId,input.courseId ?? null,signed.publicId,input.mime,input.bytes,input.alt,Boolean(input.primary)]);
      return { id, ...signed };
    },
    async complete(id) {
      let replacedKey = null;
      const result = await tx(async client => {
        const found = await client.query('SELECT * FROM app.image_upload_intents WHERE id=$1 FOR UPDATE', [id]);
        const intent = found.rows[0];
        if (!intent) throw new AppError(404,'UPLOAD_NOT_FOUND','Upload não encontrado.');
        if (intent.completed_image_id) return (await client.query('SELECT * FROM app.produto_imagens WHERE id=$1', [intent.completed_image_id])).rows[0];
        if (intent.curso_id && intent.completed_at) return (await client.query('SELECT id,imagem_url url,imagem_alt alt FROM app.cursos WHERE id=$1', [intent.curso_id])).rows[0];
        if (new Date(intent.expires_at) <= new Date()) throw new AppError(410,'UPLOAD_EXPIRED','Upload expirado.');
        // Authoritative lookup: never trust URL, size, format or ownership from the browser.
        const asset = await storage.inspect(intent.public_id);
        if (asset.public_id !== intent.public_id || asset.resource_type !== 'image' || asset.format !== formats[intent.mime] || asset.bytes !== intent.bytes || asset.bytes > 5242880 || !asset.secure_url?.startsWith('https://res.cloudinary.com/')) throw new AppError(422,'IMAGE_INVALID','Imagem enviada não corresponde ao arquivo autorizado.');
        if (intent.curso_id) {
          const course = (await client.query('SELECT id,imagem_storage_key FROM app.cursos WHERE id=$1 FOR UPDATE', [intent.curso_id])).rows[0];
          if (!course) throw new AppError(404,'COURSE_NOT_FOUND','Curso não encontrado.');
          replacedKey = course.imagem_storage_key && course.imagem_storage_key !== intent.public_id ? course.imagem_storage_key : null;
          const updated = await client.query('UPDATE app.cursos SET imagem_url=$2,imagem_alt=$3,imagem_storage_key=$4 WHERE id=$1 RETURNING id,imagem_url url,imagem_alt alt', [intent.curso_id,asset.secure_url,intent.alt,intent.public_id]);
          await client.query('UPDATE app.image_upload_intents SET completed_at=now() WHERE id=$1', [id]);
          return updated.rows[0];
        }
        await client.query('SELECT id FROM app.produtos WHERE id=$1 FOR UPDATE', [intent.product_id]);
        if (intent.is_primary) await client.query('UPDATE app.produto_imagens SET principal=FALSE WHERE produto_id=$1', [intent.product_id]);
        const inserted = await client.query(`INSERT INTO app.produto_imagens(produto_id,url,alt_text,mime_type,ordem,principal,storage_key)
          VALUES($1,$2,$3,$4,(SELECT COALESCE(MAX(ordem),-1)+1 FROM app.produto_imagens WHERE produto_id=$1),$5,$6) RETURNING *`, [intent.product_id,asset.secure_url,intent.alt,intent.mime,intent.is_primary,intent.public_id]);
        await client.query('UPDATE app.image_upload_intents SET completed_image_id=$2,completed_at=now() WHERE id=$1', [id,inserted.rows[0].id]);
        return inserted.rows[0];
      });
      // The course's previous cover is removed only after the new one is saved.
      if (replacedKey) {
        try { await storage.delete(replacedKey); }
        catch (error) { console.error({ event: 'COURSE_IMAGE_CLEANUP_FAILED', providerAssetId: replacedKey, errorCode: error.code ?? 'STORAGE_PROVIDER_ERROR' }); }
      }
      return result;
    },
    async cleanup() {
      return tx(async client => {
      const expired = await client.query('SELECT id,public_id FROM app.image_upload_intents WHERE expires_at<now() AND completed_image_id IS NULL AND completed_at IS NULL ORDER BY expires_at LIMIT 5 FOR UPDATE SKIP LOCKED');
      for (const intent of expired.rows) {
        await storage.delete(intent.public_id);
        await client.query('DELETE FROM app.image_upload_intents WHERE id=$1 AND completed_image_id IS NULL AND completed_at IS NULL', [intent.id]);
      }
      return expired.rowCount;
      });
    },
  };
}
export const directUploadService = createDirectUploadService();
