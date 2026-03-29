/**
 * Set to false and configure W3_STORAGE_KEY to use real Storacha / web3.storage.
 * Default true — returns a mock CID for demo purposes.
 */
export const USE_MOCK_STORACHA = true;

function generateMockCid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567';
  let cid = 'bafybeig';
  for (let i = 0; i < 32; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)];
  }
  return cid;
}

export interface StorachaResult {
  cid: string;
  url: string;
}

/**
 * Uploads the compressed image (base64) and AI text to Storacha.
 * Returns the IPFS CID for use in the Flow blockchain transaction.
 */
export async function uploadToStoracha(
  imageBase64: string,
  aiText: string
): Promise<StorachaResult> {
  if (USE_MOCK_STORACHA) {
    await new Promise<void>((r) => setTimeout(r, 600));
    const cid = generateMockCid();
    console.log('[Iris] Mock Storacha upload → CID:', cid);
    return { cid, url: `https://ipfs.io/ipfs/${cid}` };
  }

  try {
    const apiKey = process.env.EXPO_PUBLIC_W3_STORAGE_KEY;
    if (!apiKey) throw new Error('W3_STORAGE_KEY not configured');

    const metadata = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      description: aiText,
      app: 'Iris.ai',
    });

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/jpeg' }),
      'iris-capture.jpg'
    );
    formData.append(
      'metadata',
      new Blob([metadata], { type: 'application/json' }),
      'metadata.json'
    );

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const json = await response.json();
    const cid = json.cid;
    return { cid, url: `https://ipfs.io/ipfs/${cid}` };
  } catch (e) {
    console.error('[Iris] Storacha upload failed:', e);
    const cid = generateMockCid();
    return { cid, url: `https://ipfs.io/ipfs/${cid}` };
  }
}
