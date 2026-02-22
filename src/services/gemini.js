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

export async function generateFusionImage(submission) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Describe a single, visually striking, artistic image that represents the concept: "${submission}".
            Use 3-5 descriptive keywords that would make for a great Unsplash search query.
            Return ONLY the keywords separated by commas. No other text.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const keywords = response.text().trim().replace(/ /g, '-');

        // Return a dynamic Unsplash source based on the AI's keywords
        return `https://images.unsplash.com/featured/?${keywords}`;
    } catch (error) {
        console.error("Gemini Image Prompt Error:", error);
        return "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop";
    }
}
