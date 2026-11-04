/** Opt-in browser texture decode boundary. Caller must first verify hash and signature. */
export async function decodeVerifiedTexture({bytes, mime, verified, expectedWidth, expectedHeight, createBitmap = globalThis.createImageBitmap, makeBlob = parts => new Blob(parts, {type:mime}), signal} = {}) {
  if (verified !== true) throw new Error('Texture bytes must pass integrity and signature checks first');
  if (!['image/png','image/jpeg','image/webp','image/avif'].includes(mime)) throw new TypeError('Unsupported browser texture MIME');
  if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes)) throw new TypeError('Expected local bytes');
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!view.byteLength || view.byteLength > 67108864) throw new RangeError('Texture byte limit exceeded');
  if (!Number.isSafeInteger(expectedWidth) || !Number.isSafeInteger(expectedHeight) || expectedWidth < 1 || expectedHeight < 1 || expectedWidth > 16384 || expectedHeight > 16384 || expectedWidth * expectedHeight > 67108864) throw new RangeError('Invalid dimensions');
  if (typeof createBitmap !== 'function' || typeof makeBlob !== 'function') throw new TypeError('Browser decoder unavailable');
  if (signal?.aborted) throw new DOMException('Aborted','AbortError');
  const copy = new Uint8Array(view);
  const bitmap = await createBitmap(makeBlob([copy]));
  if (!bitmap || typeof bitmap.close !== 'function') throw new TypeError('Decoder did not return closable bitmap');
  if (signal?.aborted || bitmap.width !== expectedWidth || bitmap.height !== expectedHeight) {
    bitmap.close();
    if (signal?.aborted) throw new DOMException('Aborted','AbortError');
    throw new Error('Decoded texture dimensions mismatch');
  }
  return bitmap; // caller owns bitmap.close(); no GPU upload performed
}
