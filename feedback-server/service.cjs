'use strict';
// Server-only service. Supply a trusted server-side Firestore Admin SDK instance.
// No client access or deployment is enabled here.
const domain=require('./domain.cjs');
const idOK=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
function makeService(db,config){
 const collection=db.collection('feedbackPrivate');
 const ref=id=>{if(!idOK(id))throw Error('invalid id');return collection.doc(id);};
 const admin=actor=>{if(actor?.verifiedAdmin!==true)throw Error('not allowed');};
 return {
 async submit(input){
   const {record,token}=domain.createFeedback(input,config);
   await ref(record.id).create(record);
   return {id:record.id,token};
 },
 async approve(id,actor){
   admin(actor);
   if(config?.enabled!==true)throw Error('disabled');
   await db.runTransaction(async tx=>{
     const doc=ref(id),snap=await tx.get(doc);
     if(!snap.exists)throw Error('not found');
     tx.set(doc,domain.approve(snap.data(),actor));
   });
 },
 async withdraw(id,token){
   await db.runTransaction(async tx=>{
     const doc=ref(id),snap=await tx.get(doc);
     if(!snap.exists)throw Error('not found');
     domain.withdraw(snap.data(),token);
     tx.delete(doc);
   });
 },
 async remove(id,actor){
   admin(actor);
   await ref(id).delete();
 },
 async pending(actor){
   admin(actor);
   const snapshot=await collection.where('status','==','pending').limit(100).get();
   return snapshot.docs.map(doc=>{const {tokenHash,...safe}=doc.data();return safe;});
 },
 // Für einen täglichen Server-Job: löscht abgelaufene, nicht veröffentlichte Rückmeldungen
 async purgeExpired(now=new Date()){
   const days=Number.isInteger(config?.retentionDays)&&config.retentionDays>0?config.retentionDays:domain.DEFAULT_RETENTION_DAYS;
   const cutoff=new Date(now.getTime()-days*864e5).toISOString();
   const snapshot=await collection.where('createdAt','<',cutoff).limit(500).get();
   let deleted=0;
   for(const doc of snapshot.docs){if(domain.isExpired(doc.data(),now,days)){await doc.ref.delete();deleted++;}}
   return {deleted};
 },
 async publicList(){
   if(config?.enabled!==true)return [];
   const snapshot=await collection.where('status','==','published').limit(100).get();
   return snapshot.docs.map(doc=>domain.publicView(doc.data())).filter(Boolean);
 }
 };
}
module.exports={makeService};
