/**
 * Utility helper functions for Nearacles Protocol
 */

import { createHash } from 'crypto';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Format NEAR amount from yoctoNEAR
 */
export function formatNearAmount(yoctoNear: string, decimals: number = 2): string {
  const nearAmount = BigInt(yoctoNear) / BigInt('1000000000000000000000000');
  return Number(nearAmount).toFixed(decimals);
}

/**
 * Parse NEAR amount to yoctoNEAR
 */
export function parseNearAmount(nearAmount: string): string {
  const amount = parseFloat(nearAmount);
  return (BigInt(Math.floor(amount * 1e24))).toString();
}

/**
 * Calculate hash of data
 */
export function calculateHash(data: unknown): string {
  const jsonString = JSON.stringify(data, typeof data === 'object' && data !== null ? Object.keys(data as object).sort() : undefined);
  return createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Validate NEAR account ID
 */
export function isValidAccountId(accountId: string): boolean {
  const accountIdRegex = /^[a-z0-9._-]+$/;
  return accountId.length >= 2 && 
         accountId.length <= 64 && 
         accountIdRegex.test(accountId) &&
         !accountId.startsWith('.') &&
         !accountId.endsWith('.') &&
         !accountId.includes('..');
}

/**
 * Convert string to BigInt safely
 */
export function stringToBigInt(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid numeric string: ${value}`);
  }
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string, decimals: number, displayDecimals: number = 4): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = BigInt(amount) / divisor;
  const fractionalPart = BigInt(amount) % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.substring(0, displayDecimals).replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}

/**
 * Parse token amount to smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const [wholePart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  return (BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(paddedFractional)).toString();
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw new Error(lastError ? lastError.message : 'Operation failed after retries');
}

/**
 * Validate Ethereum-style address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {} as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj as T;
  }
  
  return obj;
}
