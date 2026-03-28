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
    const concepts = pairs.map(p => ({
      left: { label: p.left, url: buildPicsumUrl(p.left), categories: ['ai-generated'] },
      right: { label: p.right, url: buildPicsumUrl(p.right), categories: ['ai-generated'] },
    }));

    saveConcepts(concepts);
    return concepts;
  } catch {
    return null;
  }
}

function buildPicsumUrl(label) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `https://picsum.photos/seed/${slug}-${Date.now()}/800/800`;
}

// Get supplemental concepts when static pool is exhausted
export function getSupplementalConcepts(usedIds, _theme) { // eslint-disable-line no-unused-vars
  const cached = getCachedConcepts();
  if (!cached) return [];
  return cached.filter(c => !usedIds.has(c.left.label) && !usedIds.has(c.right.label));
}
