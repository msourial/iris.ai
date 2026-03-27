/**
 * vision.ts
 *
 * Sends a captured photo to the configured AI Vision API and returns a plain-
 * English description optimised for visually-impaired users.
 *
 * Defaults to the OpenAI GPT-4o vision endpoint.  Any OpenAI-compatible API
 * (Azure OpenAI, Together, Groq vision, etc.) works by setting
 * EXPO_PUBLIC_VISION_API_URL in .env.
 *
 * Environment variables (set in .env):
 *   EXPO_PUBLIC_VISION_API_KEY  – required
 *   EXPO_PUBLIC_VISION_API_URL  – optional, defaults to OpenAI
 */

import * as ImageManipulator from "expo-image-manipulator";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_VISION_API_KEY ?? "";
const API_URL =
  process.env.EXPO_PUBLIC_VISION_API_URL ??
  "https://api.openai.com/v1/chat/completions";

const VISION_PROMPT =
  "You are an accessibility assistant for visually impaired users. " +
  "Describe this image clearly and concisely in 2–4 sentences. " +
  "Start with the most important subject, then give context. " +
  "Avoid filler phrases like 'the image shows'. Speak directly.";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisionResult =
  | { ok: true; description: string }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compress and base64-encode a photo URI so the API payload stays small.
 * Resizes to max 768 px wide — enough detail for GPT-4o, fast to upload.
 */
async function photoToBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 768 } }],
    {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  if (!result.base64) throw new Error("Image manipulation produced no base64");
  return result.base64;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Describe a photo using the configured AI Vision API.
 *
 * @param photoUri  URI returned by `CameraView.takePictureAsync()`
 * @returns         VisionResult — either the description or an error message
 */
export async function describePhoto(photoUri: string): Promise<VisionResult> {
  if (!API_KEY) {
    return {
      ok: false,
      error:
        "Vision API key not configured. Add EXPO_PUBLIC_VISION_API_KEY to .env.",
    };
  }

  try {
    const base64 = await photoToBase64(photoUri);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low", // faster + cheaper; upgrade to "high" if needed
                },
              },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `API error ${response.status}: ${body}` };
    }

    const json = await response.json();
    const description: string =
      json?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!description) {
      return { ok: false, error: "API returned an empty description." };
    }

    return { ok: true, description };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message ?? "Unknown error contacting Vision API.",
    };
  }
}
