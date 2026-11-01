// Offline-only, non-transferable game stars. This is not a cryptocurrency or wallet.
export const MAX_STARS = 100000;
export function normalizeStars(value) {
  const n=Number(value);
  return Number.isFinite(n)?Math.max(0,Math.min(MAX_STARS,Math.floor(n))):0;
}
export function addStars(extras, amount) {
  const before=normalizeStars(extras.stars);
  const delta=Number.isFinite(amount)?Math.max(0,Math.floor(amount)):0;
  extras.stars=Math.min(MAX_STARS,before+delta);
  return extras.stars-before;
}
export function claimDailyGift(extras, day, reward) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
  // Refuse repeat claims and clock rollback within a saved profile.
  if(typeof extras.lastGift==='string'&&extras.lastGift>=day)return false;
  extras.lastGift=day;
  extras.gifts=Math.min(100000,Math.max(0,Math.floor(Number(extras.gifts)||0))+1);
  addStars(extras,reward.stars||0);
  return true;
}
export function localDay(date=new Date()) {
  const yyyy=date.getFullYear(),mm=String(date.getMonth()+1).padStart(2,'0'),dd=String(date.getDate()).padStart(2,'0');
  return yyyy+'-'+mm+'-'+dd;
}
