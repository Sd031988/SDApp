'use strict';
// Framework-independent HTTP adapter. Host must enforce HTTPS, body size and rate limits.
function makeHandler(service,{verifyIdToken,origin,enabled=false, rateLimit=null}={}){
 if(typeof verifyIdToken!=='function'||typeof origin!=='string'||!origin.startsWith('https://'))throw Error('invalid server configuration');
 const response=(status,body)=>({status,headers:{'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'},body});
 async function admin(req){
  const auth=req.headers?.authorization;
  if(typeof auth!=='string'||!auth.startsWith('Bearer '))return null;
  try{const decoded=await verifyIdToken(auth.slice(7),true);return decoded?.feedbackAdmin===true&&decoded.uid?{verifiedAdmin:true}:null;}catch{return null;}
 }
 return async req=>{
  const {method,path,body}=req;
  if(method==='POST' && JSON.stringify(body ?? null).length>24000)return response(413,{error:'too large'});
  if(method==='POST' && path==='/submit' && enabled && (!rateLimit || !(await rateLimit(req))))return response(429,{error:'try later'});
  if(method==='POST' && path==='/submit' && body?.website)return response(400,{error:'invalid request'});
  if(method==='POST'&&req.headers?.origin!==origin)return response(403,{error:'forbidden'});
  if(method==='POST'&&(!body||typeof body!=='object'||Array.isArray(body)))return response(400,{error:'invalid request'});
  try{
   if(method==='POST'&&path==='/withdraw'){await service.withdraw(body.id,body.token);return response(200,{ok:true});}
   if(method==='GET'&&path==='/voices')return response(200,{voices:enabled?await service.publicList():[]});
   if(method==='POST'&&path==='/submit'){if(!enabled)return response(503,{error:'disabled'});return response(201,await service.submit(body));}
   if(path.startsWith('/admin/')){
    const actor=await admin(req);if(!actor)return response(403,{error:'forbidden'});
    if(method==='GET'&&path==='/admin/pending')return response(200,{items:await service.pending(actor)});
    if(method==='POST'&&path==='/admin/remove'){await service.remove(body.id,actor);return response(200,{ok:true});}
    if(method==='POST'&&path==='/admin/approve'){if(!enabled)return response(503,{error:'disabled'});await service.approve(body.id,actor);return response(200,{ok:true});}
   }
   return response(404,{error:'not found'});
  }catch{return response(400,{error:'request failed'});}
 };
}
module.exports={makeHandler};
