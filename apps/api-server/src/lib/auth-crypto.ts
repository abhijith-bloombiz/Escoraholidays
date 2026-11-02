import crypto from "node:crypto";

/**
 * Hash a password using scrypt (Node.js standard library).
 * Format: "scrypt$<saltHex>$<derivedKeyHex>"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Validate that stored hash conforms to canonical scrypt hash format:
 * "scrypt$<saltHex:32>$<derivedKeyHex:128>"
 */
export function isValidPasswordHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") {
    return false;
  }
  if (!hash.startsWith("scrypt$")) {
    return false;
  }
  const parts = hash.split("$");
  if (parts.length !== 3) {
    return false;
  }
  const [, salt, expectedHashHex] = parts;
  if (!/^[0-9a-fA-F]{32}$/.test(salt)) {
    return false;
  }
  if (!/^[0-9a-fA-F]{128}$/.test(expectedHashHex)) {
    return false;
  }
  return true;
}

/**
 * Constant-time string comparison to prevent timing attacks on usernames and tokens.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Perform dummy timing-safe comparison on self to maintain constant time
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a plaintext password against an scrypt hash or development plaintext fallback.
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) {
    return false;
  }

  // Handle scrypt hash format: "scrypt$<salt>$<hash>"
  if (storedHashOrPlain.startsWith("scrypt$")) {
    const parts = storedHashOrPlain.split("$");
    if (parts.length !== 3) {
      return false;
    }
    const [, salt, expectedHashHex] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHashHex, "hex");
    if (derivedKey.length !== expectedBuffer.length) {
      crypto.timingSafeEqual(derivedKey, derivedKey);
      return false;
    }
    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  }

  // Fallback for development plaintext environment variable
  return timingSafeStringEqual(password, storedHashOrPlain);
}

/**
 * Validates file magic bytes to verify content is a genuine allowed image format.
 * Blocks non-image binaries, scripts, executables, and HTML/XSS payloads.
 */
export function detectImageMimeType(buffer: Buffer): { mimeType: string; extension: string } | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // JPEG / JFIF: FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png", extension: ".png" };
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { mimeType: "image/gif", extension: ".gif" };
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { mimeType: "image/webp", extension: ".webp" };
  }

  // AVIF: bytes 4-11 contain "ftypavif" or "ftypavis"
  if (buffer.length >= 12 && buffer.subarray(4, 12).toString("ascii").startsWith("ftypavi")) {
    return { mimeType: "image/avif", extension: ".avif" };
  }

  // HEIC / HEIF (Apple iPhone & Android cameras): bytes 4-8 'ftyp', then brand 'heic', 'heix', 'heim', 'heis', 'hevc', 'mif1', 'msf1'
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    if (["heic", "heix", "heim", "heis", "hevc", "mif1", "msf1"].includes(brand)) {
      return { mimeType: "image/heic", extension: ".heic" };
    }
  }

  // SVG: XML/SVG tag structure without active script or event injection
  const textPrefix = buffer.subarray(0, 4096).toString("utf8").trim().toLowerCase();
  if (
    (textPrefix.startsWith("<svg") || (textPrefix.startsWith("<?xml") && textPrefix.includes("<svg"))) &&
    !textPrefix.includes("<script") &&
    !textPrefix.includes("javascript:") &&
    !textPrefix.includes("onload=") &&
    !textPrefix.includes("onerror=") &&
    !textPrefix.includes("<iframe") &&
    !textPrefix.includes("data:text/html")
  ) {
    return { mimeType: "image/svg+xml", extension: ".svg" };
  }

  return null;
}

/**
 * Validates file magic bytes to verify content is an allowed image or web video format.
 * Supports JPEG, PNG, GIF, WebP, AVIF, SVG, MP4, WebM, and QuickTime MOV.
 */
export function detectMediaMimeType(buffer: Buffer): { mimeType: string; extension: string } | null {
  const imageMatch = detectImageMimeType(buffer);
  if (imageMatch) {
    return imageMatch;
  }

  if (!buffer || buffer.length < 12) {
    return null;
  }

  // MP4 / MOV video: 'ftyp' box at offset 4
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand.startsWith("qt")) {
      return { mimeType: "video/quicktime", extension: ".mov" };
    }
    return { mimeType: "video/mp4", extension: ".mp4" };
  }

  // WebM: EBML header 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { mimeType: "video/webm", extension: ".webm" };
  }

  return null;
}

