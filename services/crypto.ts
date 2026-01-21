
/**
 * Zero-Knowledge Client-Side Encryption Service
 * Derives keys from password and uses AES-GCM for data encryption.
 */

export async function deriveKeys(password: string, salt: string): Promise<{ encryptionKey: CryptoKey; authHash: string }> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // 1. Derive the Encryption Key (Stays on client)
  const encryptionKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt + "_enc"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // 2. Derive the Auth Hash (Sent to server to verify identity)
  const authBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt + "_auth"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const authHash = btoa(String.fromCharCode(...new Uint8Array(authBits)));

  return { encryptionKey, authHash };
}

export async function encryptBlob(data: any, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(JSON.stringify(data));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptBlob(ciphertext: string, iv: string, key: CryptoKey): Promise<any> {
  const dec = new TextDecoder();
  const ivArr = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));
  const ctArr = new Uint8Array(atob(ciphertext).split("").map(c => c.charCodeAt(0)));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivArr },
    key,
    ctArr
  );

  return JSON.parse(dec.decode(decryptedBuffer));
}

export function generateSalt(): string {
  return btoa(String.fromCharCode(...window.crypto.getRandomValues(new Uint8Array(16))));
}
