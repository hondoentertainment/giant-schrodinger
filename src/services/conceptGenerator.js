const CONCEPT_CACHE_KEY = 'venn_generated_concepts';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedConcepts() {
  try {
    const cached = JSON.parse(localStorage.getItem(CONCEPT_CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.concepts;
    }
  } catch { /* ignore parse errors */ }
  return null;
}

function saveConcepts(concepts) {
  localStorage.setItem(CONCEPT_CACHE_KEY, JSON.stringify({
    concepts,
    timestamp: Date.now(),
  }));
}

async function attachResolvedImages(pairs) {
  const { resolveImageUrls } = await import('./imageResolve');
  const { buildPicsumFallback } = await import('../lib/imageUrls');

  const labels = pairs.flatMap((pair) => [pair.left, pair.right]);
  const resolved = await resolveImageUrls(labels);

  return pairs.map((pair) => {
    const left = resolved[pair.left] || { url: buildPicsumFallback(pair.left), fallbackUrl: buildPicsumFallback(pair.left) };
    const right = resolved[pair.right] || { url: buildPicsumFallback(pair.right), fallbackUrl: buildPicsumFallback(pair.right) };

    return {
      left: {
        label: pair.left,
        url: left.url,
        fallbackUrl: left.fallbackUrl || buildPicsumFallback(pair.left),
        categories: ['ai-generated'],
      },
      right: {
        label: pair.right,
        url: right.url,
        fallbackUrl: right.fallbackUrl || buildPicsumFallback(pair.right),
        categories: ['ai-generated'],
      },
    };
  });
}

// Generate concept pairs via AI
export async function generateConceptPairs(theme, count = 5) {
  // Check cache first
  const cached = getCachedConcepts();
  if (cached?.length >= count) return cached.slice(0, count);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `Generate ${count} surprising concept pairs for a creative word game. Theme: "${theme}".
Each pair should be two unrelated concepts that could have a clever, witty connection.
Return JSON array: [{"left": "concept1", "right": "concept2"}]
Be specific and vivid. Avoid generic words. Examples: "Rubber Duck" not "Toy", "3AM Taxi Ride" not "Transportation".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const pairs = JSON.parse(jsonMatch[0]);
    const concepts = await attachResolvedImages(pairs);

    saveConcepts(concepts);
    return concepts;
  } catch {
    return null;
  }
}

// Get supplemental concepts when static pool is exhausted
export function getSupplementalConcepts(usedIds, _theme) { // eslint-disable-line no-unused-vars
  const cached = getCachedConcepts();
  if (!cached) return [];
  return cached.filter(c => !usedIds.has(c.left.label) && !usedIds.has(c.right.label));
}
