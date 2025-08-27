import {
  randomBytes,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import { CryptoResult, DecryptedResult } from "./types";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derives a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypts data with AES-256-CBC using a password
 */
export function encrypt(data: string, password: string): CryptoResult {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return {
    data: encrypted,
    iv,
    salt,
  };
}

/**
 * Decrypts data with AES-256-CBC using a password
 */
export function decrypt(
  encryptedData: Buffer,
  iv: Buffer,
  salt: Buffer,
  password: string
): DecryptedResult {
  const key = deriveKey(password, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return {
    data: decrypted.toString("utf8"),
  };
}

/**
 * Combines encrypted data, IV, and salt into a single buffer for storage
 */
export function packEncryptedData(result: CryptoResult): Buffer {
  // Format: [4 bytes salt length][salt][4 bytes iv length][iv][encrypted data]
  const saltLengthBuffer = Buffer.allocUnsafe(4);
  saltLengthBuffer.writeUInt32BE(result.salt.length, 0);

  const ivLengthBuffer = Buffer.allocUnsafe(4);
  ivLengthBuffer.writeUInt32BE(result.iv.length, 0);

  return Buffer.concat([
    saltLengthBuffer,
    result.salt,
    ivLengthBuffer,
    result.iv,
    result.data,
  ]);
}

/**
 * Unpacks encrypted data, IV, and salt from a single buffer
 */
export function unpackEncryptedData(packedData: Buffer): {
  data: Buffer;
  iv: Buffer;
  salt: Buffer;
} {
  let offset = 0;

  // Read salt length and salt
  const saltLength = packedData.readUInt32BE(offset);
  offset += 4;
  const salt = packedData.subarray(offset, offset + saltLength);
  offset += saltLength;

  // Read IV length and IV
  const ivLength = packedData.readUInt32BE(offset);
  offset += 4;
  const iv = packedData.subarray(offset, offset + ivLength);
  offset += ivLength;

  // The rest is encrypted data
  const data = packedData.subarray(offset);

  return { data, iv, salt };
}
