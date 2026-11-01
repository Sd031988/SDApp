'use strict';
// Trust only the official encrypted web app, not an arbitrary webpage supplied by the app.
const allowedHosts=new Set(['www.thesdhub.com','thesdhub.com']);
function isOfficialAgentUrl(value){
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&
    allowedHosts.has(url.hostname.toLowerCase())&&
    (url.pathname==='/agent'||url.pathname==='/agent/'||url.pathname.startsWith('/agent/'));
 }catch(_){return false}
}
function externalBrowserUrl(value){
 try{
  const url=new URL(value);
  if(url.username||url.password)return null;
  if(url.protocol==='https:'||url.protocol==='mailto:')return url.href;
 }catch(_){}
 return null;
}
module.exports={isOfficialAgentUrl,externalBrowserUrl};
