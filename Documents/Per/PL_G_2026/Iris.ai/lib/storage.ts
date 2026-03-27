/**
 * storage.ts
 *
 * Storacha / IPFS upload service for Iris.ai.
 *
 * Uses the Storacha (web3.storage) HTTP API — no native modules, no Node.js
 * polyfills required. React Native's built-in fetch handles both local
 * file:// URIs and the outbound HTTPS upload.
 *
 * Setup:
 *   1. Create an account at https://storacha.network
 *   2. Create a Space and generate an API token in the console
 *   3. Add the token to .env:  EXPO_PUBLIC_STORACHA_API_KEY=<your-token>
 *
 * The returned CID is passed directly to the IrisBounty CreateRequest
 * Cadence transaction as the `cid` argument.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Storacha HTTP upload endpoint (legacy API — Bearer-token auth). */
const UPLOAD_URL = "https://api.web3.storage/upload";

/** IPFS gateway for constructing viewable URLs from a CID. */
const GATEWAY = "https://w3s.link/ipfs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadResult {
  /** The IPFS CID (e.g. "bafybeiexample…"). Pass this to CreateRequest. */
  cid: string;
  /** Fully qualified IPFS URL for previewing the image in-app. */
  url: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function requireApiKey(): string {
  const key = process.env.EXPO_PUBLIC_STORACHA_API_KEY;
  if (!key) {
    throw new Error(
      "Storacha API key is not configured.\n" +
        "Set EXPO_PUBLIC_STORACHA_API_KEY in your .env file.\n" +
        "Get a token at https://storacha.network"
    );
  }
  return key;
}

/**
 * Infer Content-Type from the image URI extension.
 * Expo Camera and Image Picker typically produce .jpg files; default to that.
 */
function inferContentType(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
  };
  return map[ext] ?? "image/jpeg";
}

/** Extract a human-readable filename from a URI. */
function extractFilename(uri: string): string {
  return uri.split("/").pop() ?? "image.jpg";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upload an image to Storacha/IPFS and return the IPFS CID.
 *
 * @param imageUri  Local file URI from expo-camera or expo-image-picker
 *                  (e.g. "file:///var/mobile/…/Camera/IMG_001.jpg")
 * @returns         Object containing the CID and a gateway URL
 *
 * @throws          If the API key is missing, the file can't be read,
 *                  or the upload fails
 */
export async function uploadVisionRequest(
  imageUri: string
): Promise<UploadResult> {
  const apiKey = requireApiKey();

  // Step 1: Read the local image into a Blob.
  // React Native's fetch() supports file:// and content:// URIs natively.
  let blob: Blob;
  try {
    const fileResponse = await fetch(imageUri);
    blob = await fileResponse.blob();
  } catch (err) {
    throw new Error(`Could not read image from URI: ${imageUri}\n${err}`);
  }

  const filename = extractFilename(imageUri);
  const contentType = inferContentType(imageUri);

  // Step 2: POST the raw image body to Storacha.
  // X-NAME sets the filename stored in the IPFS CAR.
  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": contentType,
        "X-NAME": filename,
      },
      body: blob,
    });
  } catch (err) {
    throw new Error(`Storacha upload request failed — check network: ${err}`);
  }

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => "(no body)");
    throw new Error(
      `Storacha upload failed with status ${uploadResponse.status}: ${body}`
    );
  }

  // Step 3: Extract the CID from the JSON response { cid: "bafybei…" }
  const data = (await uploadResponse.json()) as { cid?: string };
  if (!data.cid) {
    throw new Error(
      "Storacha response did not contain a CID — the upload may have failed"
    );
  }

  return {
    cid: data.cid,
    url: `${GATEWAY}/${data.cid}`,
  };
}

/**
 * Convenience: return the public IPFS gateway URL for an existing CID.
 * Useful for rendering previously uploaded images in the History screen.
 */
export function ipfsUrl(cid: string): string {
  return `${GATEWAY}/${cid}`;
}
