'use strict';
// Server-only domain logic. No HTTP endpoints or persistence; not enabled in production.
const {randomBytes,createHash,timingSafeEqual}=require('node:crypto');
const modes=new Set(['none','anonymous','name']);
const languages=new Set(['de','fa','ar','en']);
const hash=t=>createHash('sha256').update(t).digest('hex');
function field(v,max){if(typeof v!=='string'||v.length>max)throw Error('invalid field');return v.trim();}
function createFeedback(input,config){
 if(config?.enabled!==true || typeof config.consentVersion!=='string' || !config.consentVersion.trim())throw Error('disabled');
 if(input.adult!==true || input.internalConsent!==true || input.consentVersion!==config.consentVersion || !languages.has(input.language)||!modes.has(input.permission))throw Error('consent required');
 if(!Array.isArray(input.answers)||input.answers.length!==5)throw Error('invalid answers');
 const answers=input.answers.map(v=>field(v,2000));
 if(!answers.some(Boolean))throw Error('empty feedback');
 const firstName=input.permission==='name'?field(input.firstName,60):'';
 if(input.permission==='name'&&!firstName)throw Error('name required');
 const quote=input.permission==='none'?'':field(input.approvedQuote,2000);
 if(input.permission!=='none'&&(!quote||input.publicationConsent!==true||!answers.includes(quote)))throw Error('exact quote consent required');
 const token=randomBytes(32).toString('hex');
 return {token,record:{id:randomBytes(16).toString('hex'),tokenHash:hash(token),language:input.language,answers,firstName,quote,permission:input.permission,consentVersion:config.consentVersion,createdAt:new Date().toISOString(),status:'pending'}};
}
// Authorization must be established by trusted server middleware, never by request body.
function approve(record,actor){if(actor?.verifiedAdmin!==true||record.status!=='pending'||!['name','anonymous'].includes(record.permission)||!record.quote)throw Error('not allowed');return {...record,status:'published'};}
function publicView(record){if(record.status!=='published'||!['name','anonymous'].includes(record.permission)||!record.quote)return null;return {id:record.id,quote:record.quote,...(record.permission==='name'?{firstName:record.firstName}:{})};}
function withdraw(record,token){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!timingSafeEqual(Buffer.from(hash(token),'hex'),Buffer.from(record.tokenHash,'hex')))throw Error('invalid token');return {id:record.id,status:'withdrawn'};}
module.exports={createFeedback,approve,publicView,withdraw};
