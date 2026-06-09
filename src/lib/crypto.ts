// Client-side AES-GCM encryption keyed off the user's ID + a per-user salt.
// Encryption happens in the browser so plaintext passwords never hit the server.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(userId: string): Promise<CryptoKey> {
  const salt = enc.encode(`vaultly:${userId}`);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(userId),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function getKey(userId: string) {
  let k = keyCache.get(userId);
  if (!k) { k = deriveKey(userId); keyCache.set(userId, k); }
  return k;
}

export async function encryptString(plain: string, userId: string): Promise<string> {
  if (!plain) return "";
  const key = await getKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  return `v1:${b64encode(iv.buffer as ArrayBuffer)}:${b64encode(ct)}`;
}

export async function decryptString(payload: string, userId: string): Promise<string> {
  if (!payload) return "";
  if (!payload.startsWith("v1:")) return payload; // legacy/plain fallback
  try {
    const [, ivB64, ctB64] = payload.split(":");
    const key = await getKey(userId);
    const iv = b64decode(ivB64);
    const ct = b64decode(ctB64);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return dec.decode(pt);
  } catch {
    return "••• decryption failed •••";
  }
}
