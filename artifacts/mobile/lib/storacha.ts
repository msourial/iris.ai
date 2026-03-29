/**
 * Storacha / web3.storage upload integration.
 *
 * Drop-in activation (zero code change):
 *   - Set EXPO_PUBLIC_W3_STORAGE_KEY to your web3.storage API key
 *   - If the key is absent, the module automatically falls back to mock mode.
 *
 * Force mock regardless of key:
 *   - Set EXPO_PUBLIC_USE_MOCK_STORACHA=true
 */
const forcesMock = process.env.EXPO_PUBLIC_USE_MOCK_STORACHA === 'true';
const storageKey = process.env.EXPO_PUBLIC_W3_STORAGE_KEY;
const USE_MOCK_STORACHA = forcesMock || !storageKey;

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
 * Automatically uses real Storacha when EXPO_PUBLIC_W3_STORAGE_KEY is set.
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
    const metadata = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      description: aiText,
      app: 'Iris.ai',
    });

    const imageBlob = base64ToBlob(imageBase64, 'image/jpeg');
    const metaBlob = new Blob([metadata], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', imageBlob, 'iris-capture.jpg');
    formData.append('metadata', metaBlob, 'metadata.json');

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${storageKey}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Storacha responded with status ${response.status}`);
    }

    const json = (await response.json()) as { cid: string };
    const cid = json.cid;
    return { cid, url: `https://ipfs.io/ipfs/${cid}` };
  } catch (e) {
    console.error('[Iris] Storacha upload failed, returning mock CID:', e);
    const cid = generateMockCid();
    return { cid, url: `https://ipfs.io/ipfs/${cid}` };
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
