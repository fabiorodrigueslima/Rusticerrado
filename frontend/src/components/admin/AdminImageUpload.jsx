import { useState } from 'react';
import { mutateAdminResource } from '../../services/lojaApi.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 2000;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Phone and studio photos are often larger than the 5 MB limit: they are resized in the
// browser to at most 2000 px and saved as JPEG before upload. Small files go as they are.
async function prepareImage(file) {
  if (file.size <= 2.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  if (!blob) throw new Error('Não foi possível preparar a imagem. Tente outra foto.');
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

// A product photo: the server authorizes it, the browser sends it straight to Supabase
// Storage and the server checks what arrived before adding it to the product.
export function AdminImageUpload({ productId, csrfToken, onUploaded, defaultAlt = '', buttonLabel = 'Enviar foto' }) {
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const original = form.elements.image.files[0];
    if (!original || !TYPES.includes(original.type)) { setMessage('Selecione uma foto JPG, PNG ou WebP.'); return; }
    setBusy(true); setMessage('Preparando a foto…');
    try {
      const file = await prepareImage(original);
      if (file.size > MAX_BYTES) throw new Error('A foto continua maior que 5 MB. Tente outra foto.');
      setMessage('Enviando a foto…');
      const { data } = await mutateAdminResource('images/sign','POST',{ productId:Number(productId), primary:form.elements.primary.checked, mime:file.type, bytes:file.size, alt:form.elements.alt.value },csrfToken);
      const uploaded = await fetch(data.uploadUrl,{ method:data.method ?? 'PUT', headers:data.headers ?? { 'Content-Type':file.type }, body:file, credentials:'omit' });
      if (!uploaded.ok) throw new Error('Não foi possível enviar a foto. Tente novamente.');
      await mutateAdminResource('images/complete','POST',{ id:data.id },csrfToken);
      setMessage('Foto cadastrada.'); form.reset(); onUploaded?.();
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <form onSubmit={submit}>
    <label>Foto<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
    <label>Descrição da foto (para quem usa leitor de tela)<input name="alt" minLength="2" maxLength="180" defaultValue={defaultAlt} placeholder="Ex.: Tábua de churrasco em madeira com resina azul" required /></label>
    <label><input name="primary" type="checkbox" />Usar como foto principal</label>
    <button disabled={busy}>{busy ? 'Enviando…' : buttonLabel}</button>
    <p role="status">{message}</p>
  </form>;
}
