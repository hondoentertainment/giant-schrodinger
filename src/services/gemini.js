// Mock Gemini Service

export async function scoreSubmission(submission, asset1, asset2) {
    // Simulate AI latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock scoring logic
    const score = Math.floor(Math.random() * 4) + 7; // Random score 7-10
    const relevance = Math.random() > 0.5 ? "Highly Logical" : "Absurdly Creative";

    return {
        score,
        relevance,
        commentary: `An interesting bridge between ${asset1.label} and ${asset2.label}. '${submission}' is ${relevance.toLowerCase()}!`
    };
}

export async function generateFusionImage(submission) {
    // Simulate generation latency
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return a random abstract image from Unsplash as the "fusion"
    return "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop";
}
