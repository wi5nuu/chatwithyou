// End-to-End Encryption using Web Crypto API
// Algorithm: ECDH P-256 + AES-GCM 256

const ECDH_ALGORITHM = 'ECDH';
const AES_ALGORITHM = 'AES-GCM';
const CURVE = 'P-256';
const KEY_LENGTH = 256;

// Generate ECDH key pair for user
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: ECDH_ALGORITHM,
      namedCurve: CURVE,
    },
    true, // extractable
    ['deriveKey']
  );
}

// Export public key to string for storage
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

// Import public key from string
export async function importPublicKey(publicKeyStr: string): Promise<CryptoKey> {
  const buffer = base64ToArrayBuffer(publicKeyStr);
  return await window.crypto.subtle.importKey(
    'spki',
    buffer,
    {
      name: ECDH_ALGORITHM,
      namedCurve: CURVE,
    },
    false,
    []
  );
}

// Export private key to string for storage
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToBase64(exported);
}

// Import private key from string
export async function importPrivateKey(privateKeyStr: string): Promise<CryptoKey> {
  const buffer = base64ToArrayBuffer(privateKeyStr);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    buffer,
    {
      name: ECDH_ALGORITHM,
      namedCurve: CURVE,
    },
    true,
    ['deriveKey']
  );
}

// Derive shared secret using ECDH
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: ECDH_ALGORITHM,
      public: publicKey,
    },
    privateKey,
    {
      name: AES_ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate random IV
function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Encrypt message using AES-GCM
export async function encryptMessage(
  sharedSecret: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string; hash: string }> {
  const iv = generateIV();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: AES_ALGORITHM,
      iv: iv as any,
    },
    sharedSecret,
    data
  );
  
  const ciphertext = arrayBufferToBase64(encrypted);
  const ivStr = arrayBufferToBase64(iv.buffer as ArrayBuffer);
  const hash = await generateHash(plaintext);
  
  return { ciphertext, iv: ivStr, hash };
}

// Decrypt message using AES-GCM
export async function decryptMessage(
  sharedSecret: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  try {
    const encryptedData = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: AES_ALGORITHM,
        iv: new Uint8Array(ivBuffer) as any,
      },
      sharedSecret,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted Message - Unable to decrypt]';
  }
}

// Generate hash for message integrity
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

// Verify message integrity
export async function verifyHash(content: string, expectedHash: string): Promise<boolean> {
  const actualHash = await generateHash(content);
  return actualHash === expectedHash;
}

// Utility: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Utility: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Store keys in localStorage (encrypted with a password-derived key in production)
export function storeKeys(keyPair: CryptoKeyPair): void {
  // In production, encrypt private key before storing
  // For now, we'll export and store (not recommended for production)
  exportPrivateKey(keyPair.privateKey).then(privateKeyStr => {
    exportPublicKey(keyPair.publicKey).then(publicKeyStr => {
      localStorage.setItem('lovechat_private_key', privateKeyStr);
      localStorage.setItem('lovechat_public_key', publicKeyStr);
    });
  });
}

// Retrieve keys from localStorage
export async function retrieveKeys(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey } | null> {
  const privateKeyStr = localStorage.getItem('lovechat_private_key');
  const publicKeyStr = localStorage.getItem('lovechat_public_key');
  
  if (!privateKeyStr || !publicKeyStr) return null;
  
  try {
    const privateKey = await importPrivateKey(privateKeyStr);
    const publicKey = await importPublicKey(publicKeyStr);
    return { privateKey, publicKey };
  } catch (error) {
    console.error('Error retrieving keys:', error);
    return null;
  }
}

// Clear stored keys
export function clearKeys(): void {
  localStorage.removeItem('lovechat_private_key');
  localStorage.removeItem('lovechat_public_key');
}

// Encrypt voice message (base64 audio)
export async function encryptVoiceMessage(
  sharedSecret: CryptoKey,
  audioBase64: string
): Promise<{ ciphertext: string; iv: string; hash: string }> {
  return encryptMessage(sharedSecret, audioBase64);
}

// Decrypt voice message
export async function decryptVoiceMessage(
  sharedSecret: CryptoKey,
  ciphertext: string,
  iv: string
): Promise<string> {
  return decryptMessage(sharedSecret, ciphertext, iv);
}
