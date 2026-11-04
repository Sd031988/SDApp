/** Verify local texture bytes against a trusted manifest entry before decoding/upload. */
const MAX_BYTES = 64 * 1024 * 1024;
const MIME = Object.freeze({png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', jxl: 'image/jxl', avif: 'image/avif'});
function validate(entry) {
  if (!entry || Object.getPrototypeOf(entry) !== Object.prototype) throw new TypeError('entry must be a plain object');
  const keys = Object.keys(entry);
  if (keys.some(k => !['file','mime','sha256','bytes'].includes(k))) throw new TypeError('unexpected manifest key');
  const {file,mime,sha256,bytes} = entry;
  if (typeof file !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(file) || file.includes('..')) throw new TypeError('unsafe local filename');
  const ext = file.split('.').pop().toLowerCase();
  if (!Object.hasOwn(MIME,ext) || MIME[ext] !== mime) throw new TypeError('unsupported MIME or extension');
  if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(sha256)) throw new TypeError('invalid SHA-256');
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > MAX_BYTES) throw new RangeError('invalid byte size');
  return {file,mime,sha256,bytes};
}
function bytesOf(input) {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
  throw new TypeError('expected local binary buffer');
}
function hex(buffer) { return Array.from(new Uint8Array(buffer), x => x.toString(16).padStart(2,'0')).join(''); }
export async function verifyLocalTexture(entry, input, cryptoApi = globalThis.crypto) {
  const meta = validate(entry);
  const data = bytesOf(input);
  if (data.byteLength !== meta.bytes) throw new Error('texture size mismatch');
  if (!cryptoApi?.subtle?.digest) throw new Error('Web Crypto SHA-256 unavailable');
  // Copy prevents concurrent mutation of a caller-owned view while hashing.
  const copy = Uint8Array.from(data);
  const digest = hex(await cryptoApi.subtle.digest('SHA-256', copy));
  if (digest !== meta.sha256) throw new Error('texture SHA-256 mismatch');
  return Object.freeze({file:meta.file,mime:meta.mime,bytes:meta.bytes,sha256:digest,verified:true});
}
