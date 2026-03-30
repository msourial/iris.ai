/**
 * Iris.ai — Gemini Vision utility
 *
 * Activation (zero code change):
 *   Set EXPO_PUBLIC_GEMINI_API_KEY to your Google AI Studio key.
 *   If the key is absent, the module logs a warning and returns a mock description.
 *
 * Force mock (demo / CI):
 *   Set EXPO_PUBLIC_USE_MOCK_VISION=true
 */

import * as Crypto from 'expo-crypto';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const FORCE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_VISION === 'true';
const USE_MOCK = FORCE_MOCK || !GEMINI_API_KEY;

let _missingKeyWarned = false;

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const VISION_PROMPT =
  'You are assisting a visually impaired user. Describe the primary subjects in this image clearly, concisely, and directly in 1 or 2 direct sentences. Be highly accurate. No filler words.';

export interface VisionResult {
  description: string;
  hash: string;
  timestamp: string;
}

const MOCK_DESCRIPTIONS = [
  'A wooden desk with an open laptop, a coffee mug on the right, and papers scattered around. Natural light comes from a window on the left.',
  'A busy urban sidewalk with glass buildings, pedestrians walking, and a red bus stop sign. The sky is partly cloudy.',
  'A kitchen counter with a cutting board, bell peppers, onions, and a chef\'s knife. The stove is visible in the background.',
  'A living room with a gray sofa, a low wooden coffee table, and a television mounted on the wall. Books are stacked on a shelf.',
  'A park path lined with tall green trees. Two people sit on a bench in the middle distance. The grass is well-maintained.',
  'A store shelf with rows of colorful product boxes and bottles under fluorescent lighting.',
  'A crosswalk signal showing a walking figure, indicating it is safe to cross. Vehicles are stopped at the intersection.',
];

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

async function computeHash(description: string, ts: string): Promise<string> {
  const payload = `${VISION_PROMPT}|${description}|${ts}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

/**
 * Send a base64 JPEG to Gemini Vision and return the accessibility description
 * along with a SHA-256 proof hash and timestamp for on-chain verification.
 * Automatically falls back to a mock description if the API key is not set.
 */
export async function describeImage(base64: string): Promise<VisionResult> {
  if (USE_MOCK || !base64) {
    if (!GEMINI_API_KEY && !FORCE_MOCK && !_missingKeyWarned) {
      _missingKeyWarned = true;
      console.warn(
        '[Iris] EXPO_PUBLIC_GEMINI_API_KEY is not set — using mock descriptions. ' +
          'Add it in Replit Secrets to enable real Gemini Vision.'
      );
    }
    await new Promise<void>((r) => setTimeout(r, 1800 + Math.random() * 1200));
    const description = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
    const timestamp = new Date().toISOString();
    const hash = await computeHash(description, timestamp);
    return { description, hash, timestamp };
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: VISION_PROMPT },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as GeminiResponse;
      const errMsg = errBody?.error?.message ?? `HTTP ${response.status}`;
      console.error('[Iris] Gemini API error:', errMsg);
      const description = 'Could not analyze the image right now. Please try again.';
      const timestamp = new Date().toISOString();
      const hash = await computeHash(description, timestamp);
      return { description, hash, timestamp };
    }

    const json = (await response.json()) as GeminiResponse;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.warn('[Iris] Gemini returned empty text');
      const description = 'No description available. Please try again.';
      const timestamp = new Date().toISOString();
      const hash = await computeHash(description, timestamp);
      return { description, hash, timestamp };
    }

    const timestamp = new Date().toISOString();
    const hash = await computeHash(text, timestamp);
    return { description: text, hash, timestamp };
  } catch (e) {
    console.error('[Iris] Gemini fetch failed:', e);
    const description = 'Analysis failed. Check your connection and try again.';
    const timestamp = new Date().toISOString();
    const hash = await computeHash(description, timestamp);
    return { description, hash, timestamp };
  }
}
