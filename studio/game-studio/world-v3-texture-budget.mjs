/** Conservative opt-in texture allocation budget; no decoding or GPU upload. */
const MAX_DIMENSION = 16384;
const MAX_PIXELS = 67108864;
const MAX_BYTES = 268435456;
const validInt = n => Number.isSafeInteger(n) && n > 0;
export function estimateTextureAllocation({width, height, channels = 4, mipmaps = false} = {}) {
  if (!validInt(width) || !validInt(height) || width > MAX_DIMENSION || height > MAX_DIMENSION)
    throw new RangeError('Invalid texture dimensions');
  if (![1, 2, 3, 4].includes(channels)) throw new RangeError('Invalid channel count');
  if (typeof mipmaps !== 'boolean') throw new TypeError('mipmaps must be boolean');
  const pixels = width * height;
  if (pixels > MAX_PIXELS) throw new RangeError('Texture pixel budget exceeded');
  let w = width, h = height, bytes = 0, levels = 0;
  do {
    bytes += w * h * channels;
    if (bytes > MAX_BYTES) throw new RangeError('Texture memory budget exceeded');
    levels++;
    if (!mipmaps || (w === 1 && h === 1)) break;
    w = Math.max(1, Math.floor(w / 2));
    h = Math.max(1, Math.floor(h / 2));
  } while (true);
  return Object.freeze({width, height, channels, mipmaps, pixels, levels, estimatedBytes: bytes});
}
/** Validates PNG IHDR dimensions before invoking a decoder. Does not validate CRC or decode pixels. */
export function inspectPngDimensions(bytes) {
  if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes)) throw new TypeError('Expected bytes');
  const b = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sig = [137,80,78,71,13,10,26,10];
  if (b.length < 33 || !sig.every((v,i) => b[i] === v) || b[8] !== 0 || b[9] !== 0 || b[10] !== 0 || b[11] !== 13 ||
      b[12] !== 73 || b[13] !== 72 || b[14] !== 68 || b[15] !== 82) throw new Error('Invalid PNG IHDR');
  const u32 = o => (b[o] * 16777216 + b[o+1] * 65536 + b[o+2] * 256 + b[o+3]) >>> 0;
  const width = u32(16), height = u32(20);
  const depth = b[24], type = b[25];
  const allowed = {0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
  if (!Object.hasOwn(allowed,type) || !allowed[type].includes(depth) || b[26] !== 0 || b[27] !== 0 || ![0,1].includes(b[28]))
    throw new Error('Invalid PNG IHDR parameters');
  return Object.freeze({width,height,bitDepth:depth,colorType:type});
}
