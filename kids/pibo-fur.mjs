// Original, deterministic low-poly fur layout for Pibo. No downloaded meshes or textures.
// Fibonacci sampling avoids random frame-to-frame changes and creates stable instance counts.
export function furSamples({count=240, radii=[.76,.7,.66], frontLimit=.16, minY=-.82}={}) {
  if(!Number.isInteger(count)||count<1||count>1200) throw new RangeError('Invalid fur instance count');
  if(!Array.isArray(radii)||radii.length!==3||radii.some(r=>!Number.isFinite(r)||r<=0)) throw new RangeError('Invalid fur radii');
  const points=[], total=count*5, golden=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<total&&points.length<count;i++){
    const y=1-2*(i+.5)/total, radial=Math.sqrt(Math.max(0,1-y*y));
    const phi=i*golden, x=Math.cos(phi)*radial,z=Math.sin(phi)*radial;
    if(y<minY || (z>frontLimit&&y<.78)) continue; // face, chest and belly remain readable
    const [rx,ry,rz]=radii;
    const nx=x/rx,ny=y/ry,nz=z/rz,norm=Math.hypot(nx,ny,nz);
    const variation=(i*37%19)/19;
    points.push({position:[rx*x,ry*y,rz*z],normal:[nx/norm,ny/norm,nz/norm],length:.7+.55*variation,tint:i%7});
  }
  return points;
}
