/**
 * Set to false and set EXPO_PUBLIC_GEMINI_API_KEY to use real Gemini Vision API.
 * Default true — returns realistic mock descriptions for demo purposes.
 */
export const USE_MOCK_AI = true;

const MOCK_RESPONSES = [
  'A wooden desk with a laptop computer open, a coffee mug to the right, and several papers scattered nearby. Natural light comes from a window on the left.',
  'An outdoor urban street scene with tall glass buildings, pedestrians walking on the sidewalk, and a red bus stop sign. The sky is partly cloudy.',
  'A kitchen counter with a cutting board, several vegetables including bell peppers and onions, and a chef\'s knife. The stove is visible in the background.',
  'A living room with a gray sofa, a low wooden coffee table, and a television mounted on the wall. Books are stacked on a shelf to the left.',
  'A park pathway lined with tall green trees on both sides. Two people are seated on a bench in the middle distance. The grass is well-maintained.',
  'A store shelf displaying multiple rows of colorful product boxes and bottles. The shelving is metal with fluorescent lighting overhead.',
  'A crosswalk signal showing a walking figure in white, indicating it is safe to cross. The intersection is busy with vehicles stopped at the light.',
];

const PROMPT =
  'Start with the most important subject. Be concise and direct. Avoid filler phrases like "I can see" or "In this image." Describe what you observe for someone who is blind — focus on objects, people, colors, and spatial layout.';

export async function analyzeImage(base64: string): Promise<string> {
  if (USE_MOCK_AI) {
    const delay = 2000 + Math.random() * 1500;
    await new Promise<void>((r) => setTimeout(r, delay));
    return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  }

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Iris] EXPO_PUBLIC_GEMINI_API_KEY not set, using mock');
    return MOCK_RESPONSES[0];
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
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
            temperature: 0.4,
          },
        }),
      }
    );

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() ?? 'Unable to analyze image. Please try again.';
  } catch (e) {
    console.error('[Iris] Gemini API error:', e);
    return 'Analysis failed. Please try again.';
  }
}
