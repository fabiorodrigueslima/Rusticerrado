import { describe,it,expect,vi } from 'vitest';
import { createDirectUploadService } from '../src/services/directUploadService.js';

describe('direct upload registration',()=>{
  const intent = {id:'id',public_id:'products/id',product_id:1,mime:'image/png',bytes:123,alt:'Flower',is_primary:false,expires_at:new Date(Date.now()+60000)};
  const asset = {public_id:'products/id',resource_type:'image',format:'png',bytes:123,secure_url:'https://res.cloudinary.com/test/image/upload/products/id.png'};
  function setup(value=asset,row=intent) {
    const query=vi.fn(async(sql)=>sql.includes('FROM app.image_upload_intents')?{rows:[row]}:sql.startsWith('INSERT INTO app.produto_imagens')?{rows:[{id:7}]}:{rows:[{id:7}],rowCount:1});
    const storage={inspect:vi.fn(async()=>value)};
    return {query,storage,service:createDirectUploadService({tx:work=>work({query}),storage})};
  }
  it('checks the authoritative cloud asset before registering it',async()=>{
    const {service,storage,query}=setup();expect(await service.complete('id')).toEqual({id:7});expect(storage.inspect).toHaveBeenCalledWith('products/id');expect(query.mock.calls.some(([sql])=>sql.includes('UPDATE app.image_upload_intents'))).toBe(true);
  });
  it.each([{bytes:9999999},{public_id:'another-owner'},{format:'svg'},{secure_url:'javascript:alert(1)'}])('rejects forged or mismatched metadata %j',async(change)=>{
    const {service,query}=setup({...asset,...change});await expect(service.complete('id')).rejects.toMatchObject({code:'IMAGE_INVALID'});expect(query.mock.calls.some(([sql])=>sql.startsWith('INSERT'))).toBe(false);
  });
  it('replays completion without registering or looking up another asset',async()=>{
    const {service,storage,query}=setup(asset,{...intent,completed_image_id:7});await service.complete('id');expect(storage.inspect).not.toHaveBeenCalled();expect(query.mock.calls.some(([sql])=>sql.startsWith('INSERT'))).toBe(false);
  });
  it('rejects an expired intent',async()=>{const {service}=setup(asset,{...intent,expires_at:new Date(0)});await expect(service.complete('id')).rejects.toMatchObject({code:'UPLOAD_EXPIRED'})});
});

describe('course cover photo through the same direct upload',()=>{
  const intent = {id:'id',public_id:'products/id',product_id:null,curso_id:3,mime:'image/png',bytes:123,alt:'Curso de cerâmica',is_primary:false,expires_at:new Date(Date.now()+60000),completed_at:null};
  const asset = {public_id:'products/id',resource_type:'image',format:'png',bytes:123,secure_url:'https://res.cloudinary.com/test/image/upload/products/id.png'};
  function setup({row=intent,oldKey='products/old',value=asset}={}) {
    const query=vi.fn(async(sql)=>sql.includes('FROM app.image_upload_intents')?{rows:[row]}:sql.includes('FROM app.cursos WHERE id=$1 FOR UPDATE')?{rows:[{id:3,imagem_storage_key:oldKey}]}:sql.startsWith('UPDATE app.cursos')?{rows:[{id:3,url:asset.secure_url,alt:intent.alt}]}:{rows:[{id:3,url:'u',alt:'a'}],rowCount:1});
    const storage={inspect:vi.fn(async()=>value),delete:vi.fn(async()=>{})};
    return {query,storage,service:createDirectUploadService({tx:work=>work({query}),storage})};
  }
  it('sets the course photo, marks the upload done and removes the previous photo afterwards',async()=>{
    const {service,storage,query}=setup();
    expect(await service.complete('id')).toEqual({id:3,url:asset.secure_url,alt:intent.alt});
    const sqls=query.mock.calls.map(([sql])=>sql);
    expect(sqls.some(sql=>sql.startsWith('UPDATE app.cursos SET imagem_url'))).toBe(true);
    expect(sqls.some(sql=>sql.includes('SET completed_at=now()'))).toBe(true);
    expect(sqls.some(sql=>sql.startsWith('INSERT INTO app.produto_imagens'))).toBe(false);
    expect(storage.delete).toHaveBeenCalledWith('products/old');
  });
  it('keeps the new photo even if removing the old one fails',async()=>{
    const {service,storage}=setup();storage.delete.mockRejectedValueOnce(new Error('offline'));
    const error=vi.spyOn(console,'error').mockImplementation(()=>{});
    await expect(service.complete('id')).resolves.toMatchObject({id:3});
    expect(error).toHaveBeenCalled();error.mockRestore();
  });
  it('does not touch the course when Cloudinary disagrees, and replays a finished upload',async()=>{
    const forged=setup({value:{...asset,bytes:999}});await expect(forged.service.complete('id')).rejects.toMatchObject({code:'IMAGE_INVALID'});
    expect(forged.query.mock.calls.some(([sql])=>sql.startsWith('UPDATE app.cursos'))).toBe(false);
    const done=setup({row:{...intent,completed_at:new Date()}});await done.service.complete('id');
    expect(done.storage.inspect).not.toHaveBeenCalled();expect(done.storage.delete).not.toHaveBeenCalled();
  });
});
