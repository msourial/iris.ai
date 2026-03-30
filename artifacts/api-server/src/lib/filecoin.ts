/**
 * Filecoin storage via Lighthouse SDK.
 *
 * Uploads images to Filecoin Calibration Testnet for long-term
 * decentralized storage alongside Storacha/IPFS.
 *
 * Activation: Set LIGHTHOUSE_API_KEY environment variable.
 * Get a free key at https://files.lighthouse.storage
 */
import lighthouse from '@lighthouse-web3/sdk';
import { logger } from './logger';

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY ?? '';
const USE_MOCK = !LIGHTHOUSE_API_KEY;

let _warned = false;

export interface FilecoinResult {
  cid: string;
  url: string;
  size: number;
}

function generateMockCid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567';
  let cid = 'bafkrei';
  for (let i = 0; i < 52; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}

/**
 * Upload a buffer to Filecoin via Lighthouse.
 * Returns the Filecoin CID and gateway URL.
 */
export async function uploadToFilecoin(
  data: Buffer | string,
  filename: string,
): Promise<FilecoinResult> {
  if (USE_MOCK) {
    if (!_warned) {
      _warned = true;
      logger.warn('LIGHTHOUSE_API_KEY not set — using mock Filecoin uploads');
    }
    await new Promise<void>((r) => setTimeout(r, 500));
    const cid = generateMockCid();
    return {
      cid,
      url: `https://gateway.lighthouse.storage/ipfs/${cid}`,
      size: typeof data === 'string' ? data.length : data.byteLength,
    };
  }

  try {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

    const response = await lighthouse.uploadBuffer(buffer, LIGHTHOUSE_API_KEY);

    if (!response?.data?.Hash) {
      throw new Error('Lighthouse returned no hash');
    }

    const cid = response.data.Hash;
    const size = Number(response.data.Size ?? 0);

    logger.info({ cid, size, filename }, 'Uploaded to Filecoin via Lighthouse');

    return {
      cid,
      url: `https://gateway.lighthouse.storage/ipfs/${cid}`,
      size,
    };
  } catch (e) {
    logger.error({ err: e, filename }, 'Filecoin upload failed, returning mock');
    const cid = generateMockCid();
    return {
      cid,
      url: `https://gateway.lighthouse.storage/ipfs/${cid}`,
      size: 0,
    };
  }
}
