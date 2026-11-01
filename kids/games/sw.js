// Offline support only for SD Kids 2D mini-games. Does not control BlockWorld, Pibo or the hub root.
const CACHE='sd-kids-mini-v2';
const ASSETS=['./','./index.html','./play.html','./catalog.mjs','./rules.mjs','./profile.mjs','./play.mjs','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sd-kids-mini-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==='basic'&&url.pathname!=='/kids/games/sw.js')cache.put(request,response.clone()).catch(()=>{});
   return response;
  }catch{
   const cached=await cache.match(request,{ignoreSearch:true});
   if(cached)return cached;
   if(request.mode==='navigate')return cache.match('./index.html');
   return Response.error();
  }
 })());
});
