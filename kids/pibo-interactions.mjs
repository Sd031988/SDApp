// Original Pibo touch interactions. Input geometry is proportional to the scene,
// so it works on small phones and wide desktop monitors without hard-coded pixels.
export function mouthTarget(rect){
 if(!rect||rect.width<=0||rect.height<=0)return null;
 return {x:rect.left+rect.width*.5,y:rect.top+rect.height*.43,
   radiusX:Math.max(26,rect.width*.16),radiusY:Math.max(30,rect.height*.20)};
}
export function mouthDrop(x,y,rect){
 const t=mouthTarget(rect);
 if(!t||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const dx=(x-t.x)/t.radiusX,dy=(y-t.y)/t.radiusY;
 return dx*dx+dy*dy<=1;
}
export function withinStage(x,y,rect){
 return rect&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
}
export function foodReaction(index){
 const foods=[
  {say:'Mmmh, Fisch! Das ist mein Lieblingsessen! 🐟',sound:'purr',food:24},
  {say:'Miau! Das Hähnchen ist lecker! 🍗',sound:'meow',food:28},
  {say:'Knack, knack! Eine Karotte! 🥕',sound:'chew',food:16},
  {say:'Oh, ein saftiger Apfel! 🍎',sound:'chew',food:15},
  {say:'Mein Katzenfutter! Lecker! 🥣',sound:'purr',food:20}
 ];
 return foods[Number.isInteger(index)&&index>=0&&index<foods.length?index:0];
}
export function pawReaction(count=0){
 return ['Nö, nö, nö! Meine Pfötchen sind kitzelig! 🐾',
 'Hihi, nicht an den Beinen! 😹',
 'Miau! Lieber hinter den Ohren kraulen! 💛'][Math.abs(count|0)%3];
}
