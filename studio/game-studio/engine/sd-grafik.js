/* SD Grafik – Engine-Modul für Qualität „Mittel“ und „Hoch“:
   🌤 Himmel mit Lichtstreuung (Farbe hängt vom Sonnenstand ab), ziehende Wolken, Sterne, Sonnenscheibe und Abendrot
   💡 Umgebungslicht kommt aus diesem Himmel (Reflexions-Würfel, wird mit der Tageszeit neu berechnet)
   ✨ Nur „Hoch“: Spiegelungen auf glatten und nassen Flächen (SSR) und Sonnenstrahlen durch Bäume und Häuser
   Steuerung im Skript: sd.grafik({ wolken: 0..1, strahlen: true/false, spiegelungen: true/false }) */
'use strict';
(window.SDModule = window.SDModule || []).push(function (ctx) {
  const { BAB, V, klemme, szene, kamera, sonne } = ctx, Q = (ctx.opt && ctx.opt.qualitaet) || 'mittel';
  if (Q === 'niedrig' || !BAB.ShaderMaterial) return { api: { grafik: () => false } };
  BAB.Effect.ShadersStore.sdHimmelVertexShader = `precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vRicht;
void main(){ vRicht = position; gl_Position = worldViewProjection * vec4(position, 1.0); }`;
  BAB.Effect.ShadersStore.sdHimmelFragmentShader = `precision highp float; varying vec3 vRicht; uniform vec3 sonnenRicht; uniform float zeit, wolken, nacht, regen;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float rausch(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += rausch(p) * a; p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
void main(){
  vec3 d = normalize(vRicht); float sy = sonnenRicht.y, h = max(d.y, 0.0), cosT = dot(d, sonnenRicht);
  float tagF = smoothstep(-0.12, 0.3, sy), daem = exp(-abs(sy) * 7.0) * smoothstep(-0.28, 0.0, sy);
  vec3 zenit = mix(vec3(0.012, 0.018, 0.05), vec3(0.13, 0.32, 0.68), tagF), horiz = mix(vec3(0.04, 0.05, 0.09), vec3(0.6, 0.72, 0.87), tagF);
  horiz = mix(horiz, vec3(1.0, 0.48, 0.22), daem * 0.75);
  vec3 sonnenF = mix(vec3(1.0, 0.5, 0.25), vec3(1.0, 0.96, 0.88), smoothstep(0.0, 0.4, sy)), himmel = mix(horiz, zenit, pow(h, 0.42));
  himmel += vec3(1.0, 0.42, 0.18) * daem * pow(max(cosT, 0.0), 4.0) * (1.0 - h) * 0.9;
  himmel += sonnenF * (pow(max(cosT, 0.0), 80.0) * 0.6 + pow(max(cosT, 0.0), 8.0) * 0.12) * smoothstep(-0.1, 0.05, sy);
  himmel += sonnenF * smoothstep(0.99935, 0.9997, cosT) * 20.0 * smoothstep(-0.04, 0.02, sy) * (1.0 - regen * 0.9);
  if (nacht > 0.01 && d.y > 0.0){ vec3 z = floor(d * 380.0); float st = step(0.9982, h3(z)) * (0.5 + 0.5 * sin(zeit * 2.0 + h3(z + 3.1) * 40.0)); himmel += vec3(0.9, 0.92, 1.0) * st * nacht * smoothstep(0.0, 0.25, d.y) * (1.0 - regen); 
    himmel += vec3(0.75, 0.8, 0.9) * smoothstep(0.9994, 0.9997, dot(d, normalize(vec3(-sonnenRicht.x, 0.6, -sonnenRicht.z)))) * nacht * 2.5; }
  if (d.y < 0.0) himmel = mix(horiz * 0.7, vec3(0.07, 0.08, 0.09) * (0.15 + 0.85 * tagF), min(1.0, -d.y * 3.0));
  else {
    vec2 uv = d.xz / (d.y + 0.12) * 1.15 + vec2(zeit * 0.005, zeit * 0.0018); float n = fbm(uv * 1.4), bedeckt = clamp(wolken + regen * 0.5, 0.0, 1.0);
    float dichte = smoothstep(1.0 - bedeckt * 0.75 - 0.18, 1.0 - bedeckt * 0.75 + 0.22, n), n2 = fbm(uv * 1.4 + sonnenRicht.xz * 0.06), licht = clamp((n - n2) * 4.0 + 0.65, 0.25, 1.0);
    vec3 wolkeHell = mix(vec3(0.07, 0.08, 0.11), mix(vec3(1.0, 0.66, 0.5), vec3(1.0), smoothstep(0.05, 0.4, sy)), smoothstep(-0.14, 0.08, sy));
    vec3 wolke = wolkeHell * licht + sonnenF * pow(max(cosT, 0.0), 6.0) * 0.35 * smoothstep(-0.05, 0.1, sy) * (1.0 - dichte * 0.5);
    wolke = mix(wolke, wolke * vec3(0.5, 0.52, 0.56), regen);
    himmel = mix(himmel, wolke, dichte * smoothstep(0.0, 0.16, d.y) * 0.96);
  }
  himmel = mix(himmel, himmel * vec3(0.52, 0.55, 0.6) + vec3(0.04), regen * 0.65);
  gl_FragColor = vec4(himmel, 1.0);
}`;
  const E = { wolken: 0.45, strahlen: Q === 'hoch', spiegelungen: Q === 'hoch', an: false, zeit: 0 };
  let kuppel = null, mat = null, probe = null, letzteSonne = null, probeZeit = 0, strahlen = null, sonnenPunkt = null, ssr = null;
  // Mit Tageszeit: echte Sonnenhöhe (auch unter dem Horizont), sonst die Richtung des Sonnenlichts
  const sonnenRicht = () => { const h = ctx.sd.uhrzeit; if (h == null) return sonne.direction.scale(-1).normalize(); const e = Math.sin((h - 6) / 12 * Math.PI), az = (h / 24) * Math.PI * 2 + 0.6;
    return V(Math.cos(az) * Math.cos(Math.asin(klemme(e, -1, 1))), e, Math.sin(az) * 0.6).normalize(); };
  const regenStaerke = () => { const ps = szene.particleSystems.find(q => q.name === 'regen'); return ps ? klemme(ps.emitRate / 7000, 0, 1) : 0; };
  // Horizontfarbe wie im Shader – für den Nebel, damit Ferne und Himmel nahtlos ineinander übergehen
  function horizont(s, r) { const sy = s.y, t = klemme((sy + 0.12) / 0.42, 0, 1), tagF = t * t * (3 - 2 * t), dm = Math.exp(-Math.abs(sy) * 7) * klemme((sy + 0.28) / 0.28, 0, 1);
    let c = BAB.Color3.Lerp(new BAB.Color3(0.04, 0.05, 0.09), new BAB.Color3(0.6, 0.72, 0.87), tagF); c = BAB.Color3.Lerp(c, new BAB.Color3(0.95, 0.55, 0.35), dm * 0.5);
    return BAB.Color3.Lerp(c, c.multiply(new BAB.Color3(0.52, 0.55, 0.6)).add(new BAB.Color3(0.04, 0.04, 0.04)), r * 0.65); }

  function einschalten() {
    const alt = szene.getMeshByName('himmelKuppel'); if (!alt || E.an) return; E.an = true;
    kuppel = BAB.MeshBuilder.CreateSphere('sdHimmel', { diameter: 2400, segments: 32, sideOrientation: BAB.Mesh.BACKSIDE }, szene); kuppel.infiniteDistance = true; kuppel.isPickable = false; kuppel.applyFog = false;
    mat = new BAB.ShaderMaterial('sdHimmelMat', szene, { vertex: 'sdHimmel', fragment: 'sdHimmel' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'sonnenRicht', 'zeit', 'wolken', 'nacht', 'regen'] }); mat.backFaceCulling = false; mat.disableDepthWrite = true; kuppel.material = mat;
    alt.setEnabled(false); const sc = szene.getMeshByName('sonnenScheibe'); if (sc) sc.isVisible = false;
    const alteProbe = szene.getReflectionProbeByName ? szene.getReflectionProbeByName('umgebung') : null;
    probe = new BAB.ReflectionProbe('sdUmgebung', Q === 'hoch' ? 256 : 128, szene, true, true); probe.renderList.push(kuppel); probe.refreshRate = BAB.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; szene.environmentTexture = probe.cubeTexture;
    if (alteProbe) alteProbe.dispose();
    if (Q === 'hoch') { const pipe = szene.postProcessRenderPipelineManager.supportedPipelines.find(p => p.name === 'pipeline'); if (pipe) { pipe.sharpenEnabled = true; pipe.sharpen.edgeAmount = 0.25; } effekte(); }
  }
  function effekte() {
    if (E.strahlen && !strahlen && BAB.VolumetricLightScatteringPostProcess) try {
      sonnenPunkt = BAB.MeshBuilder.CreatePlane('sdSonnenPunkt', { size: 70 }, szene); sonnenPunkt.billboardMode = BAB.Mesh.BILLBOARDMODE_ALL; sonnenPunkt.infiniteDistance = true; sonnenPunkt.isPickable = false; sonnenPunkt.applyFog = false;
      const sm = new BAB.StandardMaterial('sdSonnenPunktMat', szene); sm.disableLighting = true; sm.emissiveColor = new BAB.Color3(1, 0.92, 0.78); const tex = new BAB.DynamicTexture('sdSonnenTex', 64, szene, false), c = tex.getContext(), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); tex.update(); tex.hasAlpha = true; sm.opacityTexture = tex; sonnenPunkt.material = sm; sonnenPunkt.isVisible = false;
      strahlen = new BAB.VolumetricLightScatteringPostProcess('sdStrahlen', { postProcessRatio: 0.5, passRatio: 0.35 }, kamera, sonnenPunkt, 60, BAB.Texture.BILINEAR_SAMPLINGMODE, ctx.engine, false);
      strahlen.exposure = 0.18; strahlen.decay = 0.965; strahlen.weight = 0.55; strahlen.density = 0.9;
    } catch (e) { console.warn('Sonnenstrahlen nicht möglich', e.message); strahlen = null; }
    if (E.spiegelungen && !ssr && BAB.SSRRenderingPipeline) try {
      ssr = new BAB.SSRRenderingPipeline('sdSSR', szene, [kamera], false, BAB.Constants.TEXTURETYPE_UNSIGNED_BYTE);
      ssr.thickness = 0.6; ssr.selfCollisionNumSkip = 2; ssr.enableAutomaticThicknessComputation = false; ssr.maxDistance = 160; ssr.maxSteps = 120; ssr.step = 1.2; ssr.strength = 0.9; ssr.reflectionSpecularFalloffExponent = 2; ssr.reflectivityThreshold = 0.06; ssr.roughnessFactor = 0.15; ssr.blurDispersionStrength = 0.02; ssr.blurDownsample = 1; ssr.ssrDownsample = 1; ssr.attenuateFacingCamera = true; ssr.attenuateScreenBorders = true; ssr.clipToFrustum = true; ssr.useFresnel = true; ssr.environmentTexture = probe ? probe.cubeTexture : null;
    } catch (e) { console.warn('Spiegelungen nicht möglich', e.message); ssr = null; }
  }
  function grafik(o) { o = o || {}; if (o.wolken != null) E.wolken = klemme(o.wolken, 0, 1); if (o.strahlen != null) E.strahlen = !!o.strahlen && Q === 'hoch'; if (o.spiegelungen != null) E.spiegelungen = !!o.spiegelungen && Q === 'hoch';
    if (!E.strahlen && strahlen) { strahlen.dispose(kamera); strahlen = null; } if (!E.spiegelungen && ssr) { ssr.dispose(); ssr = null; } if (E.an && Q === 'hoch') effekte(); probeZeit = 99; return true; }

  return {
    api: { grafik, get grafikInfo() { return { qualitaet: Q, himmel: E.an, wolken: E.wolken, strahlen: !!strahlen, spiegelungen: !!ssr }; } },
    update(dt) {
      if (!E.an) { einschalten(); if (!E.an) return; }
      E.zeit += dt; const s = sonnenRicht(), r = regenStaerke(), nacht = klemme(-s.y * 5 + 0.4, 0, 1);
      mat.setVector3('sonnenRicht', s); mat.setFloat('zeit', E.zeit); mat.setFloat('wolken', E.wolken); mat.setFloat('nacht', nacht); mat.setFloat('regen', r);
      const fog = horizont(s, r); szene.fogColor = fog; szene.clearColor = BAB.Color4.FromColor3(fog, 1);
      // Umgebungslicht neu berechnen, wenn sich die Sonne merklich bewegt hat (spart Rechenzeit)
      probeZeit += dt; if (probe && (probeZeit > 20 || !letzteSonne || (probeZeit > 1.5 && BAB.Vector3.Dot(letzteSonne, s) < 0.99985))) { probe.cubeTexture.resetRefreshCounter(); letzteSonne = s.clone(); probeZeit = 0; }
      if (sonnenPunkt) { sonnenPunkt.position = s.scale(1000); const an = s.y > 0.02 && r < 0.6; if (strahlen) strahlen.exposure = an ? 0.18 * klemme(s.y * 5, 0, 1) * (1 - r) : 0; }
    },
  };
});
