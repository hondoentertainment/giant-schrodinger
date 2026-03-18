import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function scoreSubmission(submission, asset1, asset2, personality = 'chaos') {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const chaosPrompt = `
            You are the "Venn with Friends" game host, a witty, chaotic neutral, and creatively brilliant AI personality.
            You are often sarcastic, sometimes impressed, but always entertaining. Think "GLaDOS meets a sassy game show host."
        `;

        const classicPrompt = `
            You are a professional, encouraging, and fair judge for a creativity game called "Venn with Friends".
            Provide thoughtful criticism and balanced scores. Be helpful and sophisticated.
        `;

        const prompt = `
            ${personality === 'chaos' ? chaosPrompt : classicPrompt}

            Two items are being crossed in a Venn Diagram:
            Item 1: ${asset1.label}
            Item 2: ${asset2.label}
            
            The player has submitted this connection/concept for the intersection: "${submission}"
            
            Score the submission in THREE categories:
            1. Wit (1-3): Is it funny or clever?
            2. Relevance (1-3): Does it actually bridge the two items logically?
            3. Creativity (1-4): Is it unexpected and original? 

            Return a JSON object with:
            - witScore: Number (1-3)
            - relevanceScore: Number (1-3)
            - creativityScore: Number (1-4)
            - score: Number (the sum of the three sub-scores, 3-10)
            - relevance: A short phrase (e.g., "Highly Logical", "Absurdly Creative", "Total Stretch")
            - commentary: A short explanatory response. ${personality === 'chaos' ? 'Be bold, funny, or brutally honest.' : 'Be professional and constructive.'}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Gemini Scoring Error:", error);
        return {
            witScore: 2,
            relevanceScore: 2,
            creativityScore: 1,
            score: 5,
            relevance: "API Error",
            commentary: "The AI host is currently pondering the meaning of life. (Check your API key!)"
        };
    }
}

/**
 * THE SWARM: Multi-agent image generation orchestration
 * 1. The Visionary: Creates a rich scene description
 * 2. The Curator: Distills down to search terms
 * 3. The Quality Auditor: Final check and fallback
 */
export async function generateFusionImage(submission) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Agent 1: The Visionary
        const visionaryPrompt = `
            You are "The Visionary" in an AI Artist Swarm.
            Your job is to take the concept: "${submission}" and describe it as a single, visually stunning, high-definition artistic scene.
            Think in terms of lighting, composition, and mood. Be atmospheric.
            Keep your description to 2 sentences.
        `;
        const visionaryResult = await model.generateContent(visionaryPrompt);
        const scene = visionaryResult.response.text();

        // Agent 2: The Curator
        const curatorPrompt = `
            You are "The Curator" in an AI Artist Swarm.
            Read this scene description: "${scene}"
            Distill this into 3-5 highly effective, visually-specific keywords for an Unsplash image search.
            Focus on objects, colors, and textures.
            Return ONLY the keywords separated by commas.
        `;
        const curatorResult = await model.generateContent(curatorPrompt);
        let keywords = curatorResult.response.text().trim();

        // Agent 3: The Quality Auditor
        const auditorPrompt = `
            You are "The Quality Auditor" in an AI Artist Swarm.
            Evaluating these keywords for a search query: "${keywords}"
            If they are too long or contain forbidden words, simplify them to 3 core nouns.
            Otherwise, return them exactly as is.
            Return ONLY the final keywords.
        `;
        const auditorResult = await model.generateContent(auditorPrompt);
        keywords = auditorResult.response.text().trim().replace(/ /g, '-').replace(/\n/g, '');

        console.log("Swarm Keywords:", keywords);
        return `https://images.unsplash.com/featured/?${keywords}`;
    } catch (error) {
        console.error("Swarm Image Error:", error);
        // Fallback to a high-quality abstract image
        return "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop";
    }
}

/**
 * Game Flow Swarm Review
 * Provides a holistic critique of the player's performance across rounds.
 */
export async function swarmReviewGameState(scores, submissions, personality = 'chaos') {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            You are leading a "User Experience Swarm" of AI experts.
            Review these game rounds:
            ${submissions.map((s, i) => `Round ${i + 1}: "${s}" (Score: ${scores[i]}/10)`).join('\n')}

            Provide a consensus review from:
            1. The UX Researcher: Notes on the player's conceptual logic.
            2. The Game Designer: Notes on the "fun" and wit of the submissions.
            3. The Swarm Lead: A final summary and "Swarm Grade" (S, A, B, C, or D).

            Return a JSON object:
            {
              "researcherNotes": "...",
              "designerNotes": "...",
              "swarmGrade": "...",
              "finalSummary": "..."
            }
            Keep notes concise and aligned with the "${personality}" personality.
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Swarm Review Error:", error);
        return {
            researcherNotes: "The data is hazy.",
            designerNotes: "Fun levels are indeterminate.",
            swarmGrade: "A",
            finalSummary: "The swarm thinks you did... something."
        };
    }
}
