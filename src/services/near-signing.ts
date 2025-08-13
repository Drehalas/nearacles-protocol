/**
 * NEP-413 signing utilities for NEAR intent authentication
 * Handles message signing and verification for oracle intents
 */

import { KeyPair } from 'near-api-js';
import { createHash } from 'node:crypto';
import bs58 from 'bs58';
import { NEARIntentMessage } from '../types/near-intent.js';

export interface NEP413Payload {
  message: string;
  nonce: string;
  recipient: string;
}

export interface NEP413SignedIntentData {
  standard: 'nep413';
  payload: NEP413Payload;
  signature: string;
  public_key: string;
}

export class NEARSigningService {
  private keyPair: KeyPair;

  constructor(privateKey: string) {
    this.keyPair = KeyPair.fromString(privateKey as string);
  }

  /**
   * Generates a cryptographically secure nonce for intent signing
   */
  generateNonce(): string {
    const nonce = new Uint8Array(32);
    crypto.getRandomValues(nonce);
    return Buffer.from(nonce).toString('base64');
  }

  /**
   * Serializes an intent message for signing according to NEP-413
   */
  serializeIntent(
    message: string,
    recipient: string,
    nonce: string,
    standard: string = 'nep413'
  ): Uint8Array {
    const payload = {
      standard,
      payload: {
        message,
        nonce,
        recipient,
      },
    };

    const serialized = JSON.stringify(payload);
    return new TextEncoder().encode(serialized);
  }

  /**
   * Signs an intent message using ED25519
   */
  signMessage(intentData: Uint8Array): { signature: Uint8Array; publicKey: string } {
    const signature = this.keyPair.sign(intentData);
    const publicKey = this.keyPair.getPublicKey().toString();

    return {
      signature: signature.signature,
      publicKey,
    };
  }

  /**
   * Creates a complete signed intent ready for broadcasting
   */
  createSignedIntent(
    intentMessage: NEARIntentMessage,
    recipient: string = 'intents.near'
  ): NEP413SignedIntentData {
    const messageStr = JSON.stringify(intentMessage);
    const nonce = this.generateNonce();
    const intentData = this.serializeIntent(messageStr, recipient, nonce);
    const { signature, publicKey } = this.signMessage(intentData);

    return {
      standard: 'nep413',
      payload: {
        message: messageStr,
        nonce,
        recipient,
      },
      signature: `ed25519:${bs58.encode(signature)}`,
      public_key: publicKey,
    };
  }

  /**
   * Creates a hash of an intent for unique identification
   */
  createIntentHash(intentMessage: NEARIntentMessage): string {
    const messageStr = JSON.stringify(intentMessage);
    return createHash('sha256').update(messageStr).digest('hex');
  }

  /**
   * Verifies a signed intent message
   */
  verifySignedIntent(signedData: NEP413SignedIntentData): boolean {
    try {
      const { payload, signature, public_key } = signedData;
      
      // Reconstruct the original intent data
      const intentData = this.serializeIntent(
        payload.message,
        payload.recipient,
        payload.nonce
      );

      // Extract signature from ed25519: prefix
      const signatureBytes = bs58.decode(signature.replace('ed25519:', ''));
      
      // Create KeyPair from public key for verification
      const publicKeyPair = KeyPair.fromString(public_key as string);
      
      // Verify signature
      return publicKeyPair.verify(intentData, signatureBytes);
    } catch (error) {
      console.error('Error verifying signed intent:', error);
      return false;
    }
  }

  /**
   * Extracts intent message from signed data
   */
  extractIntentMessage(signedData: NEP413SignedIntentData): NEARIntentMessage {
    return JSON.parse(signedData.payload.message);
  }
}